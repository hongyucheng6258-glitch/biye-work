# 管理端逐页 UI 改造契约

本附录供实施模型逐项执行和验收。源码基线为 `91214e0`，工作目录为 `E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign`；下列行号均指改造前源码。视觉依据为本分支内 [tongpin-campus.html](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/ui-prototype/tongpin-campus.html:12)，是用户确认的原型副本，不是仓库内其他旧 HTML 原型。该文件的背景 `#f4f6f5`、正文 `#243c36`、主绿 `#244f46`、青柠 `#e9efb0`、雾蓝 `#e1edf1`、边线 `#e1e6e2`、26px 圆角及柔和阴影是两端统一的视觉来源。

本次覆盖 **13 个管理端视图、1 个布局、1 个共享展示组件、3 个样式文件**。包含 15 个原导航叶子，以及不在主导航内的新建/编辑公告动态路由。所有现有业务功能、请求、状态、权限、事件和失败处理均保留。本文是实施说明，没有修改应用源码。

## 1. 修改边界与统一样式

- 现有 `.vue` 的全部 `<script>` / `<script setup>` 块必须逐字节一致，包括注释、导入、初始化、计算属性、监听、生命周期和函数。现有 `.js` / `.mjs` 文件、路由、Pinia、API、工具、依赖清单、构建配置也冻结。只修改既有视图的 `template`、`style` 和三个 CSS 文件；禁止通过模板增加业务分支、改 handler 参数、把字符串枚举换成布尔值、改表单约束或重新实现请求。
- 允许在原元素外增加展示容器、调整展示类、间距和可视层级。原节点可访问性属性仅按审计豁免调整静态 `title/aria-label/aria-description`；其他原属性全部保留，不向原节点新增 `role/tabindex/aria-describedby` 等受保护属性。新增包装层可以声明适合的语义，但必须检查键盘和阅读顺序。保留 `ref`、`v-model`、`v-if/v-else/v-show`、`v-for/key`、`@event`、`:loading`、`:disabled`、组件插槽、表格列和图片预览绑定。站点名仍为原名称；页面静态外壳可重排，不能删除隐藏状态中的功能。
- 如另建纯展示组件，其脚本只能处理 props、slots 和展示交互，不得接管业务；本管理端方案无需新增组件即可落地，优先在原模板和 CSS 完成，避免为注册组件改写冻结的导入或 `main.js`。
- 表格仍使用 Element Plus 数据表；不改成丢列的展示卡片。桌面行高约 56px，表头浅灰绿，14px 正文、12px 次要文本；保留 `fixed="right"`、tooltip、状态标签、空态、loading、分页。窄屏在表格容器内部水平滚动，不让整个网页横向溢出，不使用 `body { overflow-x: hidden }` 掩盖问题。
- 所有表单标签至少 13px，输入区高约 40–44px，标签和帮助文案齐全。按钮采用深绿实心、白底描边或浅青柠强调；危险操作仍用危险语义色，并且保留文字。弹窗最大宽度为 `calc(100vw - 32px)`，内容在视窗内滚动、底部操作可达，保持原 `el-dialog` 的焦点/关闭行为和原条件。
- 页头与内容卡分离：上方小标签、主标题、说明，右侧既有操作。主体最大宽度 1280px；桌面左右留白 32–48px，手机 16px；白色卡片圆角 22–26px、卡内边距 24px、区块间距 20–24px。表单长页面同样占用中间主体，不创建侧栏式设置目录。
- 暗色模式继续由 `:root[data-theme="dark"]` 驱动。完整覆盖 token、Element Plus 的 overlay、表格固定列、tooltip、输入、Markdown 预览与弹窗；不能只替换亮色而让原主题开关失效。保留焦点环与 `prefers-reduced-motion`。

| 文件与源码锚点 | 允许的具体改造 | 必须冻结/保留 |
|---|---|---|
| [src/main.js](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/main.js:1) | 不改文件，通过已加载的 CSS 生效 | Pinia/router/Element Plus 注册、中文 locale、CSS 导入顺序和 `#app` 挂载 |
| [src/App.vue](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/App.vue:1) | 仅全局 style 如有需要与新 token 对齐；根模板保持 `<router-view />` | 根脚本及 `--campus-primary: var(--brand)` 兼容入口 |
| [styles/tokens.css](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/styles/tokens.css:7) | 将 `--paper/--surface/--ink/--brand/--accent/--info/--line` 映射到同频灰绿/白/深绿/青柠/雾蓝；更新圆角、阴影、字体层级及暗色对应值 | 既有变量名全部保留，状态色仍有成功/警告/危险区别；`--side-*` 可兼容保留但不得成为任何侧栏的理由 |
| [styles/base.css](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/styles/base.css:1) | 统一 14px 管理表单与正文基线、页面留白、焦点和滚动体验；可在这里增加命名清晰的公共展示类 | reset、字体继承、可见键盘焦点、减少动效，不全局抹除原生 outline |
| [styles/element-theme.css](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/styles/element-theme.css:5) | 更新主色各级 shade、圆角和组件表面；为 `.el-card/.el-table/.el-dialog/.el-message-box/.el-pagination/.el-radio-button/.el-tabs/.el-input` 统一外观 | 完整明暗两套变量；保留组件交互、校验反馈、固定列和 overlay 层级，不把所有 tag 都染成同一绿 |
| [components/wt/WtPageHeader.vue](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/components/wt/WtPageHeader.vue:13) | `wt-page-header` 改为无底部分割线的留白页头；`wt-ph-eyebrow` 12px 小标签、`wt-ph-title` 28–32px、`wt-ph-sub` 14px；actions 桌面右对齐、手机换行 | script 第 1–11 行不变；`title/subtitle/eyebrow` props，两个条件展示和默认 slot 原样存在；无 slot 时不占虚假操作宽度 |

### Canvas 图表的真实限制

[utils/chartTheme.js:3](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/utils/chartTheme.js:3) 的 `chartPalette/seriesColors/chartBase`，以及 `Dashboard.vue` 脚本里的图形颜色均被冻结。CSS 不能把 ECharts Canvas 内已绘制的系列统一替换成绿色。本轮只改图表容器、卡片、标题、背景与尺寸，保留原系列蓝/杏色为数据辨识色；不得 CSS 滤镜整体扭曲图表颜色，也不得把真实图表换成静态截图。将此作为“现有脚本不变”下的明确视觉例外，不能暗中改配置 JS。

## 2. 完整路由和顶部导航契约

路由权威文件为 [router/index.js:7](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/router/index.js:7)。`createWebHistory('/admin/')` 在第 42 行；下表写的是 Vue Router 内部路径，浏览器访问时为 `/admin/` 加内部路径，模板不得重复拼接 `/admin`。

| 顶部组 | 原菜单标签 / 路由名 | 内部路由 | 页面与额外条件 | 原路由行 |
|---|---|---|---|---:|
| 概览 | 数据看板 / `Dashboard` | `/dashboard` | `views/dashboard/Dashboard.vue`；meta title 为“数据大屏” | 19 |
| 内容审核 | 活动审核 / `ActivityAudit` | `/audit/activity` | `views/audit/AuditModule.vue`，静态 props `{ type: 'activity' }`，countKey `activity` | 21 |
| 内容审核 | 闲置审核 / `IdleAudit` | `/audit/idle` | 同组件，type `idle`，countKey `idle` | 22 |
| 内容审核 | 失物招领审核 / `LostFoundAudit` | `/audit/lostfound` | 同组件，type `lostfound`，countKey `lostfound` | 23 |
| 内容审核 | 动态审核 / `PostAudit` | `/audit/post` | 同组件，type `post`，countKey `post` | 24 |
| 内容审核 | 搭子审核 / `PartnerAudit` | `/audit/partner` | 同组件，type `partner`，countKey `partner` | 25 |
| 内容审核 | AI 内容审核 / `AiContentAudit` | `/ai/audit` | `views/ai/AiContentAudit.vue`，countKey `ai`，`gold: true` | 28 |
| 内容管理 | 内容管理 / `ContentManage` | `/content` | `views/content/ContentManage.vue` | 26 |
| 用户与社区 | 用户管理 / `UserList` | `/user` | `views/user/UserList.vue` | 20 |
| 用户与社区 | 举报处理 / `ReportList` | `/report` | `views/report/ReportList.vue`，countKey `report` | 29 |
| 系统 | 系统公告 / `NoticeManage` | `/notice` | `views/notice/NoticeManage.vue`；其编辑子路径仍归此菜单激活 | 30 |
| 系统 | AI 配置 / `AiConfig` | `/ai/config` | `views/ai/AiConfig.vue`；现有前端没有 `superOnly` | 32 |
| 系统 | 调用日志 / `AiLogs` | `/ai/logs` | `views/ai/AiLogs.vue`；现有前端没有 `superOnly` | 33 |
| 系统 | 系统配置 / `SystemConfig` | `/system/config` | `views/system/SystemConfig.vue`；`superOnly: true` | 34 |
| 系统 | 管理员账号 / `AdminList` | `/system` | `views/system/AdminList.vue`；`superOnly: true` | 35 |
| 由公告页进入 | `NoticeEdit` | `/notice/edit/:id?` | `views/notice/NoticeEdit.vue`；无 id 新建，有 id 编辑，两个入口均保留 | 31 |
| 公共独立页面 | `Login` | `/login` | `views/login/Login.vue`；`meta.public: true`，不套管理员导航 | 9 |
| 重定向 | 无 name | `/`、`/audit`、`/:pathMatch(.*)*` | 分别到 `/dashboard`、`/audit/activity`、`/dashboard` | 15、27、38 |

五类审核是**五条真实静态路由共享一个依 type 动态渲染的组件**，不是新建 `/audit/:type`，也不存在后台问答审核路由。不要因都使用同一组件而漏掉任何菜单；通用内容管理的问答 tab 也不能因此被删除。

### `layout/AdminLayout.vue`：从侧栏改成水平顶栏

源码锚点：[template:1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/layout/AdminLayout.vue:1)、[导航模型:125](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/layout/AdminLayout.vue:125)、[style:274](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/layout/AdminLayout.vue:274)。第 88–272 行脚本完整冻结。

具体模板改造：

1. 移除 `<aside class="sidebar">` 的纵向容器形态，将其品牌、导航组和用户信息移动进顶部 header/nav。页面从左 232px/右主区改为自上而下的单列：第一行“梧桐校园 / 管理后台”品牌、既有搜索、主题/待办/退出/管理员身份；第二行五个导航组按钮；第三行展开组的全部子链接；再下方是小面包屑和 `<router-view />` 主体。内容区域不能留 232px 或 64px 的左侧占位。保留原契约节点，仅增加外层展示容器，不改带绑定的标签种类。
2. 原第 13–43 行导航循环保留：`v-for="(group, groupIndex) in visibleGroups"`、`toggleGroup(group.label)`、`:aria-expanded="expandedGroup === group.label"`、`:aria-controls` 的原模板字符串 `nav-group-items-${groupIndex}`、匹配 id、`is-collapsed`、`v-for="item in group.items"`、`:to="item.to"`、`:class="{ active: isActive(item.to) }"`、`ICONS[item.icon]`、`counts[item.countKey] ?? 0`、`item.gold` 全部不变。增加 `.admin-navigation` 外容器，采用 `display:flex;flex-wrap:wrap`；`.nav-group { display:contents }`，所有 `.nav-group-toggle { order:0 }`，`.nav-group-items { order:1;flex-basis:100%;display:flex;flex-wrap:wrap }`，使五组按钮排列在上方、当前展开的全部子项在下方跨全宽。折叠状态 `.nav-group-items.is-collapsed { display:none }`，防止看不见的链接仍占 Tab 焦点；窄屏允许组按钮和子项自然换行。
3. 五个组名依旧是“概览、内容审核、内容管理、用户与社区、系统”。第一层始终可见，点击组后一次展示其全部授权子项；“内容审核”必须同时露出六个子项，“系统”超管为五个、审核员为三个。不得把系统配置/管理员账号挪到一个未说明的头像隐藏菜单，也不得只露四个常用页。
4. 原 `brand` 点击仍为 `$router.push('/dashboard')`。原 `side-user` 身份块移至顶部，保留头像首字母、nickname fallback、`roleText` 和原 `$router.push('/system/config')` 行为；普通审核员点击仍由原路由守卫回到看板，不擅自新增个人资料页或修改权限。保持原“梧桐校园”品牌文字，仅调整图形容器的配色与形状，不触碰脚本中的业务/图标常量。
5. 原第 64 行 `ref="searchRef" v-model="keyword" @keydown.enter="onGlobalSearch"` 和完整原 `placeholder` 保留。`Ctrl/Meta + K` 聚焦保留。搜索输入窄屏移动到顶栏下一行，不以 `display:none` 让搜索消失。当前 `onGlobalSearch` 实际仅导航 `/user` 或 `/user?q=...`，且当前 `UserList` 不消费 query；不能新增全站搜索、工单 API 或自动查询逻辑。可在输入框旁新增静态说明“回车进入用户管理”，不替换受保护的 placeholder，具体原行为冻结。
6. 主题 `toggleTheme`、待办 `goNotice`、退出 `logout` 原绑定和按钮 title 不变；失败角标 `v-if="countError" @click.stop="loadCounts"` 和成功角标 `totalPending` 不得合并。显示“!”仍能只重试而不触发待办跳转；保留 `statsPendingCounts` 每 30 秒刷新、失败时保留上次值和卸载清理。
7. 页内容仍是原单一 `<router-view />`，不增加根据 tab 条件手工挂载视图的第二套导航；不强加 `key`、KeepAlive 或改变重用生命周期。

具体 CSS 改造：`.admin-shell` 单列；删除 `.sidebar` 固定高度/纵向 sticky/深色背景及响应式 64px 栏规则；`.main/.content` 保留 `min-width:0`，居中至 1280px；`.topbar` 从 60px 紧凑工具条改成约 88–94px 品牌行，导航区域在其后正常文档流。导航选中用浅灰绿胶囊和深绿文字，待办角标使用青柠/危险色且文本可辨。宽度不足时品牌行和搜索换行、五组按钮允许换行；子导航始终横向流式排列，不转换成左抽屉或移动侧栏。390px 屏下不会生成全页横向滚动。顶部区域若 sticky，只固定品牌行；多行导航留在正常流，避免手机内容被超高吸顶区域遮住。

权限/状态不可变项：`visibleGroups` 在第 170 行依据 `adminStore.isSuper` 过滤 `superOnly`；`roleText` 在第 187 行只定义 `super=超级管理员`、`audit=审核员`；`totalPending` 第 193 行仅汇总 activity/idle/lostfound/post/partner/report，**ai 是子集，不可重复累加**。`goNotice` 第 227 行按既有计数和顺序选目标，无待办回 `/report`。`router.beforeEach` 第 47 行无 token 到 `/login?redirect=...`，非 super 访问受限页面回 `/dashboard`，损坏 `admin_info` 容错解析；都不得为导航改造而删除或弱化。

## 3. 逐页功能和模板改造

以下每页的 script 行区间全部冻结，允许修改的模板锚点及 style 起始行单独标明。下列列名、字段、条件、数值区间和枚举是现有实现，不是建议新增的接口。

### A01 登录 — `views/login/Login.vue`

源码：[模板:1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/views/login/Login.vue:1)；script 35–95；style 97 起。

目标：独立的同频浅灰绿登录页，无任何侧栏/管理导航。桌面中间 1000px 双区域，一侧为简洁校园几何插画和“管理后台”说明，一侧白色 26px 圆角登录卡，表单宽约 400px；插画仅装饰且 `aria-hidden`。手机缩为单列表单，卡片宽 `calc(100% - 32px)`。改 `.login-page/.login-card/.brand/.captcha-row/.login-row/.submit/.tip`，验证码和错误提示不被装饰压住。

保留清单：

- `el-form :model="form" @keyup.enter="submit"`；`form.username` 账号，`form.password` 密码、`type="password" show-password`，原 User/Lock 前缀图标。
- `form.captchaCode`，`captchaMode === 'math' ? 3 : 4` 长度、对应 placeholder；图片模式 `:src="captchaImage" @click="loadCaptcha"`，算术模式 `captchaExpression @click="loadCaptcha"`。`captchaId` 由原脚本写入；不可静态化验证码。
- `remember` checkbox 只持久化用户名，不能承诺持久登录。`submit` 对账号/密码/验证码非空检查；loading、失败 `loadCaptcha()`、登录前旧状态清理、成功跳 `/dashboard` 保留。
- “忘记密码？”原来仅 `@click.prevent` 无恢复流程；保留原元素/行为，不假造重置 API。初始账号提示现有文本仍可放在卡片底部低强调区域，不能把它改成会自动登录的快捷按钮。

验收：图片/算术验证码均可刷新和输入；密码可显隐；回车/点击提交绑定相同；记住用户名、失败自动刷新及 loading 未丢失。

### A02 数据看板 — `views/dashboard/Dashboard.vue`

源码：[模板:1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/views/dashboard/Dashboard.vue:1)；script 83–245；style 247 起。

目标：原型的 welcome 留白布局用于 `.admin-greeting`，去掉大面积蓝色/渐变背景。日期和问候左对齐，更新状态在右；接四张平铺白卡，再为趋势宽卡+失物环图窄卡，最后待审核清单+模块发布量。桌面 `.admin-charts` 约 `1.65fr 1fr`，`.admin-panels` `1fr 1fr`；760px 以下单列，统计 2×2；390px 下标题换行、图表宽度缩到容器但高度保留约 280–320px。

保留清单：

- `dateLabel`、`loading`、`errors.length` 三态的 `.system-pill`；`v-if="errors.length" role="alert"`、`errors.join('、')` 和 `@click="loadDashboard" :disabled="loading"`。
- `v-for="c in cards" :key="c.label"` 四项真实指标：总用户数 `overview.totalUsers`、今日活跃 `todayActiveUsers`、今日 AI 调用 `todayAiCalls`、待审核 `pendingAudits`；缺值 `'-'` 不伪造为 0。`c.value/c.label/c.icon/c.soft/c.color` 原绑定保留。
- 三个 ECharts 容器 `ref="trendRef"`、`ref="pieRef"`、`ref="moduleRef"`；近 30 天累计用户/AI 调用双折线与双 Y 轴、失物状态环图、各模块发布量柱图，tooltip/legend 和 ResizeObserver/dispose 原脚本不变。
- `pendingList` 每行的 `a.key/type/title/submitter/createTime`、`typeCls/typeText/formatTime`、`goAudit(a.type)`；加载、读取失败、空列表三者必须区分。保留原“读取失败，请重试。”“暂无待审核内容”“概览数据已更新”“重新加载”可访问文字，供现有浏览器回归使用。
- `goAudit` 将 `lost`/`lostfound` 映射到 `/audit/lostfound`，其他可审核类型进相应审核页，未知类型进 `/content`。只展示原 5 条待审来源，不擅自添加列表分页或导出。

验收：部分接口失败时可见错误而非“暂无”；点击重新加载恢复；切窄屏 Canvas 自适应而不是 0 宽/被裁切。

### A03 用户管理 — `views/user/UserList.vue`

源码：[模板:1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/views/user/UserList.vue:1)；script 43–90；style 92 起。

目标：保留 WtPageHeader，下方一张白色管理表。`.toolbar` 从拥挤内联元素改为左侧输入与状态筛选、右侧搜索按钮的流式工具条；输入圆角 12px，表格区域和分页之间留 20px。手机筛选纵向/换行、表格横向滚动，操作列完整保留。

- 查询：`keyword` 学号/昵称、`@keyup.enter="search" @clear="search"`；`status` 0 正常/1 已禁用/可清空，`@change="search"`；按钮 `search` 重置 `pageNum=1` 后调用 `load`。不得添加未经实现的院系/注册日期筛选。
- `el-table :data="list" v-loading="loading"`，全部七列：`id`、`studentNo || '—'`、`nickname`、`phone`、`formatTime(row.lastLoginTime) || '从未登录'`、status 标签、操作。
- `row.status === 0` 才显示禁用 `toggle(row,1)`，否则解封 `toggle(row,0)`；所有行均有 `resetPwd(row)`。原 `ElMessageBox.confirm` 与禁用/解封说明、重置为 `123456` 的确认/成功反馈保留。没有额外前端角色分支，不新增/去掉权限检查。
- 分页 `v-model:current-page="pageNum" :total="total" :page-size="10" layout="total, prev, pager, next" @current-change="load"` 完整保留。

验收：正常/禁用切换后的按钮条件不乱，取消确认不执行操作，最近登录格式仍由统一工具渲染。顶部全局搜索 query 未消费属于既有边界，本页不顺便修业务。

### A04 五类内容审核 — `views/audit/AuditModule.vue`

源码：[模板:1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/views/audit/AuditModule.vue:1)；[类型配置:109](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/views/audit/AuditModule.vue:109)；script 98–219；style 221 起。必须分别访问 activity/idle/lostfound/post/partner 五个路由验收。

目标：`.page-head` 与同频页头一致，标题 `cfg.title` 与说明 `cfg.desc` 不能写死成某一类；右侧保留全部/待人工审核胶囊切换和刷新。`.review-list` 是全宽竖排白色审核卡，不是窄侧栏；桌面每张约 `120px minmax(0,1fr) auto`：封面、内容、处置。partner 无封面时仍为 `minmax(0,1fr) auto`。手机封面与标题同区、描述与 AI 原因完整换行、操作在卡底横排；不可限制长审核理由为无法展开的一行。

- 视图：`viewMode` 值 `'all'/'pending'`，`@change="handleViewChange"`；刷新 `@click="load" :disabled="loading"`；`list/loading` 保留。原 all 调 `auditAll`、pending 调 `auditList`，type、pageNum 和 `pageSize=8` 不变。
- 卡片：`v-for="row in list" :key="row.id"`；`props.type === 'partner'` 的 `no-cover` 和 `v-if="props.type !== 'partner'"` 不变；封面 `firstValidImage(row)`、`imageErrors[row.id]`、`:preview-src-list="normalizeImages(row)"`、`@error="imageErrors[row.id] = true"` 和 `cfg.icon` fallback 均保留。
- `displayTitle(row)`、`statusClass/statusText(row.auditStatus)`、`riskClass/riskText(row.aiRiskLevel)`、`formatTime(row.createTime)`、`sourceText[row.auditSource] || '人工'`、row.id、`displayDesc(row)` 完整显示。source `manual/ai/ai_manual` 对应人工/AI 自动/AI+人工；risk null/undefined 为未评估，不当成低风险。
- partner 标题来自 `subject || '未填写科目'`，描述拼 goal/schedule/intro/contact；其余 `title || content` 和 `description || content` 不变。五类 cfg 文案/图标不从模板重建。
- AI 预审块仅在 `row.aiRiskLevel !== null && row.aiRiskLevel !== undefined && row.aiAuditReason` 存在时展示，保留 risk 文案、`row.aiAuditReason`。使用雾蓝或浅青柠浅底、深色说明，不能把所有风险视觉统一成安全绿。
- 操作：`row.auditStatus !== 1` 才显示 `pass(row)`；`row.auditStatus !== 2` 才显示 `openReject(row)`；两者 `:disabled="acting"`。已通过仍可驳回、已驳回仍可通过，不能按“只有待审核才能操作”擅自收窄。
- 分页 `v-if="total > pageSize"`、`pageNum/total/pageSize`、`@current-change="load"`、`total, prev, pager, next`。
- 驳回弹窗 `rejectVisible`、`rejectReason` textarea 3 行/maxlength 255/必填说明；取消 `rejectVisible=false`，确认 `reject :loading="acting"`。`rejectReason.trim()` 不能为空；成功关闭、刷新并通知作者的反馈保留。
- `watch(() => props.type, resetAndLoad)` 在路由间清页码和 imageErrors；不通过新容器 `key` 或条件销毁取代原行为。

验收：5 类分别切 all/pending、翻页、图片成功/失败/预览、pass/reject、空理由拒绝、acting 防重复；partner 无多余空封面，内容与联系信息未丢。

### A05 内容管理与签到报表 — `views/content/ContentManage.vue`

源码：[模板:1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/views/content/ContentManage.vue:1)；[报表弹窗:51](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/views/content/ContentManage.vue:51)；script 88–174；style 176 起。

目标：把卡片 header 中的 `.head/.sub` 提升为同频页头的视觉层级，依旧可在原模板内做；下方五个 tab 为横向浅灰绿标签，接完整表格。报表弹窗采用白色 26px 圆角、三张浅底汇总卡，两个导出按钮放标题下工具条，替换 `float:right` 排列，手机换行。

- `el-tabs v-model="type" @tab-change="load"` 五项：activity 活动、idle 闲置、lostfound 失物招领、partner 学习搭子、qa 互助问答；**此页没有 post tab，不凭空补加**。
- 全部五列表格：`titleOf(row)` 标题（partner 的 subject/goal 拼接）、审核标签（qa 免审，其余 auditStatus）、`statusText(row)`、`formatTime(row.createTime)`、操作固定右侧。
- `v-if="type === 'qa' || row.auditStatus === 1"` 决定是否允许上下架；`!isOff(row)` 则 `doOff(row)`，否则 `doOn(row)`；签到报表仅 `type === 'activity' && !isOff(row)` → `openReport(row)`。未通过非 qa 显示 `—`。保持 `isOff`：activity/idle 为 status=3；partner/qa 为 9；lostfound 为 2。
- 状态文字全部保留：活动报名中/已报满/已结束/已下架；闲置在架/已预约/已完成/已下架；搭子匹配中/已找到/已下架；问答待答/已解决/已下架；失物进行中/已完成/已下架。
- `pageNum`、`total`、固定 page-size 10、`prev, pager, next` 与 `@current-change="load"`；tab-change 当前只调用 load，不在此次改造补页码重置逻辑。
- `el-dialog v-model="reportVisible" destroy-on-close` 保留；`report` 非空后展示 `joinedCount/signinCount/signinRate` 三值；`report.members` 表格 max-height 360，四列学生 nickname、报名状态 memberStatus 待审批/已通过/已拒绝、signed 已/未签到、`formatTime(row.signTime)`。
- 报表 header 内 `doExport('members')` 导出报名名单、`doExport('signins')` 导出签到名单，两按钮共用 `exporting` loading；使用原 `report.activityId`，不写死 id、不改文件下载、不伪造已导出反馈。

验收：五 tab、不同审核/下架状态、活动报表打开与两个真实导出入口均可达；手机导出按钮不盖关闭按钮，报表内部可滚动。

### A06 AI 内容审核 — `views/ai/AiContentAudit.vue`

源码：[模板:1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/views/ai/AiContentAudit.vue:1)；[三 tab:58](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/views/ai/AiContentAudit.vue:58)；script 164–278；style 280 起。

目标：同频页头+刷新，四张低密度 KPI 卡，完整宽表。`.kpi-grid` 桌面四列、手机两列；`tabs/tab` 采用深绿选中胶囊；规则排行用浅底条形容器和深绿进度，列表行保持说明可读。拦截理由弹窗与通用审核统一。

- `loadAll :disabled="loading"`；四 KPI：`pendingCount` 待人工复核、`blockedCount` AI 预审拦截、`passedCount` 自动放行、`blockRate` AI 拦截率。全部保留真实 computed。当前每类只拉第 1 页 100 条，数据为当前获取范围；不得写成“全平台累计”“实时全量”。
- `tabs` 的 pending 待复核、log 拦截日志、rules 规则命中；`@click="tab = t.key"`，pending/log 的 count badges。三个内容区原 `v-show` 不换成销毁式 `v-if`。
- 待复核 `pendingList` 表的组合 row-key `r.type + '-' + r.id`：类型 `typeText/typeTag`、内容 `row.title || row.content`、风险 `riskText/riskClass`、aiAuditReason、提交时间 formatTime、固定右侧操作。`restore(row)` 恢复展示（先确认）和 `openBlock(row)` 维持拦截，均 `:disabled="acting"`。
- 拦截日志 `blockedList` 表同组合 row-key，类型、内容、风险、命中规则 aiAuditReason、处理状态 `statusClass/statusText(row.auditStatus)`、时间。两张表各自 loading/empty 文案和条件都保留，不能只留下当前默认 tab。
- 规则区 `ruleRows` 各行 `r.rule/r.pct/r.count`；空数据时原规则空态。计算对风险≥1、非空原因分组，排序取前 8；不可改为假造固定“敏感词”列表。
- `blockVisible` 弹窗，`blockReason` textarea 3 行、maxlength 255、**选填**；取消置 false，确认 `confirmBlock :loading="acting"`。不填时使用原默认驳回原因；不可与通用审核的必填逻辑混淆。
- `TYPES` 为 activity/idle/lostfound/post/partner；待复核风险≥1，拦截日志风险≥2，自动放行是 `(aiRiskLevel ?? 0) === 0 && auditStatus === 1`；原聚合和容错不改。页面无分页，不新增假分页控制。

验收：三个 tab 都可看，行类型/id 不串，恢复确认、维持拦截选填原因、操作 loading、三处空状态保留；KPI 不误称全量。

### A07 举报处理 — `views/report/ReportList.vue`

源码：[模板:1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/views/report/ReportList.vue:1)；[处置弹窗:41](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/views/report/ReportList.vue:41)；script 71–129；style 131 起。

目标：WtPageHeader 下方白色表面，卡片 header 的重复标题可保留为小区块标签；状态过滤为水平胶囊。处置弹窗动作选项采用可换行的清晰行，说明输入全宽，危险动作仍明确标红，不将单选替换为会立即发请求的按钮。

- `status` 全部 undefined、待处理 0、已处理 1；`@change="search"` 重置 pageNum。不能把全部改成 2 或空字符串。
- 八列：id、reporterId、对象 `typeName(row.targetType)` + targetId、reasonType、reason tooltip、status 标签、handleResult tooltip、操作；只 `row.status === 0` 显示 `openHandle(row)`。
- `typeName` 当前支持 idle/activity/lostfound/post/comment/user，未知直接显示原值，不过滤未枚举类型。
- `handleVisible`、`currentRow`、`handleForm.action`；举报用户时 warn 警告用户 / ban 封禁用户 / ignore 不成立；其他对象时 offline 下架内容 / warn 警告发布者 / ban 封禁发布者 / ignore。保留 `currentRow?.targetType === 'user'` 条件和 openHandle 的 warn/offline 默认值。
- `handleForm.handleResult` 必填、trim 非空检查、maxlength 255、3 行 textarea；取消 false、确认 `doHandle :loading="acting"`，处理后关闭、load、通知举报人的成功信息。
- 10 条分页 `pageNum/total/current-change=load` 和 `total, prev, pager, next` 不变。

验收：举报用户时没有下架内容选项；已处理行无重复处置入口；空处置说明拦截，长理由 tooltip 和结果仍可读。

### A08 公告管理 — `views/notice/NoticeManage.vue`

源码：[模板:1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/views/notice/NoticeManage.vue:1)；script 41–84；style 86 起。

目标：WtPageHeader 及表格卡采用同频留白，“新建公告”原按钮移到页头 default slot 或卡头右侧均可，保留唯一可达入口；表格标题列给予主要弹性空间，状态为浅底胶囊。手机操作列留在内部横向滚动区域。

- 新建 `$router.push('/notice/edit')`；列表 `list/loading` 六列：id、title tooltip、status 草稿0/已发布1/已下线2、`formatTime(row.publishTime)`、`formatTime(row.createTime)`、操作。
- 编辑所有行保留 `$router.push` 对模板字符串 `/notice/edit/${row.id}` 的调用；`row.status !== 1` 显示 `publish(row)`，`row.status === 1` 显示 `offline(row)`；所有行 `remove(row)` 且保留原删除确认框。
- `publishNotice/offlineNotice/deleteNotice` 原调用和反馈不变；10 条分页 `pageNum/total`，`total, prev, pager, next @current-change="load"`。

验收：草稿、已发布、已下线分别对应正确按钮，删除取消无动作；新建与带 id 编辑路由都可进入。

### A09 公告编辑 — `views/notice/NoticeEdit.vue`

源码：[模板:1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/views/notice/NoticeEdit.vue:1)；script 30–85；style 87 起。

目标：上方同频编辑页头+真实新建/编辑状态，下方一张宽编辑工作区：标题、封面 URL；再是等宽的 Markdown 输入与实时预览；最后保存草稿、保存并发布、返回。`editor-row` 桌面 `minmax(0,1fr) minmax(0,1fr)`，小于 900px 变上下排且预览不隐藏；编辑区与预览浅灰绿细边框、16px 圆角。`md-preview` 背景由硬编码 `#fafbfc`、代码块 `#f6f8fa` 改为主题 token，富文本内部 heading/list/link/image/code 的留白及溢出可读。

- 卡片 `v-loading="loading"`，header `id ? '编辑公告' : '新建公告'` 与 Markdown 标识；`form.title` 必填、maxlength 64、show-word-limit；`form.cover` 可空 URL 输入，不伪造上传控件或上传接口。
- `form.content` textarea rows=18，保留 Markdown placeholder；`v-html="preview"` 和 `md.render(form.content || '')` 原计算。当前真实编辑器是 **Markdown textarea + MarkdownIt 预览**；虽 package 声明了 WangEditor，但此视图未使用，不能因“保留富文本”而替换成另一套编辑器、变更存储内容或新增上传行为。
- `save(false)` 保存草稿、`save(true)` 保存并发布，均 `:loading="saving"`；返回 `$router.back()`。
- `id` 原来自 `Number(route.params.id)`，有 id 才加载 noticeDetail；title/content 的 `.trim()` 非空校验保留；create/update 后选择 publish，成功回 `/notice`；不添加自动保存、预览请求或创建后不同跳转。

验收：新建和编辑两条路由，标题/内容必填，64 字边界，实时 Markdown 预览，两个保存分支、返回及窄屏长代码/图片不溢出。

### A10 AI 配置与提示词模板 — `views/ai/AiConfig.vue`

源码：[模板:1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/views/ai/AiConfig.vue:1)；[模板表:41](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/views/ai/AiConfig.vue:41)；script 98–162；style 164 起。

目标：保留两个纵向白卡，不建立左侧配置导航。第一卡为连接信息+生成参数的二列网格，宽地址/API Key/模型名单独占完整行；数字项两列，手机单列。第二卡是完整提示词模板表格；“新建模板”右上角。弹窗采用清晰标签和宽 textarea，placeholder 全部保留。

| 现有输入 / 绑定 | 原约束，全部保留 |
|---|---|
| 模型服务地址 `configs.base_url` | placeholder `https://api.deepseek.com` |
| API Key `configs.api_key` | password + show-password；留空使用服务端 application.yml 原提示，不能改为必填 |
| 模型名称 `configs.model_name` | placeholder `deepseek-chat` |
| temperature `temperatureNum` | min 0、max 2、step 0.1 |
| 最大输出 token `maxTokensNum` | min 256、max 8192、step 256 |
| 超时时间 `timeoutNum` | min 5000、max 300000、step 5000，单位 ms |
| 失败重试 `retryNum` | min 0、max 5 |
| 每用户每日限流 `rateLimitNum` | min 1、max 1000 |

- 保存配置 `save :loading="saving"`；卡片 `v-loading="loading"`。原 `num(key)` 在数字与配置字符串间转换，不将 v-model 改为直接写数值 configs 字段。
- 提示词 `prompts` 表五列 scene、name、content tooltip、enabled 1 启用/其他停用、编辑 `openEdit(row)`；新建 `openEdit()`。当前无删除/分页/批量启停，不造新功能。
- `editVisible`，title 依据 `editForm.id`；`editForm.scene` 枚举 chat 答疑、code_fix 代码纠错、pdf PDF问答、outline 提纲、quiz 习题；`editForm.name`；`editForm.content` 8 行 textarea，保留 `{question} {code} {language} {context} {subject} {topic} {answer}` 占位符提示。
- `editForm.enabled` 的 `:active-value="1" :inactive-value="0"`，不可变 true/false；取消 `editVisible=false`、保存 `savePrompt`，原 create/update 分支和保存后重新 listPrompts 不变。
- 此页现有前端没有 rules/validator，也无 superOnly。不得把新加的 UI 必填星号说成新增校验，不能未经授权改变角色可达性。

验收：8 个配置输入全在，所有数字范围/步长原样，API Key 显隐、保存；新建/编辑五场景与占位符、启停整数值均正常。

### A11 AI 调用日志 — `views/ai/AiLogs.vue`

源码：[模板:1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/views/ai/AiLogs.vue:1)；script 51–88；style 90 起。

目标：页头下整张白色日志工作表；toolbar 四个控件水平对齐，窄屏换行。Token 与耗时使用对齐数字字体，错误信息保留 tooltip；不要把失败项折叠到无法操作的隐藏 panel，不新增导出按钮。

- `userId` input-number `:controls="false"`；`scene` 可清空且 `@change="search"`，chat/pdf/code_fix/outline/quiz 五项；`status` 成功0/失败1/可清空，`@change="search"`；查询按钮 `search`。
- 表格 `list/loading` **九列**：id、userId、scene、model、`row.promptTokens + row.completionTokens` 的双数展示（原模板是两个数中间显示 `+`，不是求和替代）、`(row.costMs / 1000).toFixed(1) + 's'`、status、errorMsg tooltip、`formatTime(row.createTime)`。
- `pageNum`、`total`、10 条分页和 `total, prev, pager, next @current-change="load"`。原 search 重置页码；load 的 userId 空值转换、scene/status 参数不变。

验收：用户/场景/成功失败过滤与翻页，失败 errorMsg 和两类 token 用量未丢，时间/耗时格式正确，窄屏能访问最后一列。

### A12 系统配置 — `views/system/SystemConfig.vue`

源码：[模板:1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/views/system/SystemConfig.vue:1)；[动态类型输入:26](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/views/system/SystemConfig.vue:26)；script 88–178；style 180 起。仅 super 可见/访问。

目标：同频页头，下方水平分组筛选+刷新/保存工具条；每组各一张完整白卡，组名和项目数量位于卡头，配置项采用标签在上或桌面固定宽标签在左的清晰对齐布局；长说明可换行。手机 `el-form` label 不再固定占 200px，数字输入与 textarea 随可用宽度，所有配置键说明保留。不得改成左侧设置菜单或硬编码只展示常用字段。

- `activeCategory` 与 `@change="onCategoryChange"`；全部分组的 `label=""` 以及循环 `:label="c.key"` 保留原 Element Plus 使用方式。六组 basic 基础功能、site 站点信息、audit 内容审核、chat 私信聊天、upload 上传设置、security 安全设置。
- `loadData` 刷新，`saveAll :loading="saving"` 保存全部即时生效；外层 `v-loading="loading"`；`groupedConfigs` 循环 `:key="group.category"`、group.label 与 group.items.length。未知后端分组仍可随全部数据渲染，不能只写六张固定卡。
- 每项 `:key="item.configKey" :label="item.description || item.configKey"`；所有控件均绑定 `formData[item.configKey]`；下方 `item.configKey` 提示。
- bool → switch **字符串** active-value="true"、inactive-value="false"；int/long → input-number controls-position right；double → input-number precision 2、step 0.1；list → 2 行 textarea 提示英文逗号；json → 4 行 textarea JSON 示例；其他 string → input 配置键 placeholder。各类型条件/顺序不改，不把 list/json 转成对象编辑器。
- `filteredConfigs.length === 0 && !loading` 的 el-empty 保留；原类别/组内 sort 排序、切换只客户端过滤、保存提交 allConfigs 全部键再 loadData 的行为不变。不要增加仅保存当前组、dirty 比较、JSON 自动格式化/新增前端校验。

验收：超管完整六组与未知组兜底，按类别过滤不清空未展示配置，六类控件（数字 int/long/double 包含各自约束）能编辑，保存全部含非当前组值，空态与 loading 保留。

### A13 管理员账号 — `views/system/AdminList.vue`

源码：[模板:1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/views/system/AdminList.vue:1)；[编辑弹窗:34](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/views/system/AdminList.vue:34)；script 59–111；style 113 起。仅 super 可见/访问。

目标：同频页头、白色账号表、右上“新增子管理员”。角色标签区分超管与审核员但不大面积警告色铺底；编辑弹窗单列表单，所有标签与密码提示可见，手机宽度适配。

- `openEdit()` 新增；`list/loading` 表六列 id、username、nickname、role（super 超级管理员 / 其他审核员）、`formatTime(row.createTime)`、`openEdit(row)` 编辑；10 条分页 `pageNum/total/current-change=load`、`total, prev, pager, next`。
- `editVisible` title 依 `editForm.id`；`editForm.username` required，`:disabled="!!editForm.id"`，编辑时用户名不可修改。
- `editForm.password` password/show-password；label 新建“密码”/编辑“新密码”，`:required="!editForm.id"`；新建 placeholder “6位以上”，编辑“留空则不修改”。当前脚本没有本地六位 validator，不擅自宣称已经有该前端验证。
- `editForm.nickname`；`editForm.role` 值 audit/super 原下拉选项（不可删除创建超管选项），默认 audit；取消 `editVisible=false`、`save :loading="saving"`；createAdmin/updateAdmin 原分支、成功关闭与刷新。
- 无删除、批量禁用或新角色管理功能，不添加看似可点但无 handler 的按钮。

验收：新增默认 audit、编辑用户名禁用/密码空不修改提示、两个角色可选、保存 loading、分页；非 super 不显示菜单且直接访问由守卫拒绝。

## 4. 现有测试与源码保护

### 导航相关测试不是必须保留侧栏的证明

[layout/adminSidebarNavigation.mjs:1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/layout/adminSidebarNavigation.mjs:1) 名字带 Sidebar，但实际提供的是路由匹配、查找组、展开切换、跨组同步的纯函数。文件及其 [测试:16](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/layout/adminSidebarNavigation.test.mjs:16) 原样保留。

测试五组断言继续适用于水平分组导航：

1. 第 16 行：dashboard 精确匹配，审核子路径可匹配且不同类不撞前缀。
2. 第 22 行：`/system` 必须精确匹配，不抢占 `/system/config`。
3. 第 28 行：按 route 找到分组；无匹配返回 null。
4. 第 33 行：点组打开、换组、再点关闭。
5. 第 39 行：用户手动折叠当前组后，同组路由变化不强行重开；切到新组才展开新组。

这些测试没有 DOM 侧栏断言，不需要因无侧栏而删除或修改。顶部导航直接重用原 `visibleGroups/expandedGroup/toggleGroup/isActive` 就能保全行为。不得把导航模型改为互不相关的硬编码链接后再移除原测试。

### 其他现有回归必须保留

- [views/user/UserList.test.mjs:7](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/views/user/UserList.test.mjs:7) 是源文件字符串检查，断言 `utils/date` 和 `formatTime(row.lastLoginTime)`；保留表达式和导入，不因改了表格而删测试。
- [tests/browser/system-admin.cjs:7](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/tests/browser/system-admin.cjs:7) 覆盖看板失败不当空、重新加载恢复、390×844 窄屏图表及零 pageerror，依赖“重新加载”“读取失败，请重试。”“暂无待审核内容”“概览数据已更新”等文本；这些断言应继续原样通过。
- [api/auth-token.test.mjs:5](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/api/auth-token.test.mjs:5)、[api/request.test.mjs:5](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/admin/src/api/request.test.mjs:5)、`utils/date.test.mjs`、`utils/image.test.mjs` 保持不变；它们保护登录请求不附旧 token、日期与图片转换，不能为 UI 重做请求工具。
- 仓库另有旧独立 HTML 原型 [前端UI-原型-HTML版/qa/verify.cjs:89](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/前端UI-原型-HTML版/qa/verify.cjs:89)，第 90 行等待 `.sidebar.open`；该段在旧原型的学生端 `base+'#/home'` 上执行，不是 Vue 管理端测试。本任务不改旧原型，不删除其断言。若未来将该测试改接真实新站，只能更新导航定位为新的可访问控件，同时保留菜单可达/路由/溢出等行为断言，不能简单移除测试。
- `tests/browser/e2e/test-02-audit.cjs`、`test-04-activity.cjs`、`test-06-partner.cjs`、`test-12-report.cjs` 等主要验证现有服务业务，UI 变化不作为更改它们的接口调用或断言的理由。不得把旧 HTML 原型截图成功当成实际 Vue 管理端验收成功。

### 实施后的具体检查

1. 与 `91214e0` 比较所有现有 Vue script 原始字节，以及 router/api/store/utils/main/config/package 文件；任一差异都不属于本轮 UI 许可。源代码冻结检查应在打包前先跑。
2. 在 `web/frontend/admin` 运行既有 `npm test`、`npm run build`；不要改 test glob 来掩盖失败。为保证深层 `views/user` 回归确实被执行，可另外显式运行 `node --test src/layout/adminSidebarNavigation.test.mjs src/views/user/UserList.test.mjs`，并核对命令实际执行结果。
3. 启动现有 QA/开发环境运行 `tests/browser/system-admin.cjs`；测试需应用服务就绪。没有启动/无法连接时明确记录未执行，不能把“已写测试说明”记为通过。
4. UI 检查至少包含 1440×1000、1024×768、768×1024、390×844，明暗主题、super/audit/未登录三身份。15 个导航叶子超管逐一点击，审核员只缺原两个 superOnly 项；公告新建/带 id 编辑单独进入。浏览器返回/刷新及 `/admin/` base 正常，无左侧栏和移动侧栏。
5. 全部 13 视图按本文验收清单执行；同时覆盖空/加载/部分失败、长标题/长理由、验证码、图片失败/预览、危险操作确认、6 个 el-dialog（审核驳回、签到报表、AI维持拦截、举报处置、模板编辑、管理员编辑）及现有 ElMessageBox。当前管理端没有 `el-drawer`，不要以“保留抽屉”为由新造抽屉或遗漏弹窗。
6. 检查全部原表格列和 pagination、所有隐藏 tab 内容与状态条件、三个 ECharts ref、Markdown 输入与 HTML 预览、系统动态配置类型都保留；不可仅截图默认首屏。
7. 导航和表单可键盘访问，折叠组不产生隐藏焦点，焦点环可见；搜索 Ctrl/Meta+K、待办失败重试、主题持久化、退出全部可用。计数 loading/失败语义不与空值混淆；语义状态不能仅依靠颜色辨别。

## 5. 易被误改的现状边界

| 观察到的真实现状 | 本次处理 |
|---|---|
| 全局搜索仅跳 `/user?q`，UserList 未读 q | 保留行为，只允许修正文案表达；不实现全局搜索或补 query 监听 |
| 登录守卫带 redirect，而 Login 成功固定去 `/dashboard` | 不修改路由/登录脚本，不把重定向修复混入 UI |
| 原头像身份块对所有角色跳 `/system/config` | 保留原绑定和守卫；不引入资料页 |
| AI 审核按每类型第 1 页 100 条统计 | 展示范围明确，不伪装全平台统计，不增后端聚合 |
| ContentManage 只有活动/闲置/失物/搭子/问答五 tab；没有动态 tab | 五项完整保留，动态审核入口留在内容审核组 |
| 管理端没有 drawer、WangEditor 实例、批量审核、日志导出、提示词删除 | 不新增假入口；保留已有六个 dialog、Markdown 编辑器和真实导出 |
| 系统表单和 AI 模板/管理员表单没有额外本地 rules/validator | 保留已有约束和真实错误反馈，不凭空描述不存在的前端校验 |
| Canvas 使用固定蓝/杏系列色，现有脚本冻结 | 容器外观与同频一致，系列色作为本轮可解释的视觉例外保留 |

交付判定：所有原能力在新的同频横向顶部导航与统一视觉下仍可发现、可访问、可操作；没有侧栏；没有改动任何冻结脚本；实际构建、回归和跨屏状态检查有可核对结果。
