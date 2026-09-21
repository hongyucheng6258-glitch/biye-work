# 第三轮修复复查

结论：上轮多项缺陷已有实质修复，但仍不能全部验收。以下为当前代码中可定位的问题，未修改业务代码或数据库。

## 验证结果

- 后端重新执行 `mvn clean test`：236 项通过，0 失败、0 错误、0 跳过。不是沿用上轮 237 的计数。
- 学生端 55 项、管理端 10 项测试通过；两端生产构建通过。
- 本轮重跑 `system-auth.cjs`、`system-admin.cjs`、`system-interactions.cjs`：全部通过，无脚本记录的页面错误。业务接口为模拟接口，不是真实报名/数据库操作。
- PowerShell 外部进程参数复现：`Start-Process -ArgumentList @(..., '-e', 'CREATE DATABASE test DEFAULT CHARSET utf8mb4;')` 接收为 `-e`, `CREATE`, `DATABASE`, `test`, ... 多个参数，SQL 未作为一个参数传入。只使用打印参数的小程序，没有执行任何数据库命令。
- Docker 引擎管道不可连接；未运行真实数据库并发、部署资源、Redis、AI、上传与 WebSocket 联调。

## 剩余问题（路径相对项目根目录）

### 1. [P1] 新增静态规则会拦截后端图片代理

位置：`docker/nginx/student.conf:8`、`:32`；`docker/nginx/admin.conf:10`、`:27`。

普通 `/api/` 前缀不能阻止后面的正则 location 匹配。现有 `AssetController` 支持 `/api/assets/{bucket}/**`，`MinioUtils` 会生成带 `.png/.jpg` 等后缀的这种地址。新增后缀正则把这些请求当作前端磁盘文件处理，返回 404，而不是代理后端。影响使用该资源路径的图片，不是所有数据库上传图片都会受影响。

修改：给 API 前缀明确优先级（例如 `location ^~ /api/`），或把静态匹配限制到真正的前端资源目录。验收真实 `/api/assets/.../photo.png` 能代理，前端缺失图片仍返回 404，两套入口分别验证。

### 2. [P1] 数据同步仍不能正常创建验证库，失败回滚也未覆盖最终校验

位置：`docker/scripts/sync-local-db-to-docker.ps1:59`、`:61`、`:72`、`:187`、`:201`、`:224`。

虽然已经移除 PowerShell 的 `<` 导入语法，但 Start-Process 的 ArgumentList 数组会拼接为命令行，不能自动保留每个元素的边界。创建临时库的 SQL 带空格、未作外部参数引用，传到 mysql 后被拆开；本轮已用相同传参方法安全复现。包含空格的密码也有同类问题。finally 中的清理命令同样受影响，并可能掩盖原始异常。

此外，只有 Import-SqlFile 抛异常会触发回滚；最终 COUNT/CHECKSUM 不一致只执行 exit 1，与脚本声明的“导入/校验任一步失败自动回滚”不符。

修改：使用真正保持参数边界的进程启动 API，或适配当前运行时的可靠参数引用；不要拼出包含密码的错误文本。将最终校验纳入可回滚阶段；验证源目标身份与完整恢复结果。目标原先不存在、导入中新建的对象也需纳入恢复方案，不能仅导入旧 dump 就宣称完全回滚。

本轮没有执行 `-Apply`。在隔离数据库验证成功前不要用其同步业务库。

### 3. [P2] AI 的 401 处理没有清除失效登录态

位置：`web/frontend/student/src/views/ai/ChatView.vue:283`，对照 `web/frontend/student/src/utils/request.js` 的 `handleResponseAction()`。

流式错误分支目前只调用 router.replace('/login')，没有清除 token、userInfo，也没有发出 auth-expired 事件。于是系统仍把用户视为已登录，后续请求继续携带坏令牌，和普通请求的错误处理不一致。

修改：把普通请求现有的清理与导航流程提取成共享方法，支持房内路由，并由 SSE 调用。测试 HTTP 200+JSON 401 后：缓存令牌清空、登录状态更新、房内打开登录；403 不清状态，503 保留登录。现有普通请求鉴权浏览器测试不能证明此流式分支正确。

### 4. [P2] 认领与归还的锁顺序仍相反

位置：`web/backend/src/main/java/com/campus/platform/module/lostfound/service/LostFoundService.java:130`、`:193`、`:243`、`:248`。

claim/handleClaim 先锁父信息，再访问或更新认领行；confirmReturn 却先更新认领行（持有子行锁），再锁父信息，和注释声称的“同一锁顺序”相反。归还与重复认领/处理请求并发时，可以形成一方持父锁等子锁、另一方持子锁等父锁的死锁，导致一个操作回滚报错。

修改：确认权限后先锁父行，再做认领状态条件更新；所有入口使用相同顺序。用两个真实 MySQL 事务验证交错请求。原先 claim 加锁前建立旧快照的问题已经改掉，不再重复报告为未修复。

### 5. [P2] 配置校验仍只检查格式，不检查业务范围

位置：`web/backend/src/main/java/com/campus/platform/module/site/service/SystemConfigService.java:171`。

int 只用正则接受整数形式，因此负数和超过 Java int 范围的长数字也能保存。比如 `chat_message_max_length=-1` 会让 ChatService 拒绝所有非空文字消息，`chat_rate_per_sec=-1` 会让发送始终超过限制。内置键还能通过改成 string 绕过数值格式检查。

修改：按配置键定义固定类型和合法上下限，真正解析并检查溢出；内置键不允许修改类型。明确空值/零值含义，非法值应在写数据库之前被拒绝。afterCommit 刷新和原子快照已修复。

### 6. [P2] 管理员撤销的时间精度存在同秒重新登录边界

位置：`web/backend/src/main/java/com/campus/platform/utils/JwtUtils.java:53`、`:77`；`web/backend/src/main/java/com/campus/platform/module/admin/service/AdminPermissionService.java:56`、`:87`。

撤销时间记录毫秒，而 JWT 标准 iat 经现有 JWT 库序列化是秒级。改角色后在同一秒签发的新 token，其还原 iat 可能仍小于撤销毫秒数，被误判为旧令牌。当前测试使用撤销时间前后 60 秒的人工数值，未验证真实 token 的这个边界。本项为代码边界审查，未运行真实登录接口复现。

修改：优先用单调递增的令牌版本，或显式保持精度且处理竞态的签发方案。增加真实 JwtUtils 生成和解析、同秒撤销后重登测试；不要以清空撤销记录为解决办法。

### 7. [P2] service_healthy 仍未等同依赖就绪

位置：`docker-compose.yml` 后端 healthcheck；`web/backend/src/main/java/com/campus/platform/module/site/controller/HealthController.java:15`。

前端已经从 service_started 改为 service_healthy，但被检查的 /healthz 仍固定返回 UP，不访问 MySQL/Redis。依赖断开时仍会显示健康。README 把它写成就绪检查并不符合实现。

修改：保留独立存活检查，另加有超时的数据库/Redis readiness；Compose 使用明确的就绪探针。依赖断开时应返回非成功状态，恢复后自动就绪。

## 本轮确认已修改的上轮问题

- AI 回调改为更新数组中的响应式代理，SSE EOF 不再无条件算成功。
- 回答列表统一复用 load，新增后重置页码、采纳后刷新当前页、总数同步。
- WebSocket 注册/注销改成同一用户维度 compute 临界区。
- 配置缓存刷新改到 afterCommit，并加入基础类型/未知键校验。
- Redis 服务端、后端和健康检查均使用密码；Compose 必填签名密钥且后端拒绝历史公开默认值。
- 管理员不再被永久账号黑名单锁死，已改撤销时间机制，但还需上述精度测试。
- 同步脚本已增加临时库验证、排除环境配置表和导入异常恢复，但存在上述参数及回滚缺口。

建议先修 1、2，再处理 3～7，并补针对这些分支的测试。通过现有单元测试和模拟接口回归，不代表真实部署和并发已经通过。
