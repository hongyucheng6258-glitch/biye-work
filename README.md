# AI校园综合服务平台

> **开发状态：前端功能已完成，等待后端环境联调** — 学生端、管理端和 3D 校园前端已完成，后端需按部署说明配置数据库、Redis 及相关服务后运行完整联调。

AI校园综合服务平台是一套面向高校学生的综合服务系统，覆盖**校园信息、AI 学习辅助、社交互动、物品交易、内容治理**等完整闭环：

- **校园信息**：活动发布/报名/签到、公告、校园动态、失物招领（AI 智能匹配）、闲置互换（AI 智能估价）
- **社交互动**：学习搭子（AI 匹配撮合）、校园互助问答（AI 参考回答）、私信实时聊天、他人主页聚合、内容举报
- **AI 学习**：智能对话、代码修复、PDF 学习问答、错题本（拍照 OCR 录入/智能整理/同类题生成/复习计划）、AI 辅助发布（草稿/润色/扩写）、AI 校园向导
- **智能推荐**：活动智能推荐（按报名偏好）、失物智能匹配、搭子智能匹配
- **内容治理**：AI 分级审核（低风险自动通过、中高风险人工复核）、人工审核、内容下架、举报处理、全量内容管理

平台通过 DeepSeek AI 接口提供全部 AI 能力，同时内置本地风险词规则与 AI 语义审核双保险。登录采用**图形验证码 + 数字运算验证随机切换**，注册内置**人机检测**，保障账号安全。

项目包含 **Web 学生端**、**Web 管理后台**和 **Spring Boot 后端**，后端按业务模块化分层，适合作为校园综合服务平台的课程设计或毕业设计项目基础。

## 功能总览

### 3D 校园空间

学生端提供独立的 3D 校园入口：`/campus-3d`。用户可以在梧桐中庭中行走、查看校园导览并进入 11 个服务房间。房间内容直接复用学生端页面和接口，活动报名、闲置交换、失物认领、问答、动态、公告、消息、私信和 AI 学习等操作都会在房间内完成，浏览器地址保持在 3D 校园页面。

3D 房间支持返回上一级、返回房间、全屏、画质切换、移动取消、加载重试和窄屏布局。进入服务后列表筛选与分页状态会在返回时保留，图片、Markdown、表单和 Element Plus 弹窗使用学生端的原有实现。

### 学生端

| 模块 | 功能 |
|---|---|
| 账号 | 注册（人机检测）、登录（图形验证码 / 数字运算验证随机出现）、个人资料、账号设置 |
| 首页 | 校园首页、全局搜索（活动/闲置/失物/动态）、公告列表与详情 |
| 活动 | 浏览、发布（AI 辅助起草）、报名、审批、**取消报名**、签到（二维码）、我的报名/发布、**AI 智能推荐** |
| 闲置 | 发布（AI 辅助起草）、浏览、预约、处理、评价、**AI 智能估价** |
| 失物招领 | 发布（AI 辅助起草）、浏览、**AI 智能匹配**、认领、确认、完成 |
| 学习搭子 | 发布、浏览、**AI 匹配撮合（带推荐理由）**、标记已找到 |
| 互助问答 | 提问、回答、采纳、**AI 参考回答**、我的提问/回答 |
| 动态广场 | 发布（AI 辅助起草）、详情、评论、点赞 |
| 社交 | 站内消息、私信实时聊天（含频率限制）、拉黑、举报、**他人主页聚合（发布/动态/评价）** |
| AI 学习 | AI 对话、代码修复、PDF 学习问答、大纲生成、错题本（OCR 拍照录入/智能整理/讲解/同类题生成/复习计划/薄弱点分析） |
| 用户 | 他人主页（作者名进入 TA 的发布/动态/评价聚合页） |

### 管理后台

| 模块 | 功能 |
|---|---|
| 数据大屏 | 平台运营核心指标统计 |
| 用户管理 | 用户列表、状态管理 |
| 内容审核 | 活动/闲置/失物/动态/**学习搭子**五类 UGC 审核（含 **AI 预审结论展示**：风险等级/理由/来源） |
| AI 内容审核 | AI 自动放行/待复核/拦截日志、恢复展示/维持拦截 |
| 内容管理 | 活动/闲置/失物/动态/搭子/问答六类内容统一治理（下架/恢复） |
| 举报处理 | 内容/用户/聊天举报处理（处理后红点清零） |
| 公告管理 | 发布、上下线 |
| AI 管理 | AI 配置（在线密钥）、调用日志、场景统计 |
| 活动运营 | 报名名单管理、**报名/签到报表导出**（Excel） |
| 系统配置 | 站点名称、维护模式、注册开关、**AI 审核开关**、风险词配置等 |
| 管理员 | 子管理员账号管理（角色：超级管理员/审核员） |

## AI 能力矩阵

| 场景 | 能力 |
|---|---|
| `chat` | 校园 AI 智能对话 |
| `pdf` | PDF 学习问答（大纲生成） |
| `code_fix` | 代码修复 |
| `wrong_analyze / wrong_explain` | 错题智能整理 / 错题讲解与错因分析 |
| `review_plan` | 错题复习计划 |
| `practice` | 同类练习题生成 |
| `assist_compose / assist_polish` | AI 辅助发布：草稿生成 / 润色·扩写·精简 |
| `campus_guide` | AI 校园向导：业务数据问答 |
| `lost_match` | 失物招领 AI 智能匹配 |
| `idle_estimate` | 闲置物品 AI 智能估价 |
| `partner_match` | 学习搭子 AI 匹配撮合 |
| `qa_answer` | 校园互助 AI 参考回答 |
| `activity_recommend` | 活动 AI 智能推荐 |
| `content_audit` | 内容 AI 分级审核（低风险自动通过 / 中高转人工） |

## 技术栈

### 后端

- Java 17、Spring Boot 3.2.5、Spring MVC、Spring Validation
- Spring WebSocket（实时聊天）、Spring Scheduling（活动状态自动同步）
- MyBatis-Plus 3.5.7、MySQL 8、Redis
- JWT 双重校验（签名 + 角色声明，防学生 Token 访问管理端）
- MinIO 兼容接口（图片已改为数据库 Base64 存储）
- PDFBox、OkHttp SSE（AI 流式响应）、DeepSeek OpenAI 兼容接口
- Hutool、Lombok

### Web 前端

- Vue 3、Vite 5、Vue Router、Pinia
- Element Plus、Axios、ECharts、Markdown It、WangEditor
- Tesseract.js（错题拍照 OCR 识别）

## 项目结构

```text
Ai-campus/
├── web/
│   ├── backend/                      # Spring Boot 后端
│   │   ├── src/main/java/com/campus/platform/
│   │   │   ├── common/               # 常量、结果码、公共工具
│   │   │   ├── config/               # 配置类（WebMvc、系统配置）
│   │   │   ├── interceptor/          # 拦截器（JWT、维护模式）
│   │   │   ├── utils/                # 工具类
│   │   │   └── module/               # 业务模块（按功能分类）
│   │   │       ├── auth/             #   登录注册、验证码、人机检测
│   │   │       ├── user/             #   用户、他人主页聚合
│   │   │       ├── activity/         #   活动、报名、签到、AI 推荐
│   │   │       ├── idle/             #   闲置、预约、评价、AI 估价
│   │   │       ├── lostfound/        #   失物、认领、AI 匹配
│   │   │       ├── partner/          #   学习搭子、AI 匹配
│   │   │       ├── qa/               #   互助问答、AI 参考回答
│   │   │       ├── post/             #   动态、评论、点赞
│   │   │       ├── chat/             #   私信会话、实时聊天
│   │   │       ├── message/          #   站内消息
│   │   │       ├── notice/           #   公告
│   │   │       ├── report/           #   举报
│   │   │       ├── favorite/         #   收藏
│   │   │       ├── upload/           #   文件上传
│   │   │       ├── site/             #   站点配置
│   │   │       ├── ai/               #   AI 网关、内容审核、错题本
│   │   │       └── admin/            #   管理端（审核/内容治理/统计/报表）
│   │   ├── src/main/resources/       # 配置、数据库脚本、敏感词
│   │   ├── src/test/                 # 后端测试
│   │   └── pom.xml
│   └── frontend/
│       ├── student/                  # Web 学生端（端口 5173）
│       └── admin/                    # Web 管理后台（端口 5174）
├── .gitignore
├── README.md
└── 部署说明.md
```

## 环境要求

- JDK 17+、Maven 3.8+、Node.js 18+、npm
- MySQL 8（建议 `max_allowed_packet=128M`，图片以 Base64 入库）
- Redis 6+
- MinIO（可选，仅兼容旧接口，图片已改为数据库存储）
- DeepSeek API Key（AI 能力依赖）

## 数据库初始化

1. 创建数据库 `ai_campus_platform`（字符集 `utf8mb4`）。
2. 执行 `web/backend/src/main/resources/db/schema.sql` 初始化基础表结构。
3. 依次执行迁移脚本（增量升级，按顺序）：

```text
migrate_v2_wrongbook.sql              # 错题本表
migrate_v3_wrongbook_analyze.sql      # 错题分析与薄弱点
migrate_v4_wrongbook_generated.sql    # 生成题与复习
migrate_v5_images_to_db.sql           # 图片迁移至数据库 Base64
migrate_v6_all_uploads_to_db.sql      # 全部上传文件迁移至数据库
migrate_v7_system_config.sql          # 系统配置表
2026-08-05-chat-blocker-high-migration.sql   # 上传资源表/聊天拉黑升级
2026-08-07-ai-content-audit-migration.sql    # 四类 UGC 增加 AI 审核字段
```

> 学习搭子（`study_partner`）、互助问答（`campus_question` / `campus_answer`）等社交模块表由应用启动时自动建表（MyBatis-Plus），或参照 `db` 目录新增迁移脚本同步。

4. 开发测试环境可执行 `reset_and_testdata.sql` 导入测试数据。

数据库连接信息建议通过环境变量配置，不要把真实密码提交到仓库：

```text
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=ai_campus_platform
MYSQL_USER=root
MYSQL_PASSWORD=请替换为数据库密码
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## 后端启动

```bash
cd web/backend
mvn spring-boot:run
# 或打包后运行
mvn clean package
java -jar target/platform-server.jar
```

后端默认端口 `8080`，接口统一 `/api` 前缀。AI 接口需配置 `AI_API_KEY`（也可在管理后台「AI 配置」在线修改，优先级更高）。

## 学生端启动

```bash
cd web/frontend/student
npm install
npm run dev        # 端口 5173，/api、/ws 代理到后端 8080
npm run build      # 生产构建
npm test           # 运行测试
```

打开 3D 校园：

```text
http://localhost:5173/campus-3d
```

## 管理端启动

```bash
cd web/frontend/admin
npm install
npm run dev        # 端口 5174（strictPort，被占用会直接报错），/api 代理到后端 8080
npm run build      # 生产构建
npm test           # 运行测试
```

## 配置说明

后端主配置：`web/backend/src/main/resources/application.yml`

| 环境变量 | 作用 |
|---|---|
| `MYSQL_HOST` / `MYSQL_PORT` / `MYSQL_DB` / `MYSQL_USER` / `MYSQL_PASSWORD` | MySQL 连接 |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Redis 连接 |
| `MINIO_ENDPOINT` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | MinIO（可选） |
| `AI_BASE_URL` / `AI_API_KEY` / `AI_MODEL` | AI 服务（默认 DeepSeek） |
| `JWT_SECRET` | JWT 签名密钥 |
| `SIGNIN_SECRET` | 活动签到 HMAC 密钥 |
| `TRUSTED_ORIGINS` | REST 与 WebSocket 可信来源白名单 |

AI 密钥支持环境变量与管理后台「AI 配置」页（数据库 `ai_config` 表，优先级更高）两种方式。

## 测试账号

执行 `reset_and_testdata.sql` 后可用（密码均为 `admin123`）：

| 类型 | 账号 | 说明 |
|---|---|---|
| 学生 | `2021001` 张三 / `2021002` 李四 / `2021003` 王五 / `2021004` 赵六 / `2021005` 陈七 | 各学院不同年级，覆盖多角色互动 |
| 管理员 | `admin`（超级管理员）/ `auditor`（审核员） | 管理后台登录 |

## 安全说明

- 生产部署前替换所有数据库、Redis、JWT、签到、AI 密钥；密钥通过环境变量或密钥管理服务注入，不写入源码。
- JWT 拦截器同时校验签名与角色声明，学生 Token 无法访问管理端接口。
- 内容发布经过本地风险词规则 + AI 语义分级审核，低风险自动放行、中高风险人工复核。
- 限制 MySQL/Redis/MinIO 网络访问范围，管理后台启用 HTTPS。

## 测试

```bash
cd web/backend && mvn test        # 后端测试
cd web/frontend/student && npm test
cd web/frontend/admin && npm test
```

浏览器交互检查脚本位于 `tests/browser/`，覆盖 3D 房间进入、真实学生端组件、活动报名、房间内私信、全屏弹窗、窄屏布局、401/403、管理端失败重试和全部服务房间加载。脚本使用拦截接口，不会修改真实数据库；真实后端联调仍需要启动 MySQL、Redis、后端服务和可选的 AI/WebSocket 服务。

当前回归结果（2026-09-21）：后端 `mvn clean test` 237 项通过；学生端 node 测试 55 项通过；两端生产构建通过。完整 14 项修复记录与验收矩阵见文末「2026-09 系统审查修复记录」。

## 默认服务地址

| 服务 | 默认地址 |
|---|---|
| 后端 API | `http://localhost:8080` |
| 学生端 | `http://localhost:5173` |
| 管理端 | `http://localhost:5174` |
| Redis | `localhost:6379` |
| MinIO API / 控制台 | `http://localhost:9000` / `http://localhost:9001` |

## Docker 一键部署

项目根目录已提供 `docker-compose.yml`，会启动 MySQL、Redis、Spring Boot 后端、学生端和管理端。首次启动会在新的 Docker 数据卷中初始化数据库并导入演示账号，不会读取或覆盖本机已有的 MySQL/Redis 数据。

```powershell
Copy-Item .env.example .env
# 按需修改 .env 中的数据库密码和 AI_API_KEY
docker compose up -d --build
docker compose ps
```

启动完成后访问：

- 学生端：`http://localhost:5173`
- 管理端：`http://localhost:5174/admin/`
- 后端 API：`http://localhost:8080`

常用操作：

```powershell
docker compose logs -f backend       # 查看后端日志
docker compose down                  # 停止容器，保留数据卷
docker compose down -v               # 停止并删除 Docker 数据（会清空演示库）
```

如果首次启动提示 `mysql is unhealthy`，先查看初始化日志：

```powershell
docker compose logs mysql --tail=200
```

确认这是全新的演示环境后，可删除未完成初始化的数据卷再重试（会清空该 Docker 数据卷）：

```powershell
docker compose down
docker volume rm ai-campus_mysql_data
docker compose up -d --build
```

生产环境请移除 compose 中 `99-testdata.sql` 的初始化挂载，并使用独立的数据库备份与密钥管理方案。

## 部署说明

完整的数据库、Redis、后端、前端部署流程与常见问题排查见 [部署说明.md](部署说明.md)。
## 2026-09 系统审查修复记录（14 项）

审查书 `SYSTEM_AUDIT_REPAIR_PROMPT_2026-09-21.md` 的 14 项修复全部落地，全量回归通过。

| # | 审查项 | 修复要点 | 验证 |
|---|---|---|---|
| 1 | 管理员服务端权限 | 新增 AdminPermissionService（requireActive / requireSuper）；黑名单 key `auth:blacklist:admin:<id>` 与学生端一致；角色变更即撤销令牌；AdminLayout 角色文案 super/audit | 单测 20 项通过 |
| 2 | 公开读取与登录态个性化 | JwtInterceptor 重写：GET + 白名单匿名放行不设 UserContext；有效学生 token 正常解析；无效 token 公开端点按匿名 / 受保护 401；管理员 token 拒绝 | 单测 18 项通过 |
| 3 | 管理端导航 / 待办 | 新增 `GET /api/admin/stats/pending-counts`（ai 为待审子集不累加）；goNotice 去掉 /admin 前缀；admin_info JSON 容错 | admin 单测 10 项 + 构建通过 |
| 4 | Docker 启动与部署配置 | compose 注入 JWT_SECRET / SIGNIN_SECRET；BUILD_VERSION 构建参数；nginx client_max_body_size 64m、SSE proxy_buffering off、SPA fallback；/healthz 就绪检查；version.json | `docker compose config` 校验通过 |
| 5 | 数据库迁移与同步 | migrate_v7 改 INSERT IGNORE 幂等；SQL SET NAMES utf8mb4；sync-local-db-to-docker.ps1 + docs/db-ops.md；10 个 SQL 严格 UTF-8 字节校验全部通过（schema.sql 非 GBK，控制台乱码为显示层误报） | 字节校验 10/10 OK |
| 6 | 失物认领并发 | claim @Transactional + 父行 FOR UPDATE 串行化；handleClaim/confirmReturn 条件更新；原子批量驳回 | 单测 9 项通过 |
| 7 | 动态计数竞争 | PostMapper 原子 `incrLikeCount/incrCommentCount`（GREATEST 非负）；点赞唯一索引幂等 | 单测 5 项通过 |
| 8 | 两层分页与参数保护 | PaginationInnerInterceptor setMaxLimit(100)；members/claims/answers 内层分页；CommentList 自包含分页；pageNum/pageSize 参数保护 | 单测 32 项通过 |
| 9 | 图片完整性与显示语义 | 静态兜底转 WebP（7 张平均省 93%，原 PNG 保留）；闲置分类示意图（idle-schematic-*）；@error 防递归兜底；roomScreen 海报 overlay 提示层不遮房间名；纯文字动态不强配图；MAP_SERVICE_IMAGE 合并重复映射 | node 21 项 + 构建通过 |
| 10 | 动态分享定位 | 新增 `GET /api/post/{id}`（仅审核通过可见）；PostSquare `?post=` 置顶直达、找不到/删除/未过审明确提示、closeShare 保留搜索词不重载列表；评论分页与普通入口一致 | mvn 7 项 + 构建通过 |
| 11 | AI 流式错误 / 取消 / 会话隔离 | chatStream 区分 SSE/JSON，HTTP 200 + 业务 code（401/403/503 等）进统一错误策略；支持 AbortController + 请求标识隔离迟到响应；校园向导复用 aiGuideAsk 去除裸 fetch；增量渲染触发 Vue 响应式；SSE 分片/CRLF/error/done/断开/取消分别处理并释放 reader | 学生端 55 项测试 + 构建通过 |
| 12 | 系统配置缓存一致 | SystemConfigHolder.refresh 改为先建快照再整体换引用（杜绝 clear+put 半空缓存）；DB→内置默认→null 回退链 | 单测 4 项通过 |
| 13 | WebSocket 与扩展能力 | ChatSessionRegistry 每用户上限 5、下线注销、注册时清理关闭会话、推送只发在线会话；ChatRealtimePublisher afterCommit 推送 message/unread/read-receipt | 单测 5 项通过 |
| 14 | 回归与联调 | 全量回归与验收矩阵见下 | clean 全量 237 项通过 |

### 回归结果（2026-09-21）

| 层 | 命令 | 结果 |
|---|---|---|
| 后端 | `cd web/backend && mvn clean test` | 237 项通过，0 失败（60 个 surefire 报告，clean 全量无残留） |
| 学生端 | `cd web/frontend/student && node --test <全部 .test.mjs>` | 55 项通过 |
| 学生端构建 | `cd web/frontend/student && npm run build` | 通过 |
| 管理端构建 | `cd web/frontend/admin && npm run build` | 通过 |
| Docker 配置 | `docker compose config` | 校验通过（JWT_SECRET/SIGNIN_SECRET/BUILD_VERSION 正确注入）；backend `/healthz` 为进程存活，`/readyz` 同时检查 MySQL/Redis |

### 验收矩阵：已验证 vs 环境阻塞

**已验证（构建 / 单测 / 静态校验）**
- 14 项修复全部落地；后端 clean 全量 237 项、学生端 55 项、管理端构建通过。
- Docker：密钥注入、nginx 上传上限 / SSE 缓冲 / SPA fallback、/healthz、构建版本均通过 `docker compose config` 与配置比对验证。
- 图片资源：7 个 WebP + 4 张分类示意图字节完整，引用全部切换 .webp；原大 PNG 保留未删。
- 数据库脚本：10 个 SQL 全部严格 UTF-8 合法；migrate_v7 幂等。

**环境阻塞（需真实环境验证，非代码缺陷）**
- 真实 AI 流式 / 校园向导最小调用：本机无 AI_API_KEY，需在已配置凭据的隔离环境跑通端到端（分片、中断、连续切会话场景由代码与单测覆盖，真实网关需凭据）。
- `docker compose up` 全链路启动：本机 3306/8080/5173/5174 可能与本地开发服务冲突，未实际起栈；配置已通过 `docker compose config` 校验，建议在 CI 或独立机器首次启动。
- 端到端浏览器联调（登录→发动态→分享直达→评论分页→3D 房间→私信）：需 MySQL+Redis+后端+前端全栈运行；`tests/browser/` 已覆盖拦截模式脚本。

## 2026-09 第二轮复查修复记录（8 项，REPAIR_REVIEW_2026-09-21.md）

复查报告列出的 8 项必须修复问题全部落地。

| # | 级别 | 问题 | 修复要点 | 验证 |
|---|---|---|---|---|
| R1 | P1 | 同步脚本先 DROP 再因 `<` 重定向失败留空库 | 重写脚本：移除 Invoke-Expression/`<`；Start-Process -RedirectStandardInput 字节安全导入；导入前临时库验证备份可恢复；导入失败自动用目标库备份回滚；同实例保护；精确 COUNT(*)+CHECKSUM 校验（不用 information_schema 估算）；--ignore-table 排除环境表；备份目录入 .gitignore | 脚本 AST 语法通过；无 Docker 环境未实跑 |
| R2 | P1 | 改角色后旧/新令牌全被拒、无法重登 | 黑名单改为「撤销时间 vs 令牌 iat」比较（auth:revoked-at:admin:<id>=epoch millis）；旧令牌 iat≤撤销时间拒绝，重登新令牌 iat 更晚自动放行；不清空 key；JwtUtils 增加 getIssuedAtMillis | 新回归：改角色→旧拒→重登新通→旧仍拒，单测全过 |
| R3 | P1 | REPEATABLE READ 快照窗口 | claim() 第一条语句即父行 FOR UPDATE；有效认领用 countActiveForUpdate(...FOR UPDATE) 当前读；handleClaim/confirmReturn 统一锁父行 | 单测 9 项；真实双事务并发为环境阻塞 |
| R4 | P2 | AI 增量不刷新/错误不统一/截断当成功 | 消息对象经数组代理更新触发响应式；onError 复用 responseAction（401 跳登录/503 跳维护页）；EOF 未收到 done 按错误处理 | 学生端 55 项 + 构建通过 |
| R5 | P1/P2 | Docker 只修一半 | JWT_SECRET/SIGNIN_SECRET/REDIS_PASSWORD 用 compose `:?` 缺省拒启动 + 后端启动校验拒绝公开默认值；Redis requirepass 与健康检查一致；前端 depends_on service_healthy；nginx 静态资源 404 规则 | compose config 校验通过（缺变量即报错） |
| R6 | P2 | 事务内刷新缓存+缺校验 | refresh 移到 afterCommit；键格式/值类型(int/bool/json)/范围校验；未知键拒绝；内置键禁删 | SystemConfigHolderTest 4 项通过 |
| R7 | P2 | 回答后分页状态不一致 | 新增回答后 load(1)、采纳后 load(当前页)；标题用 answerTotal 总数 | 学生端构建通过 |
| R8 | P2 | ws 注册竞争 | register/unregister 全部在 CHM compute/computeIfPresent 临界区内原子完成；注释说明单/多实例能力 | ChatWebSocketTest 5 项通过 |

### 第二轮回归结果（2026-09-21）

| 层 | 结果 |
|---|---|
| 后端 `mvn clean test` | 236 项通过，0 失败 0 错误 0 跳过 |
| 学生端 node 测试 | 55/55 通过 |
| 学生端生产构建 | 通过 |
| `docker compose config` | 缺 REDIS_PASSWORD 时按设计报错；补齐必填变量后解析通过 |

### 验收矩阵：已验证 vs 环境阻塞

**已验证**
- 8 项代码修复全部落地；后端 clean 全量 236 项、学生端 55 项通过；构建通过。
- 同步脚本 AST 语法校验通过；compose `:?` 缺变量拒绝启动行为实测确认。

**环境阻塞（本机 Docker/MySQL/Redis 不可用）**
- 同步脚本真实端到端跑通（备份→临时库恢复→导入→CHECKSUM 比对）需可连 Docker MySQL。
- R3 两个独立真实 DB 事务 + 同步屏障的并发验证（当前读消除快照窗口）需真实 MySQL REPEATABLE READ 环境；单测仅证明调用路径。
- R8 高并发注册/交错注销的线程级压测；当前单测证明实现已原子化。
- Docker 实际 `up` 起栈、Redis requirepass 连通、nginx 静态 404 与 readiness 生效。
- AI 流式真实网关（截断流/401/503）与浏览器端逐段渲染的视觉回归。
