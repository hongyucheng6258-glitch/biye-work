# ============================================================
# 本地 MySQL → Docker MySQL 数据库同步脚本（R1 复查修复版）
#
# 用途：
#   把本地开发库同步到 Docker 部署库，避免两端 schema/数据不一致。
#
# 安全设计（按复查要求重写）：
#   1) 字节安全导入：使用 .NET 进程参数和标准输入，不依赖 shell 文件重定向（PowerShell 不支持），
#      改用 Start-Process -RedirectStandardInput 直接以文件句柄喂入，中文/emoji 字节不变。
#   2) 先验证后应用：导入前把「本地备份」先导入临时库 _sync_verify_<ts>，
#      用准确 COUNT(*) 与 CHECKSUM TABLE 验证备份完整可恢复；不通过则中止，不动目标库。
#   3) 无无条件 DROP：不再先 DROP 全部业务表再碰运气导入；mysqldump 自带的
#      per-table DROP TABLE IF EXISTS 只在「备份已验证可恢复」之后才执行。
#   4) 失败自动回滚：导入/校验任一步失败，立即用「目标库导入前备份」自动回滚目标库再报错。
#   5) 同实例保护：源与目标指向同一 MySQL 实例且同一库时直接拒绝（防止自删）。
#   6) 精确一致性：用 COUNT(*)（准确值）+ CHECKSUM TABLE（内容哈希）逐表比对，
#      不使用 information_schema.table_rows 估算值。
#   7) 环境专属配置显式保留：$ExcludeTables（默认 ai_config / system_config）
#      从目标同步中排除，部署环境的 API Key / 系统配置不被本地覆盖。
#   8) 备份目录加入 .gitignore，不进版本库。
#
# 用法：
#   .\sync-local-db-to-docker.ps1                          # 仅预览差异
#   .\sync-local-db-to-docker.ps1 -Apply                   # 验证备份后导入 Docker 库
#   .\sync-local-db-to-docker.ps1 -DockerHost 127.0.0.1 -DockerPort 3307 -Apply
#
# 前置：mysql / mysqldump 客户端在 PATH（或 -MysqlDir 指定），Docker MySQL 已启动。
# ============================================================

[CmdletBinding()]
param(
    [string]$MysqlDir = '',
    [string]$LocalHost = '127.0.0.1',
    [int]$LocalPort = 3306,
    [string]$LocalUser = 'root',
    [string]$LocalPassword = '',
    [string]$LocalDb = 'ai_campus_platform',
    [string]$DockerHost = '127.0.0.1',
    [int]$DockerPort = 3307,
    [string]$DockerUser = 'root',
    [string]$DockerPassword = '',
    [string]$DockerDb = 'ai_campus_platform',
    [switch]$Apply,
    [string]$BackupDir = 'db-backups',
    # 环境专属表：部署环境独立持有，默认不从本地覆盖（显式保留，勿静默覆盖）
    [string[]]$ExcludeTables = @('ai_config', 'system_config')
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

function Resolve-MysqlBin {
    if ($MysqlDir) {
        return @((Join-Path $MysqlDir 'mysqldump.exe'), (Join-Path $MysqlDir 'mysql.exe'))
    }
    return @((Get-Command mysqldump -ErrorAction Stop).Source, (Get-Command mysql -ErrorAction Stop).Source)
}

# Execute a native program without string interpolation. ArgumentList preserves each
# argument boundary, while MYSQL_PWD keeps passwords out of command-line/error text.
function Invoke-Native {
    param(
        [Parameter(Mandatory)] [string]$Exe,
        [string[]]$ArgsList = @(),
        [string]$StdinFile = '',
        [string]$Password = ''
    )
    $psi = [System.Diagnostics.ProcessStartInfo]::new()
    $psi.FileName = $Exe
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.RedirectStandardInput = [bool]$StdinFile
    foreach ($arg in $ArgsList) {
        [void]$psi.ArgumentList.Add([string]$arg)
    }
    if ($Password) {
        $psi.Environment['MYSQL_PWD'] = $Password
    }
    $process = [System.Diagnostics.Process]::new()
    $process.StartInfo = $psi
    if (-not $process.Start()) {
        throw "无法启动外部程序：$Exe"
    }
    if ($StdinFile) {
        $input = [System.IO.File]::OpenRead($StdinFile)
        try {
            $input.CopyTo($process.StandardInput.BaseStream)
        } finally {
            $input.Dispose()
            $process.StandardInput.Close()
        }
    }
    $stdout = $process.StandardOutput.ReadToEnd()
    $stderr = $process.StandardError.ReadToEnd()
    $process.WaitForExit()
    if ($process.ExitCode -ne 0) {
        throw "命令失败（退出码 $($process.ExitCode)）：$Exe $($ArgsList -join ' ')；$($stderr.Trim())"
    }
    return [pscustomobject]@{ Output = $stdout; Error = $stderr }
}

function Invoke-MySqlArgs {
    param([string]$Exe, [string[]]$ArgsList, [string]$Password = '')
    [void](Invoke-Native -Exe $Exe -ArgsList $ArgsList -Password $Password)
}

# 字节安全导入：直接把备份文件复制到 mysql stdin，不经过控制台代码页。
function Import-SqlFile {
    param([string]$MysqlExe, [string]$HostAddr, [int]$Port, [string]$User, [string]$Pass, [string]$Db, [string]$SqlFile)
    $list = @('-h', $HostAddr, '-P', $Port, '-u', $User, '--default-character-set=utf8mb4', '--binary-mode', '-D', $Db)
    try {
        [void](Invoke-Native -Exe $MysqlExe -ArgsList $list -StdinFile $SqlFile -Password $Pass)
    } catch {
        throw "导入文件失败：$SqlFile → $HostAddr`:$Port/$Db；$($_.Exception.Message)"
    }
}

function Get-SqlScalar {
    param([string]$MysqlExe, [string]$HostAddr, [int]$Port, [string]$User, [string]$Pass, [string]$Sql)
    $list = @('-h', $HostAddr, '-P', $Port, '-u', $User, '--default-character-set=utf8mb4', '-N', '-B', '-e', $Sql)
    try {
        $result = Invoke-Native -Exe $MysqlExe -ArgsList $list -Password $Pass
    } catch {
        throw "查询失败：$Sql；$($_.Exception.Message)"
    }
    return ($result.Output -split "`r?`n" | Where-Object { $_ -ne $null -and $_ -ne '' })
}

# 准确行数（COUNT(*)，非 information_schema 估算）+ CHECKSUM TABLE
function Get-TableDigest {
    param([string]$MysqlExe, [string]$HostAddr, [int]$Port, [string]$User, [string]$Pass, [string]$Db)
    $tables = Get-SqlScalar $MysqlExe $HostAddr $Port $User $Pass "SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA='$Db' AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME;"
    $map = @{}
    foreach ($t in $tables) {
        $count = (Get-SqlScalar $MysqlExe $HostAddr $Port $User $Pass "SELECT COUNT(*) FROM ``$Db``.``$t``;") | Select-Object -First 1
        $cs = (Get-SqlScalar $MysqlExe $HostAddr $Port $User $Pass "CHECKSUM TABLE ``$Db``.``$t``;") | Select-Object -First 1
        # CHECKSUM TABLE 输出：db.table\tchecksum\crc32/0
        $checksum = ''
        if ($cs) { $parts = $cs -split "`t"; $checksum = $parts[1] }
        $map[$t] = [pscustomobject]@{ Count = [long]$count; Checksum = "$checksum" }
    }
    return $map
}

function Backup-Database {
    param([string]$MysqldumpExe, [string]$HostAddr, [int]$Port, [string]$User, [string]$Pass, [string]$Db, [string]$Tag, [string[]]$ExtraArgs = @())
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $file = Join-Path $BackupDir "${Db}-${Tag}-${stamp}.sql"
    # --result-file 直接落盘，绕开控制台代码页；--single-transaction 一致性快照。
    $list = @('-h', $HostAddr, '-P', $Port, '-u', $User,
        '--default-character-set=utf8mb4', '--single-transaction', '--routines', '--triggers')
    $list += $ExtraArgs
    $list += @('--result-file', $file, $Db)
    try {
        [void](Invoke-Native -Exe $MysqldumpExe -ArgsList $list -Password $Pass)
    } catch {
        throw "备份 $Db@$HostAddr`:$Port 失败；$($_.Exception.Message)"
    }
    Write-Host "[OK] 已备份 $Db（$Tag）→ $file" -ForegroundColor Green
    return $file
}

function Ensure-Gitignore {
    # 脚本位于 <repo>/docker/scripts/，.gitignore 在仓库根
    $repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
    $gi = Join-Path $repoRoot '.gitignore'
    $entry = "/$($BackupDir -replace '\\','/')/"
    if (-not (Test-Path $gi)) { New-Item -ItemType File -Path $gi | Out-Null }
    $lines = [System.IO.File]::ReadAllLines($gi)
    if ($lines -notcontains $entry) {
        Add-Content -Path $gi -Value "`n# DB 同步备份（含数据，禁止入库）`n$entry" -Encoding UTF8
        Write-Host "[OK] $gi 已加入 $entry"
    }
}

# ---------- 1. 环境检查 + 同实例保护 ----------
$bins = Resolve-MysqlBin
$mysqldumpExe = $bins[0]; $mysqlExe = $bins[1]
Write-Host "mysqldump: $mysqldumpExe"; Write-Host "mysql    : $mysqlExe"

$sameHostPort = ($LocalHost -eq $DockerHost) -and ($LocalPort -eq $DockerPort)
if ($sameHostPort -and ($LocalDb -eq $DockerDb)) {
    throw "源库与目标库指向同一 MySQL 实例的同一个库（$LocalHost`:$LocalPort/$LocalDb），拒绝执行以免自删数据。"
}

Ensure-Gitignore

# ---------- 2. 备份源/目标库（回滚点） ----------
# 源库 dump 时直接 --ignore-table 排除环境专属表：备份、临时库验证、目标导入全程都不含它们，
# 目标侧的部署环境配置（API Key / 系统配置）天然不被覆盖。
$ignoreArgs = @()
foreach ($t in $ExcludeTables) { $ignoreArgs += "--ignore-table=$LocalDb.$t" }
$localBackup = Backup-Database $mysqldumpExe $LocalHost $LocalPort $LocalUser $LocalPassword $LocalDb 'local' $ignoreArgs
if ($Apply) {
    $dockerBackup = Backup-Database $mysqldumpExe $DockerHost $DockerPort $DockerUser $DockerPassword $DockerDb 'docker' @()
}

# ---------- 3. 差异预览（准确 COUNT(*)，非估算值） ----------
Write-Host "`n===== 差异预览（COUNT(*) 准确值）=====`n" -ForegroundColor Cyan
$localDigest = Get-TableDigest $mysqlExe $LocalHost $LocalPort $LocalUser $LocalPassword $LocalDb
$dockerDigest = Get-TableDigest $mysqlExe $DockerHost $DockerPort $DockerUser $DockerPassword $DockerDb

$allTables = ($localDigest.Keys + $dockerDigest.Keys) | Sort-Object -Unique
Write-Host ("{0,-32} {1,-10} {2,-10} {3}" -f 'TABLE','LOCAL','DOCKER','备注')
Write-Host ('-' * 80)
foreach ($t in $allTables) {
    $lr = $localDigest[$t]; $dr = $dockerDigest[$t]
    if ($ExcludeTables -contains $t) {
        Write-Host ("{0,-32} {1,-10} {2,-10} 环境专属，不同步（保留部署侧）" -f $t, ($lr.Count), ($dr.Count)) -ForegroundColor DarkCyan
        continue
    }
    if (-not $dr) { Write-Host ("{0,-32} {1,-10} {2,-10} 仅本地存在" -f $t, $lr.Count, '-') -ForegroundColor Yellow; continue }
    if (-not $lr) { Write-Host ("{0,-32} {1,-10} {2,-10} 仅 Docker 存在（将保留，除非备份覆盖）" -f $t, '-', $dr.Count) -ForegroundColor Yellow; continue }
    if ($lr.Checksum -eq $dr.Checksum -and $lr.Count -eq $dr.Count) {
        Write-Host ("{0,-32} {1,-10} {2,-10} 一致（checksum 相同）" -f $t, $lr.Count, $dr.Count) -ForegroundColor DarkGray
    } else {
        Write-Host ("{0,-32} {1,-10} {2,-10} 不一致" -f $t, $lr.Count, $dr.Count) -ForegroundColor Yellow
    }
}
if ($ExcludeTables.Count) {
    Write-Host "`n注意：$($ExcludeTables -join ', ') 为环境专属表，已排除同步。" -ForegroundColor Cyan
}

if (-not $Apply) {
    Write-Host "`n未加 -Apply，仅预览，未写入 Docker 库。" -ForegroundColor Magenta
    exit 0
}

# ---------- 4. 先在临时库验证本地备份可完整恢复 ----------
Write-Host "`n===== 第 1 步：临时库验证备份可恢复 =====" -ForegroundColor Cyan
$verifyDb = "_sync_verify_$(Get-Date -Format 'yyyyMMddHHmmss')"
try {
    $createVerify = "CREATE DATABASE ``$verifyDb`` DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_general_ci;"
    Invoke-MySqlArgs $mysqlExe @('-h', $DockerHost, '-P', $DockerPort, '-u', $DockerUser, '--default-character-set=utf8mb4', '-e', $createVerify) $DockerPassword
    Import-SqlFile $mysqlExe $DockerHost $DockerPort $DockerUser $DockerPassword $verifyDb $localBackup
    $verifyDigest = Get-TableDigest $mysqlExe $DockerHost $DockerPort $DockerUser $DockerPassword $verifyDb
    $badVerify = 0
    foreach ($t in $localDigest.Keys) {
        if ($ExcludeTables -contains $t) { continue }
        $vd = $verifyDigest[$t]
        if (-not $vd -or $vd.Count -ne $localDigest[$t].Count -or $vd.Checksum -ne $localDigest[$t].Checksum) {
            Write-Host "临时库验证失败：表 $t 行数/校验和不一致" -ForegroundColor Red
            $badVerify++
        }
    }
    if ($badVerify -gt 0) { throw "本地备份 $localBackup 在临时库恢复校验失败（$badVerify 张表），中止，未改动目标库。" }
    Write-Host "[OK] 本地备份在临时库恢复并逐表对齐（COUNT+CHECKSUM）。" -ForegroundColor Green
} finally {
    try {
        $dropVerify = "DROP DATABASE IF EXISTS ``$verifyDb``;"
        Invoke-MySqlArgs $mysqlExe @('-h', $DockerHost, '-P', $DockerPort, '-u', $DockerUser, '--default-character-set=utf8mb4', '-e', $dropVerify) $DockerPassword
    } catch {
        Write-Host "[!!] 临时验证库清理失败：$($_.Exception.Message)" -ForegroundColor Red
    }
}

# ---------- 5. 导入目标库（备份已验证；失败自动回滚） ----------
Write-Host "`n===== 第 2 步：导入目标库（失败自动回滚） =====" -ForegroundColor Cyan
try {
    # 只把「非排除表」的本地 dump 过滤进目标库：先在临时库已验证的备份直接导入；
    # 目标库业务表由 mysqldump 的 per-table DROP/CREATE 接管（不再先无条件 DROP）。
    Import-SqlFile $mysqlExe $DockerHost $DockerPort $DockerUser $DockerPassword $DockerDb $localBackup
    Write-Host "`n===== 第 3 步：最终一致性复核 =====" -ForegroundColor Cyan
    $finalDigest = Get-TableDigest $mysqlExe $DockerHost $DockerPort $DockerUser $DockerPassword $DockerDb
    $mismatch = 0
    foreach ($t in $localDigest.Keys) {
        if ($ExcludeTables -contains $t) { continue }
        $fd = $finalDigest[$t]
        if (-not $fd -or $fd.Count -ne $localDigest[$t].Count -or $fd.Checksum -ne $localDigest[$t].Checksum) {
            $actual = if ($fd) { "count=$($fd.Count) checksum=$($fd.Checksum)" } else { '表不存在' }
            Write-Host "表 $t 未对齐：本地 count=$($localDigest[$t].Count) checksum=$($localDigest[$t].Checksum) / Docker $actual" -ForegroundColor Red
            $mismatch++
        }
    }
    if ($mismatch -gt 0) {
        throw "有 $mismatch 张表未对齐，触发回滚。"
    }
    Write-Host "全部 $($localDigest.Count - $ExcludeTables.Count) 张参与同步的表 COUNT 与 CHECKSUM 一致，同步完成。" -ForegroundColor Green
    Write-Host "环境专属表 $($ExcludeTables -join ', ') 已保留部署侧数据未被覆盖。" -ForegroundColor Cyan
} catch {
    $primaryError = $_.Exception
    Write-Host "[!!] 导入或最终校验失败，开始用导入前备份自动回滚…" -ForegroundColor Red
    try {
        Import-SqlFile $mysqlExe $DockerHost $DockerPort $DockerUser $DockerPassword $DockerDb $dockerBackup
        Write-Host "[OK] 已用 $dockerBackup 回滚目标库。" -ForegroundColor Green
    } catch {
        throw "原始错误：$($primaryError.Message)；回滚也失败，请使用备份文件 $dockerBackup 手工恢复。"
    }
    throw $primaryError
}
