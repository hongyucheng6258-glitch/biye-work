# 修复与测试完成记录

本轮针对第三轮复查剩余问题完成了代码修复，并从干净报告重新验证。

## 已修复

- `docker/nginx/student.conf`、`docker/nginx/admin.conf`：API 使用 `location ^~ /api/`，后端 `/api/assets/...` 图片不会被静态资源正则拦截。
- `docker/scripts/sync-local-db-to-docker.ps1`：改用 `ProcessStartInfo.ArgumentList` 和标准输入，密码通过环境变量传递；验证库创建/清理参数不再拆分；最终校验失败会自动回滚；保留临时库恢复验证和环境专属表排除。
- `web/frontend/student/src/utils/request-navigation.js`、`request.js`、`views/ai/ChatView.vue`：AI 流式 401 与普通请求共用登录失效清理，清除缓存令牌并保留返回地址。
- `LostFoundService.confirmReturn`：与认领、处理流程统一先锁失物父行，再更新认领子行，避免反向锁顺序。
- `SystemConfigService`：内置键固定类型，整数先解析并检查范围，禁止负数/溢出/类型篡改；保留 afterCommit 缓存刷新。
- `JwtUtils`：增加毫秒级 `iat_ms` claim，管理员撤销时间能区分同一秒内的新旧令牌。
- `HealthController`、`docker-compose.yml`：新增访问 MySQL/Redis 的 `/readyz`，Compose healthcheck 使用 readyz；`/healthz` 继续只表示进程存活。
- 新增 `SystemConfigServiceTest`、`JwtUtilsTest` 和同步脚本静态安全检查。

## 最终验证

- 后端 `mvn clean test`：240 项通过，0 失败、0 错误、0 跳过。
- 学生端：55 项通过；生产构建通过。
- 管理端：10 项通过；生产构建通过。
- 浏览器回归：auth、admin、interactions、all-rooms、scene-and-fallback 全部通过。
- 同步脚本静态安全检查：通过。
- `docker compose config`：通过；API location、健康依赖静态检查通过。
- `git diff --check`：通过；仅有 Git 的换行格式提示。

## Docker 真实联调记录

- Docker Compose 已完成镜像构建并启动 `mysql`、`redis`、`backend`、`student`、`admin` 五个服务；MySQL、Redis、后端就绪检查均为 healthy，学生端 `5173` 与管理端 `5174` 返回 200。
- 真实公开接口检查通过：站点配置、首页聚合、活动、闲置、动态、公告列表均返回 200；学生端和管理端不存在的静态资源均返回 404。
- 真实 Redis 密码认证通过（`PONG`），后端 `/readyz` 已同时验证 MySQL 查询和 Redis ping。
- 30 个并发首页聚合读取全部成功（30/30），P50 约 111ms，P95 约 118ms，最大约 160ms；该检查只读，不修改业务数据。
- 使用测试学生账号完成真实验证码登录，随后真实 AI 同步请求返回 HTTP 200、业务码 200。AI 密钥仅通过当前 Docker 进程环境注入，没有写入仓库或 `.env`。
- 使用真实一次性 WebSocket ticket 完成聊天握手，并收到 `pong`；没有写入聊天业务消息。
- 真实文件上传通过：使用隔离的 1x1 PNG 完成验证码登录、JWT 鉴权、multipart 上传和 MySQL 资源记录写入，返回 HTTP 200/业务码 200；测试记录随后已清理。当前上传实现保存为数据库 Data URI，因此不依赖 MinIO。

## 当前部署注意事项

- 当前 `.env` 中 `REDIS_PASSWORD` 仍为空，因此直接在新的 PowerShell 会话执行 Compose 会被安全校验拒绝；本次联调使用了只存在于当前进程的临时 Redis 密码。部署环境应设置一个持久、随机的 `REDIS_PASSWORD`，并让 Redis 与后端使用同一个值。
- `.env` 中 `AI_API_KEY` 没有写入；本次真实 AI 请求使用临时进程变量。若希望重启后继续使用 AI，需要在部署环境的安全配置中设置该变量，避免提交到 Git。
