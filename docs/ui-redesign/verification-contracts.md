# UI 改版功能契约与验收附录

本附录用于约束学生端、管理端的视觉改版：保留已有业务实现、原有操作入口和真实数据链路。审计脚本通过不等于所有功能通过；交付必须同时具备源代码契约检查、原有测试/构建结果及浏览器功能验收记录。

## 1. 固定基线与允许修改的范围

- 审批基线提交：`91214e0d090ea3691c5890e55e89043b1c3102c9`，短写 `91214e0`。
- 独立工具：`scripts/ui-contract-audit.mjs`，只依赖 Node.js 内置模块与 Git，不修改应用源文件，不新增 npm 依赖。
- 固定清单：`docs/ui-redesign/ui-contract-baseline.json`，当前包含 **506 个受保护文件和 83 个 Vue 文件**。
- 允许：CSS、样式变量、图片、字体，以及不破坏契约的 Vue 展示模板调整；新增纯展示包装层；调整 `class`、`:class`、`v-bind:class`、`style`、`:style`、`v-bind:style`；调整静态 `title`、`aria-label`、`aria-description`。这些豁免仍需视觉、键盘和可访问性验收。
- 原有 Vue 脚本冻结，包括 `<script setup>` / `<script>` 的开始标签、代码、注释、结束标签及多个脚本块的顺序。不得为改版重写 `setup`、事件处理器、接口请求、生命周期、状态、权限或校验逻辑。
- 所有原有测试、依赖清单、锁文件、构建配置冻结。不要为了让 UI 改动通过而删测试、改预期、改路由或改业务实现。原有视觉断言也保留；通过保留真实组件及其参数达成新视觉。

## 2. 工具实际检查什么

| 对象 | 校验方式 | 失败示例 |
| --- | --- | --- |
| `web/backend/**`、`docker/**`、`tests/**` | 整文件 SHA-256 | 后端、SQL、部署脚本或现有测试被改动/删除 |
| 根目录 Compose、已提交 `.env*`、Git/Docker 忽略配置 | 整文件 SHA-256 | 配置或环境样例改动 |
| 两端 `src/api/**`、`store/**`、`router/**`、`features/**`、`utils/**` | 整目录所有原有文件 SHA-256 | 路由、请求、WebSocket、缓存、日期工具或 3D 场景逻辑改动；这些目录内的 CSS 也冻结 |
| 两端其他非 Vue 文件 | 除明确的 CSS/图片/字体后缀外，整文件 SHA-256 | `main.js`、HTML 入口、package/lock、Vite 配置等改动 |
| 所有原有 `.vue` | 脚本块有序哈希 | 原有方法实现变化、增加脚本或修改 import |
| Vue 模板节点 | 标签名与同节点非豁免属性组合的多重集 | 删除 `@click`、`v-model`、`v-if`、`v-for`、`ref`、`:disabled`、规则/权限绑定、组件 props 或 slot 约定 |
| Vue 插值 | `{{ expression }}` 表达式及出现次数 | 删除数据展示，或把动态值换成静态文案 |
| 新增受保护范围文件 | 枚举已跟踪及未忽略的未跟踪文件 | 在业务目录新增逻辑文件/测试/配置绕过冻结 |
| 新增 Vue 文件、模板契约 | 警告并要求人工审查 | 新组件的脚本、副作用、imports/emits 或新增条件可能改变功能 |

“多重集”会计数。例如同一页面原有两处 `@click="save"`，删除其中一处也会失败。工具记录同一节点属性的组合，不能把原有按钮的事件、权限条件任意拆到不同节点。无属性的自定义组件、slot，以及按钮、输入框、链接、表单、canvas 等交互元素也会记录。

为兼容 Windows Git 工作区，文本在哈希前**仅将 CRLF 规范化为 LF**，其余空格、脚本注释、顺序等保持严格一致；包含 NUL 的二进制按原字节哈希。因此这里的“脚本不变”是忽略 CRLF/LF 差异后的字节不变，并非 AST 语义等价。整文件记录只保存文件路径和哈希，不把后端或环境配置值写入报告；工具内部必须读取文件才能哈希，勿将读取过程误称为不访问文件。

每次 `check` 都从指定 Git 提交重新建立可信清单，并与 JSON 比较。手工编辑 JSON 不能豁免业务变化。`capture` 遇到内容不同的已有基线会拒绝覆盖。不得把改版后的提交改成新基线来隐藏问题；默认和验收记录统一使用 `91214e0`。

## 3. 静态扫描边界：必须阅读

这是保守的正则源代码扫描器，不是 Vue 编译器、语义分析器或运行时行为证明。它不检查 CSS 实际布局，不证明 API 成功、不证明权限正确，也不能证明用户看得到和点得到每个按钮。

- `display:none`、透明度、遮挡、超出滚动区域、`pointer-events:none`、过小点击区、父级新增条件等，可能在静态检查通过或仅警告时仍让功能不可用。
- 节点顺序、祖先结构、布局容器、可见文案、焦点顺序、事件冒泡和条件分支关联，不由多重集完全建模。保留旧节点在隐藏区域，同时显示无功能的新按钮，禁止采用。
- 属性表达式严格保存，语义相同的引号/表达式重写、标签更换、插槽位置重构、给旧契约节点增加非豁免属性，也可能被保守地判为变化。应优先保留节点与原绑定，利用 CSS 实现视觉；不要直接弱化扫描规则。
- 静态 `type`、`label`、`name`、`value`、`disabled`、`accept`、`maxlength`、`placeholder`、`data-*` 等均保留；它们可能影响交互、可访问定位或现有测试。`aria-label` 等豁免并不代表可以删掉准确的可访问名称。
- 动态参数、复杂嵌套引号、自定义模板预处理器、嵌入看似 `<script>` 的字符串、复杂插值、特殊 HTML 语法等可能产生误报或漏报。遇到这些情况保留失败证据，以 Vue 实际编译结果、逐段 diff 和浏览器验收核实；本工具不接受静默跳过。
- 样式文件、图片及字体为展示修改区，新增 `.vue` 的脚本仅发出警告；这些文件仍须 diff 审查。被 Git 忽略的新增文件不属于新增枚举范围；已有受保护文件即使被忽略也会按清单检查。不要把脚本或业务逻辑藏进样式、SVG、资源文件或忽略路径。
- 未修改源码不代表没有基线缺陷。服务、数据库、AI 提供商、权限账号、浏览器与依赖环境需要分别记录。

出现 `WARN` 时，不得只记录 exit code 0。逐条解释新增节点/组件用途，并核对它们不会隐藏、替代、代理或改变原有功能；未经核对的警告表示验收未完成。

## 4. PowerShell 执行顺序

从项目根目录运行。这里的工作区路径是本次隔离目录；复制项目后可把第一行改为实际项目根目录。使用 `npm.cmd` 避免 PowerShell 执行策略阻止 `npm.ps1`。每个步骤以退出码为准，不用后续成功命令覆盖前面的失败。

```powershell
Set-Location -LiteralPath 'E:\work\毕业设计UI原型\Ai-campus\.worktrees\tongpin-ui-redesign'

node scripts/ui-contract-audit.mjs --self-test
if ($LASTEXITCODE -ne 0) { throw '契约工具自检失败' }

# 首次生成或验证同一固定基线；不会按当前工作区业务代码生成基线。
node scripts/ui-contract-audit.mjs capture --rev 91214e0
if ($LASTEXITCODE -ne 0) { throw '基线生成失败' }

node scripts/ui-contract-audit.mjs check --rev 91214e0
if ($LASTEXITCODE -ne 0) { throw '功能契约变化，停止验收' }
```

可选参数：`--root '项目根目录'`、`--baseline '清单路径'`。相对清单路径按 Git 根目录解析。无需从文件内容打印任何凭据。`capture`/`check` 的非法参数、缺失基线、基线被篡改、Git 不可用或受保护内容变化均返回非零退出码。

首次准备应用依赖只使用原锁文件，不更新依赖版本：

```powershell
npm.cmd --prefix web/frontend/student ci
if ($LASTEXITCODE -ne 0) { throw '学生端依赖安装失败' }
npm.cmd --prefix web/frontend/admin ci
if ($LASTEXITCODE -ne 0) { throw '管理端依赖安装失败' }

npm.cmd --prefix web/frontend/student test
if ($LASTEXITCODE -ne 0) { throw '学生端测试未通过' }
npm.cmd --prefix web/frontend/admin test
if ($LASTEXITCODE -ne 0) { throw '管理端测试未通过' }
node --test tests/browser/e2e/config.test.cjs tests/browser/e2e/run-status.test.cjs
if ($LASTEXITCODE -ne 0) { throw '浏览器测试配置/状态测试未通过' }

npm.cmd --prefix web/frontend/student run build
if ($LASTEXITCODE -ne 0) { throw '学生端构建失败' }
npm.cmd --prefix web/frontend/admin run build
if ($LASTEXITCODE -ne 0) { throw '管理端构建失败' }

node scripts/ui-contract-audit.mjs check --rev 91214e0
if ($LASTEXITCODE -ne 0) { throw '测试或构建后契约变化' }
git diff --check
if ($LASTEXITCODE -ne 0) { throw '差异格式检查失败' }
```

审计工具自检覆盖真实扫描/比较行为：CSS 类变化、包装层、事件换绑、删除重复按钮、脚本更改、插值更改、CRLF、注释、属性内 `>`、指令/修饰符/ref、静态属性、新增契约警告和业务目录分类。自检使用内存夹具，不篡改任何真实业务文件。它不调用应用测试、不启动服务。

## 5. 现有浏览器回归

完整环境、素材和隔离数据说明以仓库 `tests/browser/README.md` 为准。回归脚本需要可用的 Playwright 和 Chrome；如 Playwright 位于独立工具目录，在测试终端设置 `PLAYWRIGHT_PATH` 为实际模块目录，不修改项目依赖。API 拦截的五个脚本固定访问 5173/5174；不要直接换用默认端口为 5175/5176 的 `vite.qa.config.mjs`。

两个终端各从项目根目录启动一个前端：

```powershell
# 终端 A
npm.cmd --prefix web/frontend/student run dev -- --host 127.0.0.1
```

```powershell
# 终端 B
npm.cmd --prefix web/frontend/admin run dev -- --host 127.0.0.1
```

第三个终端从项目根目录依次运行；分别记录每条命令及退出码，某条失败不抹去其他脚本的独立结果：

```powershell
node tests/browser/system-interactions.cjs
node tests/browser/system-all-rooms.cjs
node tests/browser/system-auth.cjs
node tests/browser/system-admin.cjs
node tests/browser/system-scene-and-fallback.cjs
```

这些脚本覆盖服务房间、活动报名、筛选返回、房间内私信、全屏弹窗/Esc、窄屏、401/403、错误重试、管理图表及 3D 回退；API 拦截不证明真实后端、文件上传、AI、WebSocket 或并发行为。

仓库说明已记录 `system-scene-and-fallback.cjs` 在“离开服务后 3D 场景仍在”断言处存在已知失败。此项应在相同环境、基线和改版上分别复现后标为“基线已有失败”；不能未经复现就把任意相似失败归因于基线，也不能直接删断言。

## 6. 真实端到端流程

按 `tests/browser/README.md` 的“隔离 Docker 真实 E2E”完整创建唯一 Compose 项目、独立 MySQL/Redis 及数据卷，设置该文档中的服务 URL、测试密码和素材目录。该准备流程会初始化数据，禁止把现用开发库或生产库当成验收目标。缺少 Docker、浏览器、种子账号或测试图片时记录 `BLOCK`。

隔离环境就绪后，在同一配置环境的终端执行：

```powershell
$onlyCoreE2e = '01,02,03,04,05,06,07,08,09,10,11,12,13,14,16,17,18,19,20'
node tests/browser/e2e/run-all.cjs "--only=$onlyCoreE2e"
if ($LASTEXITCODE -ne 0) { throw '真实 E2E 存在失败或阻塞，请查 JSON 报告' }
```

`15-ai` 调用外部 AI 提供商，核心流程默认未覆盖；只有真实服务、密钥及调用条件已准备好时再运行 `node tests/browser/e2e/run-all.cjs --only=01,15`，保留真实结果。第 16 类仅覆盖 AI 故障处理，不能代替 AI 成功链路。结果中的 `UNCOVERED` 不等于通过，即使它不单独令脚本退出失败。按原 README 只清理本次唯一 Compose 项目的测试容器/卷。

## 7. 每个原功能的人工验收记录

对学生端和管理端功能清单逐项验收，不以“页面能打开”“截图好看”代替功能可用。每项记录以下字段，列表/弹窗/详情/抽屉中的操作都算独立入口：

| 字段 | 必须记录 |
| --- | --- |
| 页面与操作 | 原文件、路由、入口名称；原始业务功能，不采用新视觉稿自行删减的清单 |
| 前置状态 | 游客/学生/管理员角色、权限、已有数据、所有者与非所有者、审核/报名/交易状态 |
| 查找与可见 | 页面哪个区域可找到；未隐藏、未被装饰盖住；窄屏滚动后仍可达 |
| 动作 | 鼠标/触摸点击、键盘 Tab/Enter/Esc、输入、上传、分页、筛选、返回 |
| 真实结果 | 请求方法/路径及关键业务参数保持一致；业务结果、消息/状态更新；不记录 token/隐私数据 |
| 分支 | 加载、空态、成功、校验失败、接口错误、无权限、重试、重复提交、断线恢复等适用状态 |
| 视觉证据 | 桌面与手机截图；重要遮罩/弹层打开状态；图片/文案可读且无横向溢出 |
| 判定 | PASS / FAIL / BLOCK / UNCOVERED，附失败步骤或阻塞原因及证据路径 |

建议至少使用 1440×900、1024×768、390×844 和 360×800，并检查 200% 缩放、键盘焦点、减少动态效果偏好。地图、绘画画布、3D 场景、编辑器、长表格、图表、聊天输入区、图片预览、抽屉和弹窗必须单独检查：CSS 不能改变它们的事件坐标或让内部操作区不可达。

新视觉若引入地图/门户卡片/折叠菜单，原始入口仍必须直接可见或通过明确、可发现的交互可达，不能只存在于代码里；保留原有发布、编辑、删除、审核、搜索、筛选、排序、分页、下载/上传、返回、刷新/重试等实际操作。装饰性数字或示例文字不得冒充真实业务数据。

## 8. 基线失败与本次工具验证记录

截至本附录写入时（2026-09-28），在本次隔离工作区、Node.js v24.19.0 下的实际结果：

| 验证 | 结果 |
| --- | --- |
| `node scripts/ui-contract-audit.mjs --self-test` | PASS |
| 固定 Git 提交 capture | PASS，589 个文件，基线清单约 302 KB |
| `node scripts/ui-contract-audit.mjs check --rev 91214e0` | PASS，506 个整文件契约、83 个 Vue，0 错误 / 0 警告 |
| 学生端原 `npm test`（按原 lockfile 安装依赖后） | PASS，80 个测试，0 失败 |
| 管理端原 `npm test`（按原 lockfile 安装依赖后） | PASS，15 个测试，0 失败 |
| `node --test tests/browser/e2e/config.test.cjs tests/browser/e2e/run-status.test.cjs` | PASS，11 个测试，0 失败 |
| 学生端 `npm run build` | PASS，Vite 6.4.3，退出码 0 |
| 管理端 `npm run build` | PASS，Vite 6.4.3，退出码 0 |
| 正式 Vue 应用浏览器业务回归 / 真实 E2E | 本次提示词交付未执行；需要后续实际改版时按全文验收，不据此声明业务全功能通过 |

最初未安装依赖时，学生端曾因缺少 vue-router、管理端曾因缺少 dayjs 未能完整执行。随后协调者在隔离工作区按原锁文件执行两端 npm ci，并重跑测试与构建，得到上表最终结果。两端仍有既有 JS 模块类型、依赖 PURE 注释和构建产物体积提示；不为消除提示改 package.json 或构建配置。本次仅新增文档、视觉参考和保护工具，以上结果是原业务代码的可运行基线，不是尚未实施的 UI 改版验收结果。

如果完整环境仍失败，在独立的基线 checkout 上复现相同命令、Node/浏览器版本、数据和角色，分别保存 baseline/after 日志；不对有工作内容的当前目录执行 reset。记录：失败名称、基线是否同样失败、本次是否扩大失败范围、是否与 CSS/模板修改直接关联。新产生的契约失败或功能失败必须修复；基线已有失败可以单独记录，但不自动获得整体“功能无回归”结论。

最终交付需重新运行审计并更新实际记录，附变更文件清单、人工功能矩阵、构建输出、浏览器/E2E 日志及未覆盖项。禁止通过重设基线、忽略错误退出码、删除测试、伪造截图或把未运行项写成 PASS 交付。
