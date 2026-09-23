# AI Campus「你画我猜」实施计划

> **给执行者：** 必须遵循 `executing-plans` 与 `test-driven-development`：每个行为先写可观察测试、确认失败，再实现最小改动。此任务按模块隔离；不清理或覆盖原工作区已有未提交修改。

**目标：** 在现有校园平台加入可登录、可多人实时对战、可留存结果的你画我猜。

**结构：** 学生端添加独立 `draw-guess` 功能目录、两页和 API/WebSocket 客户端。后端增加 `module.drawgame` REST、一次性房间 ticket、隔离 WebSocket handler、回合服务和记录表。现有 app shell 和 3D 房间只增加数据入口。游戏新数据库对象使用 `draw_game_` 前缀。

**技术：** Vue 3、Vue Router、现有 `request`/Pinia 登录、原生浏览器 WebSocket、Spring Boot 3 / Java 17、MyBatis-Plus、Redis 一次性 ticket、现有上传服务、MySQL。

## 执行任务

### 1. 保护现有接入合同并添加游戏路由

- 为 `SERVICE_PATHS` 与根路由注册行为增加测试：原服务 landing 不变；新增 `drawgame` landing 为 `/draw-guess`；未登录游戏访问仍进入当前登录流程。
- 为服务目录增加唯一游戏项和独立 3D 房间说明；不修改 `campus-scene.js` 的绘制/交互算法。
- 在 `routes.js` 加入大厅与房间页面；页面标题与侧栏只新增游戏入口。
- 运行相关路由测试，确认原有 path 列表行为无变化。

### 2. 建立后端游戏域规则与自动化测试

- 先为游戏规则写纯单元测试：私密房密码校验、座位上限、仅画手可画、答案隔离、正确猜测得分、所有猜手正确时 5 秒收尾、超时轮转、结束房间状态。
- 新增隔离 DTO/实体/mapper/service/controller、词库 migration、房间 ticket 与 WebSocket handshake/handler。
- API 认证由 `UserContext` 提供；复用用户资料查询但不创建用户或认证表。
- REST 覆盖创建/分页列表/加入/退出/最近房间/作品记录/ticket；服务端限制绘图载荷与消息长度。
- 新 handler 使用 `/ws/draw-guess`，不得更改聊天模块文件。
- 每项规则先看到测试失败，再运行游戏模块测试及可用的后端全量测试。

### 3. 大厅和游戏房页面

- 大厅展示公开房、加入码、建房配置、最近房间、完成画作；处理加载、空列表、失败、满员和过期码。
- 游戏房处理 ticket 建连、完整状态同步、画笔事件、聊天猜词、服务端计时和重连；断线重连重新申请 ticket 并请求服务端快照，不在浏览器端恢复权威状态。
- 画手答案只从服务端定向事件读取；非画手不从 HTML/store/network state 拿答案。
- 使用现有登录状态和头像，不改变全局 request/websocket helper。
- 添加手机布局、键盘焦点和 reduced-motion 支持。

### 4. 数据库与部署接入

- migration 为新表新增唯一索引、外键/查询索引和适量种子词汇。
- 更新项目 SQL 安装/部署说明，保证空库安装及已有库迁移都只创建新对象。
- 上传复用现有资源表与服务；快照尺寸、请求尺寸和历史分页有限制。

### 5. 全面回归与接回项目

- 学生端全量测试和 production build；管理端全量测试和 production build。
- 后端全量测试与打包；新增规则与 socket ticket 授权测试。
- 检查 migration 幂等/安装脚本包含关系、`git diff --check`、前端路由 regressions、私信 websocket 源文件无修改。
- 检查 worktree diff，按用户同意将完成功能接回原分支；确认原工作区既有改动未被覆盖。

## 隔离与恢复

- 所有实现写在 `Ai-campus/.worktrees/draw-game` 的 `codex/draw-guess-game` 分支。
- `.worktrees/` 已由单独提交加入 `.gitignore`；游戏实现不会依赖参考目录或复制其密钥/环境配置。
- 如果需要撤销，只需丢弃该功能分支；原项目既有未提交改动不会随之丢失。

