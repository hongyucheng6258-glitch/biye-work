[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$scriptPath = Join-Path $PSScriptRoot 'sync-local-db-to-docker.ps1'
$source = Get-Content -LiteralPath $scriptPath -Raw
$tokens = $null
$parseErrors = $null
[System.Management.Automation.Language.Parser]::ParseInput($source, [ref]$tokens, [ref]$parseErrors) | Out-Null
if ($parseErrors.Count -gt 0) {
    $messages = ($parseErrors | ForEach-Object { $_.Message }) -join '; '
    throw "同步脚本 PowerShell 语法错误：$messages"
}

if ($source -match 'Invoke-Expression') {
    throw '同步脚本不允许使用 Invoke-Expression。'
}
if ($source -match '(?m)^\s*[^#\r\n]*\s<\s*[^#\r\n]+') {
    throw '同步脚本不允许使用 shell 文件重定向。'
}
if ($source -notmatch 'ArgumentList\.Add') {
    throw '同步脚本必须通过 ProcessStartInfo.ArgumentList 保持参数边界。'
}
if ($source -notmatch 'RedirectStandardInput') {
    throw '同步脚本必须通过标准输入导入 SQL 文件。'
}
if ($source -notmatch 'mismatch.*触发回滚') {
    throw '最终一致性失败必须触发回滚。'
}

Write-Output 'sync-local-db-to-docker static safety checks: PASS'
