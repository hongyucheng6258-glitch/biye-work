# 浏览器回归与真实流程测试

本目录有两类浏览器检查：API 拦截的交互回归脚本，以及会访问真实后端并写入数据的 E2E 流程。后者必须在隔离的 Docker Compose 项目中运行，不能指向正在使用的开发库或生产环境。

## API 拦截的交互回归

需要 Playwright、Chrome，以及运行在 5173 / 5174 的学生端与管理端。请求中的 `/api/` 会被测试拦截，写操作不会进入业务数据库。截图写入系统临时目录 `campus-browser-checks`，可通过 `CAMPUS_TEST_OUTPUT` 修改。

从仓库根目录运行：

```powershell
# 需要指定 Playwright 时，设置 PLAYWRIGHT_PATH 为其模块目录
node tests/browser/system-interactions.cjs
node tests/browser/system-all-rooms.cjs
node tests/browser/system-auth.cjs
node tests/browser/system-admin.cjs
node tests/browser/system-scene-and-fallback.cjs
```

- `interactions`：服务房间进入、活动报名、筛选返回、房间内私信、全屏弹窗、Esc 和窄屏布局。
- `all-rooms`：其余服务房间的原组件加载及筛选参数。
- `auth`：403 保持会话、失败重试和 401 登录跳转。
- `admin`：请求失败与空待办的区分、重试、图表窄屏适配。
- `scene-and-fallback`：3D 场景与异常回退。

已知问题：当前 `system-scene-and-fallback.cjs` 在“离开服务后 3D 场景仍在”断言处失败；其余交互回归脚本可独立执行。

这些检查验证页面交互和请求约定，不替代真实数据库、文件上传、AI 服务、WebSocket 或并发验证。

## 隔离 Docker 真实 E2E

`e2e/run-all.cjs` 通过浏览器和真实 HTTP 接口测试登录、审核、交易、活动、失物、社交、消息、上传、搜索、3D 和并发等流程。测试会创建 `E2E_` 账号和业务记录。仓库演示 SQL 会清空目标库并写入固定测试账号，所以本流程使用全新的 Compose 项目、MySQL/Redis 容器和命名卷。

### 准备

- Docker Compose v2、Node.js、Playwright 和 Chrome。
- 本机可用端口：后端 18080、学生端 15173、管理端 15174。若端口被占用，改端口变量时同步改对应的 `E2E_*_URL`。
- 本地 Playwright 未加入 Node 模块搜索路径时，设置 `PLAYWRIGHT_PATH` 为 Playwright 模块目录；可通过 `PLAYWRIGHT_CHROMIUM_EXECUTABLE` 指定 Chrome/Chromium 可执行文件。
- E2E 图片流程需要本机测试图片：`测试素材/02-机械键盘.png`、`测试素材/03-山地自行车.png`、`测试素材/05-校园晚霞.png`。默认目录是仓库根目录下的 `测试素材`；图片目录在其他位置时设置 `E2E_TEST_ASSET_DIR`。图片素材未随源码提交；缺少素材会明确报告阻塞。

在 PowerShell 中，从仓库根目录执行以下内容。变量仅存在于当前 PowerShell 进程，不会写入 `.env` 或仓库：

```powershell
$e2eProject = "ai-campus-e2e-$((Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss'))"
$env:MYSQL_ROOT_PASSWORD = [guid]::NewGuid().ToString('N')
$env:MYSQL_DB = 'ai_campus_platform'
$env:REDIS_PASSWORD = [guid]::NewGuid().ToString('N')
$env:JWT_SECRET = [guid]::NewGuid().ToString('N')
$env:SIGNIN_SECRET = [guid]::NewGuid().ToString('N')
$env:AI_API_KEY = ''
$env:BACKEND_PORT = '18080'
$env:STUDENT_PORT = '15173'
$env:ADMIN_PORT = '15174'
$env:TRUSTED_ORIGINS = 'http://localhost,http://localhost:15173,http://localhost:15174,http://127.0.0.1:15173,http://127.0.0.1:15174'
$env:E2E_TEST_ASSET_DIR = (Join-Path (Get-Location) '测试素材')
$env:E2E_BACKEND_URL = 'http://localhost:18080'
$env:E2E_STUDENT_WEB_URL = 'http://localhost:15173'
$env:E2E_ADMIN_WEB_URL = 'http://localhost:15174'
$env:E2E_TEST_PASSWORD = ([guid]::NewGuid().ToString('N').Substring(0, 12) + 'Aa1!')
$env:E2E_ADMIN_PASSWORD = 'admin123'

docker compose -p $e2eProject -f docker-compose.yml -f docker-compose.e2e.yml up -d --build
docker compose -p $e2eProject -f docker-compose.yml -f docker-compose.e2e.yml ps
```

Compose 项目名每次不同，因此测试会使用独立容器、网络和卷。种子脚本固定选择数据库名 `ai_campus_platform`，所以隔离通过独立 MySQL 容器和数据卷实现，而不是修改数据库名。

### 运行核心流程

类别 `15-ai` 会调用外部 AI 提供商，可能产生请求费用；为保持测试隔离，本流程不运行该类别。`16-AI故障处理` 不调用外部模型，可以保留在本次测试中。

```powershell
$onlyCoreE2e = '01,02,03,04,05,06,07,08,09,10,11,12,13,14,16,17,18,19,20'
node tests/browser/e2e/run-all.cjs "--only=$onlyCoreE2e"
```

Playwright 截图和 JSON 结果默认写入系统临时目录。结果状态为 `PASS`、`FAIL`、`BLOCK` 或 `UNCOVERED`；不要把未运行的类别报告为通过。
只要有 `FAIL`、`BLOCK` 或类别运行时异常，脚本就会以非零状态退出，便于自动化环境识别未通过或未完成的运行。`UNCOVERED` 会保留在报告中，但不单独判为失败。

### 清理隔离服务

在启动测试的同一个 PowerShell 窗口中运行，`down -v` 只删除本次唯一项目名下的测试容器和数据卷：

```powershell
docker compose -p $e2eProject -f docker-compose.yml -f docker-compose.e2e.yml down -v
```

这不会停止主 `ai-campus` 项目。主服务的数据库不作为本测试目标，也不要对主项目运行 `down -v`。
