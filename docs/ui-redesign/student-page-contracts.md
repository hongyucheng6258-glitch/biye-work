# 学生端逐页与组件改造契约（源码核对附录）

本附录供执行 UI 重设计的模型/开发者直接使用：基线为 `91214e0`，工作分支 `feat/tongpin-ui-redesign`。范围是学生端 **42 个 views 文件（含 5 个错题子组件、1 个 3D 工作区）与 23 个共享组件，共 65 个 .vue 文件**；另含 UserHome.vue 内联 ContentList。MainLayout、App、全局样式、路由整体映射由主文档负责，不在本附录重复设计。本文只提出改造要求，未修改应用代码。

## 执行边界

- 目标视觉：浅雾青/天蓝 `#e1edf1` 作为环境面，深绿 `#244f46` 为标题/主操作，淡黄 `#e9efb0` 为重点提示与精选卡，白色阅读/输入面、细绿灰边、圆角、轻阴影。底部悬浮 Dock 使用主文档的统一布局；正文、分页、聊天输入和浮层必须避让 Dock 与 safe-area。
- **学生端不保留常驻左/右应用导航侧栏。** 首页 `home-aside` 是公告、日程等业务内容，可按主文档保留非对称内容双栏；不是导航侧栏。AI 历史、动态辅助内容、消息分组、游戏信息、活动票券按下列逐页方案重排为横向区或主内容流，原子节点和交互全部保留。错题等原有业务 Drawer 可以保留；若调整为居中/底部展示，必须保持原关闭、遮罩、焦点及表单机制，不强制把所有业务抽屉改成弹窗。
- 仅修改 template 中展示容器/静态装饰及样式；原节点除 class/style/title/aria-label 等纯展示属性外，原有属性、绑定、插值均原样保留。保留原有 class 作为结构挂钩，可追加新class和外包装；不要为换肤删除测试或父样式依赖的旧class。**所有 `<script>`（含 `<script setup>` 与普通 script）、API、store、router、utils、features 协议、认证、缓存、请求字段、返回处理、watch、生命周期、校验、数据计算、分页及路由行为冻结。** 不重写业务组件，不用原型静态数组替代接口，不删事件修饰符，不改 prop/event payload，不改变已有权限条件。
- 每节“原样保留的模板契约”是源码抽取的逐控件清单，包含所有事件、v-model、条件、循环、绑定prop、ref、slots以及表单选项/分页/上传约束。`L` 为本基线真实行号；有些条目为同一标签跨行属性，行号指标签起始处。class/style可按设计调整；同一条中的业务表达式必须保持语义和参数完全一致。
- “展示数据”列出模板插值，避免重排时丢失计数、元数据、提示或状态文案。“脚本锚点”用于回查，不授权修改脚本。未提供本地错误块的页面继续使用原请求层反馈，不能伪造已实现重试/新功能；对现有逻辑疑点另行记录，不混入换肤修复。
- 表格不可通过隐藏列来换取整洁；窄屏使用内部横滚或保留字段的堆叠卡片。图片预览、上传移除、展开高级字段、Markdown代码块/表格/图片、抽屉、对话框、二维码、焦点、键盘事件与错误状态均属功能，不是装饰。

## 优先核验的贯通场景

1. 匿名浏览 → 受限动作跳登录 → 登录redirect返回；注册/图片与数学验证码/维护页恢复；明暗主题仍可切换。
2. 首页与搜索结果 → 活动/闲置/失物/动态 → 对应详情 → 收藏/举报/发布者主页/带业务上下文私信；q、query.id、query.post、query.tab、query.role不能遗失。
3. 活动发布/编辑/审核展示 → 报名/审批/取消 → 名单分页/二维码；闲置预约→接受/拒绝→完成→双方互评；失物认领→同意/拒绝→本人确认归还。
4. AI普通会话SSE→切换/重命名/删除；校园向导；PDF上传新会话与旧历史恢复；Monaco失败textarea仍可纠错。
5. 错题拍照上传→OCR替换确认→人工补充→保存/继续→异步AI整理→重试→复习反馈→同类题作答/自核/显式保存→提纲/计划/薄弱报告→分页/筛选/批量选择。
6. 私信图片上传resourceId→发送中/失败重试/已送达/已读→离线REST→历史加载/拉黑/隐藏；系统消息类型、未读和目标跳转。
7. 游戏公私房→房主开局→画手指针绘制/橡皮/清空/跳过→猜词/聊天→计时/积分→当前与已结束题保存→离线重连和大厅作品预览。
8. 3D探索/导览/移动/进入房间→内嵌真实列表/详情/表单/私信→内层弹窗Escape→返回上级滚动与筛选恢复→返回房间→退出全屏；画质、舒适模式与失败重载。

## 文件级设计与完整绑定账本

### 01. 活动详情与发起人管理

源文件：`web/frontend/student/src/views/activity/Detail.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/activity/Detail.vue:1) · 脚本 [L201](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/activity/Detail.vue:201) · 样式 [L397](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/activity/Detail.vue:397), [L589](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/activity/Detail.vue:589)。

**具体视觉重排：** `.event-detail-layout` 改单列：封面与活动标题、描述、全宽票券摘要和操作带；原侧面 `.event-ticket` 移到标题下或描述前，不能固定为侧栏。日期票券保留淡黄强调；`.stack` 改横向可换行操作区。报名管理、签到二维码、举报弹窗用同一白色圆角样式。

**功能、状态和边界：** 保留返回活动列表、图片预览、发布者主页、收藏/取消、举报；所有者 loadMembers 和 showQrcode；非所有者报名、待审批/通过/拒绝反馈、canSignup 与 signupDisabledReason、已签到文案、取消报名的确认框及 canceling/signedIn 禁用条件、私信带 activity 上下文。报名 remark、审批通过/拒绝、成员10条分页、刷新名单、签到二维码图片与可手动录入 qrContent 必须完整；normalizeSigninQrContent 与 QRCode.toDataURL 不改。不是所有报名状态都能取消，不能由新视觉统一成一个按钮。

**可编辑的现有结构类：** `.event-page` L2；`.detail-breadcrumb` L5；`.text-btn` L6；`.event-detail-layout` L11；`.event-detail-hero` L14；`.detail-cover-img` L15；`.event-detail-heading` L17；`.head-tags` L18；`.tag` L19；`.event-host` L24；`.event-description` L35；`.detail-actions` L44；`.btn` L45；`.event-ticket` L56；`.ticket-top` L57；`.ticket-date` L61；`.ticket-perforation` L65；`.ticket-fact` L66；`.progress` L74；`.ticket-hint` L75；`.stack` L78；`.primary` L81；`.ticket-tag` L95；`.warning` L95；`.success` L96；`.error` L99；`.ticket-note` L116；`.members-pager` L161；`.qr-code-wrap` L176；`.qr-code` L177；`.qr-content` L179；`.qr-tip` L180。

**原样保留的模板契约：**

```vue
L2 <div> v-loading="loading"
L3 <template> v-if="act"
L6 <a> @click="$router.push('/activity')"
L15 <el-image> v-if="detailImages.length" :src="detailImages[0]" :preview-src-list="detailImages"
L16 <WtEventArt> v-else :item="act"
L19 <span> v-if="act.category"
L20 <span> :class="statusTagCls(act.displayStatus)"
L25 <el-avatar> :size="36" :src="act.publisherAvatar"
L30 <button> type="button" @click="goUser(act.userId)"
L45 <button> type="button" :class="{ favorited }" @click="toggleFavorite"
L49 <button> type="button" @click="reportVisible = true"
L74 <i> :style="{ width: capacityPercent + '%' }"
L80 <template> v-if="act.isOwner"
L81 <button> type="button" @click="loadMembers"
L82 <button> type="button" @click="showQrcode"
L85 <template> v-else
L86 <button> v-if="act.mySignupStatus === null || act.mySignupStatus === undefined" type="button" :disabled="!act.canSignup" @click="signupVisible = true"
L95 <span> v-else-if="act.mySignupStatus === 0"
L96 <span> v-else-if="act.mySignupStatus === 1"
L99 <span> v-else
L100 <button> v-if="act.mySignupStatus === 0 || act.mySignupStatus === 1" type="button" :loading="canceling" :disabled="canceling || act.signedIn" @click="doCancelSignup"
L110 <button> type="button" @click="contactPublisher"
L123 <el-dialog> v-model="signupVisible"
L124 <el-input> v-model="remark" type="textarea" :rows="3" maxlength="255"
L126 <template> #footer
L127 <el-button> @click="signupVisible = false"
L128 <el-button> type="primary" :loading="signing" @click="doSignup"
L133 <el-dialog> v-model="membersVisible"
L134 <el-table> :data="members"
L135 <el-table-column> prop="nickname" label="昵称"
L136 <el-table-column> prop="studentNo" label="学号"
L137 <el-table-column> prop="remark" label="报名说明"
L138 <el-table-column> label="状态"
L139 <template> #default="{ row }"
L140 <el-tag> :type="['warning','success','danger'][row.status]"
L145 <el-table-column> label="签到"
L146 <template> #default="{ row }"
L147 <el-tag> v-if="row.signedIn" type="success"
L148 <span> v-else
L151 <el-table-column> label="操作"
L152 <template> #default="{ row }"
L153 <template> v-if="row.status === 0"
L154 <el-button> type="success" @click="approve(row, true)"
L155 <el-button> type="danger" @click="approve(row, false)"
L161 <div> v-if="membersTotal > membersPageSize"
L162 <el-pagination> layout="prev, pager, next" :total="membersTotal" :page-size="membersPageSize" :current-page="membersPage" @current-change="onMembersPageChange"
L174 <el-dialog> v-model="qrVisible"
L175 <el-alert> type="success" :closable="false"
L177 <img> v-if="qrImage" :src="qrImage"
L184 <el-dialog> v-model="reportVisible"
L185 <el-select> v-model="reportReasonType"
L186 <el-option> label="虚假/欺诈信息" value="欺诈"
L187 <el-option> label="违规内容" value="违规"
L188 <el-option> label="广告骚扰" value="广告"
L189 <el-option> label="其他" value="其他"
L191 <el-input> v-model="reportReason" type="textarea" :rows="3" maxlength="500"
L192 <template> #footer
L193 <el-button> @click="reportVisible = false"
L194 <el-button> type="primary" @click="doReport"
```

**展示数据与动态文案（不得丢失）：**

```text
L19 act.category
L20 statusText
L22 act.title
L23 act.subtitle || '和校园里的同伴，一起做喜欢的事。'
L25 act.publisherNickname?.charAt(0) || '梧'
L27 act.publisherNickname || '校园同学'
L37 act.description
L47 favorited ? '已收藏' : '收藏'
L62 ticketDay
L63 ticketMonth
L63 ticketYear
L63 ticketTime
L68 act.location || '地点待定'
L72 act.memberCount || 0
L72 act.maxMembers ? ' / ' + act.maxMembers : ''
L75 ticketHint
L93 act.canSignup ? '立即报名' : (act.signupDisabledReason || '不可报名')
L97 act.signedIn ? '（已签到）' : '（活动现场请扫码签到）'
L108 act.signedIn ? '已签到不可取消' : '取消报名'
L141 ['待审批','已通过','已拒绝'][row.status]
L179 qrContent
```

**冻结的脚本处理器/生命周期锚点：**

```js
L248 function statusTagCls(s) {
L278 async function load() {
L290 async function toggleFavorite() {
L306 async function doSignup() {
L323 async function doCancelSignup() {
L340 async function loadMembers(page = membersPage.value) {
L348 function onMembersPageChange(page) {
L352 async function approve(row, ok) {
L358 async function showQrcode() {
L374 function goUser(uid) {
L380 async function contactPublisher() {
L384 async function doReport() {
L394 onMounted(load)
```

### 02. 校园活动列表

源文件：`web/frontend/student/src/views/activity/List.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/activity/List.vue:1) · 脚本 [L112](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/activity/List.vue:112) · 样式 [L223](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/activity/List.vue:223)。

**具体视觉重排：** 将 `.collection-head.activity` 做淡青圆角大标题区，发布按钮位于标题右下；`.toolbar` 搜索、分类 chips、我的报名横向排列；`.rec-block` 做独立淡黄推荐带，`.rec-grid` 横向卡片；`.grid` 为主体活动卡片网格，日期、人数与封面主次清晰。

**功能、状态和边界：** 保留 keyword 搜索/清空/Enter、六类加全部、goPublish 登录判断、我的报名；loadRecommend 的首次推荐/重新推荐、登录门槛、loading、推荐原因、空推荐提示；列表详情跳转、真实封面/WtEventArt、displayStatusText 优先级、开始时间/地点/人数上限，12 条分页与 useListState、route.query.q 恢复逻辑。loadError 重试不能与真正空列表混用。

**可编辑的现有结构类：** `.load-error` L2；`.text-btn` L2；`.activity-page` L3；`.collection-head` L5；`.activity` L5；`.collection-label` L7；`.btn` L10；`.primary` L10；`.collection-graphic` L15；`.toolbar` L21；`.chips` L25；`.chip` L26；`.spacer` L29；`.rec-block` L34；`.rec-head` L35；`.rec-grid` L45；`.rec-card` L46；`.rec-card__top` L47；`.rec-cat` L49；`.rec-reason` L51；`.rec-meta` L52；`.grid` L62；`.item` L66；`.event-card` L66；`.event-cover-img` L69；`.item-body` L71；`.event-title-row` L72；`.event-date` L73；`.card-category` L78；`.item-meta` L82；`.meta-divider` L85；`.item-bottom` L88；`.avatar-stack` L90；`.card-arrow` L93；`.page-bar` L107。

**原样保留的模板契约：**

```vue
L2 <div> v-if="loadError" role="alert"
L2 <button> type="button" @click="load"
L10 <button> type="button" @click="goPublish"
L22 <el-input> v-model="keyword" clearable @keyup.enter="search" @clear="search"
L23 <template> #append
L23 <el-button> @click="search"
L26 <span> :class="{ active: !category }" @click="selectCategory('')"
L27 <span> v-for="c in categories" :key="c" :class="{ active: category === c }" @click="selectCategory(c)"
L30 <el-button> @click="$router.push('/activity/my-signup')"
L41 <el-button> type="primary" :loading="recLoading" @click="loadRecommend"
L45 <div> v-if="recList.length"
L46 <div> v-for="r in recList" :key="r.id" @click="$router.push(`/activity/detail/${r.id}`)"
L62 <div> v-loading="loading"
L63 <a> v-for="a in list" :key="a.id" @click="$router.push(`/activity/detail/${a.id}`)"
L69 <img> v-if="firstContentImage(a, 'activity')" :src="firstContentImage(a, 'activity')" :alt="a.title"
L70 <WtEventArt> v-else :item="a"
L100 <EmptyBox> v-if="!loadError && !loading && !list.length"
L101 <el-pagination> v-model:current-page="pageNum" :total="total" :page-size="12" layout="prev, pager, next" @current-change="load"
```

**展示数据与动态文案（不得丢失）：**

```text
L2 loadError
L7 total
L27 c
L42 recList.length ? '重新推荐' : '给我推荐'
L48 r.title
L49 r.category
L51 r.reason
L53 formatTime(r.startTime)
L54 r.location || '地点待定'
L55 r.memberCount
L74 dayOf(a.startTime)
L75 monthOf(a.startTime)
L78 a.category || '校园活动'
L78 statusText(a)
L79 a.title
L84 a.location || '地点待定'
L86 formatTime(a.startTime).slice(5)
L91 a.memberCount
L91 a.maxMembers ? '/' + a.maxMembers : ''
```

**冻结的脚本处理器/生命周期锚点：**

```js
L139 async function loadRecommend() {
L158 function statusText(a) {
L162 function formatTime(t) {
L166 function dayOf(t) {
L170 function monthOf(t) {
L175 function selectCategory(c) {
L180 function search() {
L185 async function load() {
L199 function goPublish() {
L209 watch(
```

### 03. 我的报名与发布管理

源文件：`web/frontend/student/src/views/activity/MySignup.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/activity/MySignup.vue:1) · 脚本 [L109](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/activity/MySignup.vue:109) · 样式 [L201](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/activity/MySignup.vue:201)。

**具体视觉重排：** `.my-signup` 改全宽卡片，顶部两个横向标签，表格维持信息密度；状态标签以颜色和文字共同表达。成员弹窗宽度在小屏约束为视口内，可横滚而不删列。

**功能、状态和边界：** 保留 signup/published 双 tab；报名活动链接、说明、时间、审批状态；发布记录的审核/结束/下架状态、驳回原因、报名数、发布时间和编辑/报名管理。编辑对 status 2/3 禁用，报名管理对 auditStatus非1或status2/3禁用。两张表各自10条分页，成员名单独立10条分页、通过/拒绝只对status0、已处理/空态与 memberLoading。不能根据详情提示文案凭空在此页添加源码没有的扫码签到按钮。

**可编辑的现有结构类：** `.my-signup` L4；`.member-pager` L93。

**原样保留的模板契约：**

```vue
L6 <template> #header
L7 <el-tabs> v-model="tab"
L9 <el-tab-pane> label="我的报名" name="signup"
L10 <el-table> :data="signups" v-loading="loading"
L11 <el-table-column> prop="activityTitle" label="活动"
L12 <template> #default="{ row }"
L13 <router-link> :to="`/activity/detail/${row.activityId}`"
L16 <el-table-column> prop="remark" label="报名说明"
L17 <el-table-column> label="报名时间"
L18 <template> #default="{ row }"
L20 <el-table-column> label="状态"
L21 <template> #default="{ row }"
L22 <el-tag> :type="['warning','success','danger'][row.status]"
L28 <el-pagination> v-model:current-page="signupPage" :total="signupTotal" :page-size="10" layout="prev, pager, next" @current-change="loadSignups"
L32 <el-tab-pane> label="我的发布" name="published"
L33 <el-table> :data="published" v-loading="loading"
L34 <el-table-column> prop="title" label="活动"
L35 <template> #default="{ row }"
L36 <router-link> :to="`/activity/detail/${row.id}`"
L39 <el-table-column> label="状态"
L40 <template> #default="{ row }"
L41 <el-tag> :type="row.auditStatus === 2 ? 'danger' : row.status === 2 ? 'info' : row.status === 3 ? 'danger' : ['warning','success'][row.auditStatus]"
L46 <el-table-column> prop="auditReason" label="驳回理由"
L47 <el-table-column> label="报名数"
L48 <template> #default="{ row }"
L50 <el-table-column> label="发布时间"
L51 <template> #default="{ row }"
L53 <el-table-column> label="操作"
L54 <template> #default="{ row }"
L55 <el-button> :disabled="row.status === 2 || row.status === 3" @click="editActivity(row)"
L56 <el-button> type="primary" :disabled="row.auditStatus !== 1 || row.status === 2 || row.status === 3" @click="openMembers(row)"
L61 <el-pagination> v-model:current-page="pubPage" :total="pubTotal" :page-size="10" layout="prev, pager, next" @current-change="loadPublished"
L68 <el-dialog> v-model="memberDialog" destroy-on-close
L69 <template> v-if="memberActivity"
L71 <el-table> :data="members" v-loading="memberLoading"
L72 <el-table-column> prop="nickname" label="报名人"
L73 <el-table-column> prop="remark" label="报名说明"
L74 <el-table-column> label="报名时间"
L75 <template> #default="{ row }"
L77 <el-table-column> label="状态"
L78 <template> #default="{ row }"
L79 <el-tag> :type="['warning','success','danger'][row.status]"
L82 <el-table-column> label="操作"
L83 <template> #default="{ row }"
L84 <template> v-if="row.status === 0"
L85 <el-button> type="success" @click="handleMember(row, true)"
L86 <el-button> type="danger" @click="handleMember(row, false)"
L88 <span> v-else
L92 <el-empty> v-if="!memberLoading && !members.length"
L93 <div> v-if="memberTotal > memberPageSize"
L94 <el-pagination> layout="prev, pager, next" :total="memberTotal" :page-size="memberPageSize" :current-page="memberPage" @current-change="onMemberPageChange"
```

**展示数据与动态文案（不得丢失）：**

```text
L13 row.activityTitle
L18 formatTime(row.createTime)
L23 ['待审批','已通过','已拒绝'][row.status]
L36 row.title
L42 row.auditStatus === 0 ? '待审核' : row.auditStatus === 2 ? '已驳回' : row.status === 2 ? '已结束' : row.status === 3 ? '已下架' : '已通过'
L48 row.memberCount
L70 memberActivity.title
```

**冻结的脚本处理器/生命周期锚点：**

```js
L135 async function loadSignups() {
L146 async function loadPublished() {
L157 function editActivity(row) {
L161 async function loadMembers(page) {
L174 function onMemberPageChange(page) {
L178 async function openMembers(row) {
L183 async function handleMember(row, approve) {
L195 onMounted(() => {
```

### 04. 发布或编辑活动

源文件：`web/frontend/student/src/views/activity/Publish.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/activity/Publish.vue:1) · 脚本 [L49](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/activity/Publish.vue:49) · 样式 [L112](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/activity/Publish.vue:112)。

**具体视觉重排：** `.publish` 内先放淡黄审核说明与 AI 辅助块，再分组展示基础信息、时间地点、名额、图片；最终提交与取消在表单底部横排。宽屏可让字段成两列，整页不设置工具侧栏。

**功能、状态和边界：** 同一页面由 query.id 区分新建/编辑；保留 title、category、description、location、startTime、endTime、signupDeadline、maxMembers、images 全部字段，日期字符串格式、0不限/上限500、最多3图。AiAssistPanel(activity) 的 fill=applyAssist 只填标题与描述。编辑回填日期 T 替换、加载失败返回、仅标题现有必填判断、新建 publishActivity/编辑 updateActivity 及重新审核、成功到我的报名均不动；不得增加付款、票种等原型假功能。

**可编辑的现有结构类：** `.publish` L4；`.tip` L35。

**原样保留的模板契约：**

```vue
L2 <WtPageHeader> :title="editId ? '编辑活动' : '发布活动'" :subtitle="editId ? '修改活动信息，保存后重新进入审核' : '发起一场属于同学们的聚会'"
L6 <template> #header
L7 <el-alert> type="info" :closable="false"
L8 <AiAssistPanel> :type="'activity'" @fill="applyAssist"
L9 <el-form> :model="form"
L10 <el-form-item> label="活动标题"
L11 <el-input> v-model="form.title" maxlength="64" show-word-limit
L13 <el-form-item> label="分类"
L14 <el-select> v-model="form.category"
L15 <el-option> v-for="c in categories" :key="c" :label="c" :value="c"
L18 <el-form-item> label="活动描述"
L19 <el-input> v-model="form.description" type="textarea" :rows="4"
L21 <el-form-item> label="地点"
L22 <el-input> v-model="form.location"
L24 <el-form-item> label="开始时间"
L25 <el-date-picker> v-model="form.startTime" type="datetime"
L27 <el-form-item> label="结束时间"
L28 <el-date-picker> v-model="form.endTime" type="datetime"
L30 <el-form-item> label="报名截止"
L31 <el-date-picker> v-model="form.signupDeadline" type="datetime"
L33 <el-form-item> label="人数上限"
L34 <el-input-number> v-model="form.maxMembers" :min="0" :max="500"
L37 <el-form-item> label="图片"
L38 <UploadImg> v-model="form.images" :max="3"
L41 <el-button> type="primary" :loading="submitting" @click="submit"
L42 <el-button> @click="$router.back()"
```

**冻结的脚本处理器/生命周期锚点：**

```js
L68 onMounted(async () => {
L87 function applyAssist(data) {
L91 async function submit() {
```

### 05. AI自由对话、校园向导与PDF

源文件：`web/frontend/student/src/views/ai/ChatView.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/ChatView.vue:1) · 脚本 [L103](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/ChatView.vue:103) · 样式 [L413](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/ChatView.vue:413), [L436](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/ChatView.vue:436)。

**具体视觉重排：** `.ai-layout` 改单列；`.ai-side` 改聊天区上方全宽会话工具区，新建按钮与会话列表横向流动/换行，长列表在该区域内滚动；每个会话保留更多菜单，不能变成新的左侧抽屉导航。`.ai-top` 依次为标题与chat/guide/pdf横向标签，pdf-bar置下，ai-chat可滚，ai-input置底部Dock之上。

**功能、状态和边界：** 保留newSession、switchSession、onSessionCmd(rename/delete)及确认提示、空会话状态、WtTabs tab、快捷问题askQuick、question、Enter exact prevent/send与禁用、ChatBubble全套role/content/streaming/nickname/avatar。chat走SSE增量；guide走校园真实数据aiGuideAsk且不加载历史；pdf需要先上传，doPdfUpload接受.pdf、进度/文件名/页数、绑定新会话并保留旧历史、恢复docId。请求序号/AbortController取消、跨会话迟到响应隔离、卸载清理、首问刷新会话、route.query.q自动发送、401登录/503维护/普通错误、滚底全部冻结。当前input是单行且文案含Shift+Enter提示，UI任务不得顺手改发送规则或宣称已增加多行。

**可编辑的现有结构类：** `.ai-page` L2；`.ai-layout` L3；`.ai-side` L5；`.new-btn` L6；`.session-list` L7；`.ai-session` L11；`.ai-session__ico` L15；`.s-title` L18；`.s-more` L20；`.ai-main` L34；`.ai-top` L35；`.ai-orb` L36；`.ai-top__meta` L41；`.section-sub` L43；`.ai-top__tools` L45；`.pdf-bar` L51；`.pdf-info` L55；`.pdf-tip` L56；`.quick-prompts` L60；`.quick-prompt` L61；`.ai-chat` L65；`.ai-input` L79；`.send` L86；`.ai-footnote` L92。

**原样保留的模板契约：**

```vue
L6 <WtButton> type="soft" @click="newSession"
L8 <div> v-for="s in sessions" :key="s.id" :class="{ active: s.id === currentSession?.id }" @click="switchSession(s)"
L19 <el-dropdown> @command="(cmd) => onSessionCmd(cmd, s)" @click.stop
L21 <template> #dropdown
L23 <el-dropdown-item> command="rename"
L24 <el-dropdown-item> command="delete"
L29 <WtEmptyState> v-if="!sessions.length" type="empty"
L46 <WtTabs> v-model="tab" :options="sceneTabs"
L51 <div> v-if="tab === 'pdf'"
L52 <el-upload> :show-file-list="false" :http-request="doPdfUpload" accept=".pdf"
L53 <el-button> :loading="pdfUploading"
L55 <span> v-if="pdfDoc"
L56 <span> v-else
L60 <div> v-if="!messages.length && tab !== 'pdf'"
L61 <span> v-for="q in quickPrompts" :key="q" @click="askQuick(q)"
L65 <div> ref="msgBox"
L66 <ChatBubble> v-for="(m, i) in messages" :key="i" :role="m.role" :content="m.content" :streaming="m.streaming" :nickname="userStore.userInfo?.nickname || '我'" :user-avatar="userStore.userInfo?.avatar"
L75 <WtEmptyState> v-if="!messages.length" type="empty"
L80 <input> v-model="question" type="text" :placeholder="tab === 'pdf' ? '针对PDF文档内容提问…' : (tab === 'guide' ? '问问校园：周末有什么活动 / 我报名的活动 / 有失物招领吗' : '输入你的问题，回车发送，Shift+Enter 换行')" @keydown.enter.exact.prevent="send"
L86 <button> :disabled="!question.trim() || asking" aria-label="发送" @click="send"
```

**展示数据与动态文案（不得丢失）：**

```text
L18 s.title
L42 tab === 'pdf' ? 'PDF 问答' : (tab === 'guide' ? '🏫 AI 校园向导' : 'AI 自由对话')
L43 tab === 'guide' ? '实时校园数据驱动 · 活动 / 闲置 / 失物 / 公告' : 'DeepSeek 驱动 · 上下文已记忆'
L55 pdfDoc.fileName
L55 pdfDoc.pageCount
L61 q
```

**冻结的脚本处理器/生命周期锚点：**

```js
L129 function cancelStream() {
L149 onUnmounted(() => cancelStream())
L151 onMounted(async () => {
L160 watch(tab, () => {
L170 async function loadSessions() {
L183 async function restorePdfDoc(session) {
L195 async function newSession() {
L201 async function switchSession(s) {
L215 async function onSessionCmd(cmd, s) {
L254 function askQuick(q) {
L259 async function send() {
L371 async function doPdfUpload({ file }) {
L395 async function refreshSessionList() {
L406 function scrollBottom() {
```

### 06. AI代码诊所

源文件：`web/frontend/student/src/views/ai/CodeFix.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/CodeFix.vue:1) · 脚本 [L42](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/CodeFix.vue:42) · 样式 [L103](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/CodeFix.vue:103)。

**具体视觉重排：** `.codefix` 调整为顶部语言/说明/开始按钮的横向工具带，代码编辑卡与结果卡可上下堆叠；若宽屏双编辑区等宽展示，也不得形成导航/工具侧栏。背景浅青，编辑面本身保持代码可读性和足够高度。

**功能、状态和边界：** 保留java/python/c/cpp/javascript/go/sql、language/monacoLang、extra、code双编辑器同一v-model；Monaco异步加载成功且基础编辑器未在用才切换，失败/超时/离页取消后textarea可用、focus标记plainEditorInUse、editorFailed提示。fix非空提交、fixing/空态/Markdown结果、空答案警告与错误反馈；不得删除基础编辑器或强行更换Monaco主题/加载协议。

**可编辑的现有结构类：** `.codefix` L4；`.panel` L5；`.left` L5；`.panel-head` L6；`.ops` L8；`.editor-box` L21；`.plain-code-editor` L29；`.editor-note` L31；`.right` L33；`.loading-box` L35；`.result` L36；`.md-body` L36。

**原样保留的模板契约：**

```vue
L9 <el-select> v-model="language"
L10 <el-option> v-for="l in languages" :key="l" :label="l" :value="l"
L12 <el-button> type="primary" :loading="fixing" @click="fix"
L15 <el-input> v-model="extra"
L22 <vue-monaco-editor> v-if="editorReady" v-model:value="code" :language="monacoLang" :options="{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true }"
L29 <textarea> v-else v-model="code" aria-label="代码编辑区" spellcheck="false" @focus="plainEditorInUse = true"
L31 <p> v-if="!editorReady"
L35 <div> v-if="fixing" v-loading="true"
L36 <div> v-else-if="result" v-html="renderMarkdown(result)"
L37 <el-empty> v-else :image-size="100"
```

**展示数据与动态文案（不得丢失）：**

```text
L31 editorFailed ? '已使用基础编辑器，代码输入和纠错功能可正常使用。' : '可直接输入代码，无需等待编辑器加载。'
```

**冻结的脚本处理器/生命周期锚点：**

```js
L61 onMounted(() => {
L77 onBeforeUnmount(() => { disposed = true; cancelCodeEditorLoad() })
L85 async function fix() {
```

### 07. 复习提纲与薄弱点报告

源文件：`web/frontend/student/src/views/ai/components/WrongOutlineDialog.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/components/WrongOutlineDialog.vue:1) · 脚本 [L64](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/components/WrongOutlineDialog.vue:64) · 样式 [L135](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/components/WrongOutlineDialog.vue:135)。

**具体视觉重排：** 三种生成方式作为全宽弹窗内的三张选项卡；loading/error/result四态排版统一，Markdown结果可滚动，重新选择放结果头部。

**功能、状态和边界：** 保留modelValue/currentSubject/selectedIds/autoMode及update:modelValue；按学科在无学科时禁用、按选中在无选中时禁用、全部错题；run的三种payload、autoMode打开自动执行、lastPayload重试、reset、cancel只是关闭，不能宣称取消了后台请求。AI错误icon/title/desc/action、20–40秒提示、Markdown渲染均保留。

**可编辑的现有结构类：** `.modes` L4；`.mode-btn` L6；`.m-icon` L10；`.m-title` L11；`.m-desc` L12；`.loading-box` L37；`.err-box` L43；`.err-icon` L44；`.err-desc` L46；`.err-ops` L47；`.result-head` L55；`.md-body` L59。

**原样保留的模板契约：**

```vue
L2 <el-dialog> v-model="visible" append-to-body
L4 <div> v-if="!loading && !error && !result"
L5 <button> :disabled="!currentSubject" @click="run({ mode: 'subject', subject: currentSubject })"
L17 <button> :disabled="!selectedIds.length" @click="run({ mode: 'selected', wrongQuestionIds: selectedIds })"
L29 <button> @click="run({ mode: 'all' })"
L37 <div> v-else-if="loading" v-loading="true"
L39 <el-button> @click="cancel"
L43 <div> v-else-if="error"
L48 <el-button> @click="visible = false"
L49 <el-button> type="primary" @click="retry"
L54 <template> v-else
L56 <el-tag> type="success"
L57 <el-button> type="primary" @click="reset"
L59 <div> v-html="renderMarkdown(result)"
```

**展示数据与动态文案（不得丢失）：**

```text
L13 currentSubject ? `按当前筛选的「${currentSubject}」错题生成` : '请先在上方筛选一个学科'
L25 selectedIds.length ? `已选中 ${selectedIds.length} 道错题` : '请先在列表中勾选错题'
L44 error.icon
L45 error.title
L46 error.desc
L49 error.action
```

**冻结的脚本处理器/生命周期锚点：**

```js
L89 watch(() => props.modelValue, (v) => {
L102 async function run(payload) {
L118 function retry() {
L124 function cancel() {
L128 function reset() {
```

**组件公开接口原文：**

```js
L70 const props = defineProps({
L71   modelValue: { type: Boolean, default: false },
L72   currentSubject: { type: String, default: '' },
L73   selectedIds: { type: Array, default: () => [] },
L74   /** 打开时自动执行的模式（all=薄弱点报告），用于快捷入口 */
L75   autoMode: { type: String, default: '' }
L76 })
L77 const emit = defineEmits(['update:modelValue'])
```

### 08. 今日复习计划

源文件：`web/frontend/student/src/views/ai/components/WrongPlanDialog.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/components/WrongPlanDialog.vue:1) · 脚本 [L33](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/components/WrongPlanDialog.vue:33) · 样式 [L80](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/components/WrongPlanDialog.vue:80)。

**具体视觉重排：** 居中弹窗内使用浅黄学科说明、加载占位、错误反馈和白色Markdown阅读区；保留重新生成与关闭，不能把计划放入侧边常驻面板。

**功能、状态和边界：** 保留modelValue/currentSubject/update:modelValue、subjectLabel全部/当前学科、打开watch清空旧结果并run、reviewPlan(currentSubject)、loading互斥、aiErrorInfo、开始/失败重试/重新生成、取消仅visible=false、20–40秒等待提示。

**可编辑的现有结构类：** `.empty` L3；`.loading-box` L8；`.err-box` L13；`.err-icon` L14；`.err-desc` L16；`.err-ops` L17；`.result-head` L24；`.md-body` L28。

**原样保留的模板契约：**

```vue
L2 <el-dialog> v-model="visible" append-to-body
L3 <div> v-if="!loading && !error && !result"
L5 <el-button> type="primary" @click="run"
L8 <div> v-else-if="loading" v-loading="true"
L10 <el-button> @click="visible = false"
L13 <div> v-else-if="error"
L18 <el-button> @click="visible = false"
L19 <el-button> type="primary" @click="run"
L23 <template> v-else
L25 <el-tag> type="success"
L26 <el-button> type="primary" @click="run"
L28 <div> v-html="renderMarkdown(result)"
```

**展示数据与动态文案（不得丢失）：**

```text
L14 error.icon
L15 error.title
L16 error.desc
L19 error.action
L25 subjectLabel
```

**冻结的脚本处理器/生命周期锚点：**

```js
L56 watch(() => props.modelValue, (v) => {
L64 async function run() {
```

**组件公开接口原文：**

```js
L39 const props = defineProps({
L40   modelValue: { type: Boolean, default: false },
L41   currentSubject: { type: String, default: '' }
L42 })
L43 const emit = defineEmits(['update:modelValue'])
```

### 09. 快速收录、拍照OCR与补充字段

源文件：`web/frontend/student/src/views/ai/components/WrongQuickAdd.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/components/WrongQuickAdd.vue:1) · 脚本 [L91](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/components/WrongQuickAdd.vue:91) · 样式 [L248](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/components/WrongQuickAdd.vue:248)。

**具体视觉重排：** 对话框以题目大输入、图片识别区、学科、可展开补充信息、底部保存双按钮纵向组织；淡黄说明强调人工也可保存。窗口宽度限制视口，长内容在正文滚动。

**功能、状态和边界：** 保留modelValue/subjects及update:modelValue/saved；拍照文件input ref/capture=environment/accept=image、onFileChange、fileInput.click、5MB与image类型限制、上传后OCR、已有题目替换/保留确认、识别running/failed与手工降级、questionImage预览/清除。学科允许新建、去重及待整理；advanced内myAnswer/correctAnswer/analysis/questionType/chapter/difficulty/errorReason/tag/knowledgePoints/note全留。题目必填；保存关闭与保存继续reset分开；先createWrong再后台analyzeWrong，AI失败不回滚收录，saved刷新父页。

**可编辑的现有结构类：** `.tip` L9；`.img-row` L18；`.hint` L29；`.warn` L30；`.q-img` L32；`.advanced` L48。

**原样保留的模板契约：**

```vue
L2 <el-dialog> v-model="visible" :close-on-click-modal="false" append-to-body
L10 <el-form> :model="form"
L11 <el-form-item> label="题目"
L12 <el-input> v-model="form.question" type="textarea" :rows="3"
L19 <input> ref="fileInput" type="file" accept="image/*" capture="environment" @change="onFileChange"
L27 <el-button> :loading="uploading" @click="fileInput?.click()"
L28 <el-button> v-if="form.questionImage" type="danger" @click="clearImage"
L29 <span> v-if="ocrState === 'running'"
L30 <span> v-else-if="ocrState === 'failed'"
L32 <img> v-if="form.questionImage" :src="form.questionImage"
L34 <el-form-item> label="学科"
L35 <el-select> v-model="form.subject" filterable allow-create default-first-option clearable
L44 <el-option> v-for="s in subjectOptions" :key="s" :label="s" :value="s"
L50 <el-form-item> label="我的答案"
L50 <el-input> v-model="form.myAnswer" type="textarea" :rows="2"
L51 <el-form-item> label="正确答案"
L51 <el-input> v-model="form.correctAnswer" type="textarea" :rows="2"
L52 <el-form-item> label="解析"
L52 <el-input> v-model="form.analysis" type="textarea" :rows="3"
L53 <el-row> :gutter="8"
L54 <el-col> :span="8"
L55 <el-form-item> label="题型"
L56 <el-select> v-model="form.questionType" clearable
L57 <el-option> v-for="t in QUESTION_TYPES" :key="t" :label="t" :value="t"
L61 <el-col> :span="8"
L62 <el-form-item> label="章节"
L62 <el-input> v-model="form.chapter"
L64 <el-col> :span="8"
L65 <el-form-item> label="难度"
L66 <el-select> v-model="form.difficulty" clearable
L67 <el-option> v-for="d in DIFFICULTIES" :key="d" :label="d" :value="d"
L72 <el-form-item> label="错误原因"
L73 <el-select> v-model="form.errorReason" clearable filterable
L74 <el-option> v-for="r in ERROR_REASONS" :key="r" :label="r" :value="r"
L77 <el-form-item> label="标签"
L77 <el-input> v-model="form.tag"
L78 <el-form-item> label="知识点"
L78 <el-input> v-model="form.knowledgePoints"
L79 <el-form-item> label="笔记"
L79 <el-input> v-model="form.note" type="textarea" :rows="2"
L83 <template> #footer
L84 <el-button> @click="visible = false"
L85 <el-button> :loading="saving" @click="saveAndClose"
L86 <el-button> type="primary" :loading="saving" @click="saveAndContinue"
```

**冻结的脚本处理器/生命周期锚点：**

```js
L120 watch(() => props.modelValue, (v) => {
L129 function reset() {
L138 function validate() {
L147 async function onFileChange(e) {
L192 function clearImage() {
L198 async function doSave() {
L225 async function triggerAnalyze(id) {
L233 async function saveAndClose() {
L240 async function saveAndContinue() {
```

**组件公开接口原文：**

```js
L99 const props = defineProps({
L100   modelValue: { type: Boolean, default: false },
L101   subjects: { type: Array, default: () => [] }
L102 })
L103 const emit = defineEmits(['update:modelValue', 'saved'])
```

### 10. AI同类题练习

源文件：`web/frontend/student/src/views/ai/components/WrongQuizDrawer.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/components/WrongQuizDrawer.vue:1) · 脚本 [L120](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/components/WrongQuizDrawer.vue:120) · 样式 [L224](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/components/WrongQuizDrawer.vue:224)。

**具体视觉重排：** 抽屉改为居中覆盖/底部sheet，练习题用白色阅读卡，选中选项深绿描边，正确/错误保留语义提示，解析淡黄底。生成等待、错误重试与练习状态使用同一容器。

**功能、状态和边界：** 保留modelValue/question及update:modelValue/saved；原题参考及缺答案解析提示；打开自动generate、loading/regenerating、取消、aiErrorInfo重试；有options为radio、无options为自由作答，myAnswer、submitted禁用、提交非空。optionKey/normalizeAnswer不改；无标准答案judged=null及解析自核提示不能判成错；解析展开收起、再生成、显式saveToWrongBook及saving/幂等错误处理、保存后saved关闭保持。生成练习不会自动入错题本。

**可编辑的现有结构类：** `.ref` L5；`.warn` L8；`.state` L14；`.state-box` L15；`.err-box` L23；`.err-icon` L24；`.err-desc` L26；`.err-ops` L27；`.practice` L35；`.q-head` L36；`.q-type` L38；`.q-text` L41；`.options` L44；`.option` L48；`.judge-alert` L77；`.correct-ans` L82；`.analysis` L94；`.analysis-title` L95；`.md-body` L96；`.ops` L100；`.hint` L115。

**原样保留的模板契约：**

```vue
L2 <el-drawer> v-model="visible" append-to-body
L3 <template> v-if="question"
L8 <p> v-if="!question.correctAnswer && !question.analysis"
L14 <div> v-if="loading" v-loading="true"
L17 <el-button> @click="visible = false"
L22 <div> v-else-if="error"
L28 <el-button> @click="visible = false"
L29 <el-button> type="primary" :loading="regenerating" @click="generate"
L35 <div> v-else-if="practice"
L37 <el-tag> type="primary"
L38 <span> v-if="practice.options.length"
L39 <span> v-else
L44 <div> v-if="practice.options.length"
L45 <label> v-for="opt in practice.options" :key="opt" :class="{ picked: myAnswer === optionKey(opt), disabled: submitted }"
L51 <input> type="radio" name="practice-option" :value="optionKey(opt)" :disabled="submitted" v-model="myAnswer"
L62 <el-input> v-else v-model="myAnswer" type="textarea" :rows="3" :disabled="submitted"
L72 <el-alert> v-if="submitted && judged !== null" :type="judged ? 'success' : 'error'" :closable="false"
L79 <template> #title
L82 <p> v-if="!judged"
L84 <el-alert> v-else-if="submitted && judged === null" type="info" :closable="false"
L94 <div> v-if="showAnalysis && practice.analysis"
L96 <div> v-html="renderMarkdown(practice.analysis)"
L101 <template> v-if="!submitted"
L102 <el-button> type="success" :disabled="!myAnswer.trim()" @click="submit"
L103 <el-button> @click="visible = false"
L105 <template> v-else
L106 <el-button> @click="showAnalysis = !showAnalysis"
L109 <el-button> type="primary" :loading="regenerating" @click="generate"
L110 <el-button> type="warning" :loading="saving" @click="saveToWrongBook"
```

**展示数据与动态文案（不得丢失）：**

```text
L6 question.question
L24 error.icon
L25 error.title
L26 error.desc
L29 error.action
L41 practice.question
L58 opt
L80 judged ? '✅ 答对了，很棒！' : '❌ 答错了，看看解析再巩固一下'
L82 practice.answer
L107 showAnalysis ? '收起解析' : '查看解析'
```

**冻结的脚本处理器/生命周期锚点：**

```js
L148 watch(() => props.modelValue, (v) => {
L155 async function generate() {
L180 function optionKey(opt) {
L186 function normalizeAnswer(s) {
L192 function submit() {
L209 async function saveToWrongBook() {
```

**组件公开接口原文：**

```js
L127 const props = defineProps({
L128   modelValue: { type: Boolean, default: false },
L129   question: { type: Object, default: null }
L130 })
L131 const emit = defineEmits(['update:modelValue', 'saved'])
```

### 11. 错题详情与复习反馈

源文件：`web/frontend/student/src/views/ai/components/WrongReviewDrawer.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/components/WrongReviewDrawer.vue:1) · 脚本 [L110](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/components/WrongReviewDrawer.vue:110) · 样式 [L225](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/components/WrongReviewDrawer.vue:225)。

**具体视觉重排：** 将右侧抽屉的呈现改为居中覆盖面板或底部sheet（优先仅调整定位CSS，保留el-drawer实例与行为），内容按题目/错误答案/AI辅助/掌握程度/提交结果纵向排；不得当作固定侧栏。底部关闭/提交/完成一直可达。

**功能、状态和边界：** 保留modelValue/questionId及update:modelValue/done/quiz；题图和学科题型章节难度错因、未填答案解析空态；analyzeStatus1失败重试/0未整理、retryAnalyze、explain Markdown与aiErrorInfo失败重试、emit quiz。userAnswer、MASTERY_LEVELS点击level、必选校验、masteryLevel及isCorrect(level>=2)提交、nextReviewTime反馈、成功done父页刷新、结果后完成关闭；destroy-on-close=false及打开时reset/load均不变。

**可编辑的现有结构类：** `.sec` L12；`.sec-title` L13；`.q-text` L14；`.q-img` L15；`.q-tags` L16；`.kv` L29；`.ai-line` L39；`.ai-status` L40；`.failed` L40；`.explain-body` L53；`.explain-err` L54；`.hint` L63；`.levels` L71；`.level-btn` L75；`.lv-icon` L79；`.lv-label` L80；`.lv-desc` L81；`.result-alert` L92；`.drawer-footer` L100。

**原样保留的模板契约：**

```vue
L2 <el-drawer> v-model="visible" :title="title" append-to-body :destroy-on-close="false"
L9 <div> v-loading="loading"
L10 <template> v-if="wq"
L15 <img> v-if="wq.questionImage" :src="wq.questionImage"
L17 <el-tag> v-if="wq.subject"
L18 <el-tag> v-if="wq.questionType" type="info"
L19 <el-tag> v-if="wq.chapter" type="info"
L20 <el-tag> v-if="wq.difficulty" type="warning"
L21 <el-tag> v-if="wq.errorReason" type="danger"
L28 <template> v-if="wq.myAnswer || wq.correctAnswer || wq.analysis"
L33 <el-empty> v-else :image-size="60"
L39 <div> v-if="wq.analyzeStatus === 1"
L41 <el-button> type="primary" :loading="analyzing" @click="retryAnalyze"
L43 <div> v-else-if="wq.analyzeStatus === 0"
L45 <el-button> type="primary" :loading="analyzing" @click="retryAnalyze"
L48 <el-button> type="primary" :loading="explaining" @click="explain"
L51 <el-button> @click="emit('quiz', wq)"
L53 <div> v-if="explainResult" v-html="renderMarkdown(explainResult)"
L54 <div> v-else-if="explainError"
L56 <el-button> type="primary" @click="explain"
L64 <el-input> v-model="userAnswer" type="textarea" :rows="2"
L72 <button> v-for="lv in MASTERY_LEVELS" :key="lv.value" :class="{ active: level === lv.value }" @click="level = lv.value"
L87 <el-alert> v-if="result" :type="result.isCorrect ? 'success' : 'warning'" :closable="false"
L94 <template> #title
L101 <el-button> @click="visible = false"
L102 <el-button> v-if="!result" type="success" :loading="submitting" @click="submit"
L103 <el-button> v-else type="success" @click="finish"
```

**展示数据与动态文案（不得丢失）：**

```text
L14 wq.question
L17 wq.subject
L18 wq.questionType
L19 wq.chapter
L20 wq.difficulty
L21 wq.errorReason
L29 wq.myAnswer || '（未填写）'
L30 wq.correctAnswer || '（未填写）'
L31 wq.analysis || '（未填写）'
L55 explainError.title
L55 explainError.desc
L56 explainError.action
L79 lv.icon
L80 lv.label
L81 lv.desc
L95 result.isCorrect ? '复习完成，状态已更新' : '已记录，这道题还需要再巩固'
L96 result.nextText
```

**冻结的脚本处理器/生命周期锚点：**

```js
L143 watch(() => props.modelValue, (v) => {
L149 async function load() {
L164 async function explain() {
L180 async function retryAnalyze() {
L196 async function submit() {
L220 function finish() {
```

**组件公开接口原文：**

```js
L117 const props = defineProps({
L118   modelValue: { type: Boolean, default: false },
L119   questionId: { type: Number, default: null }
L120 })
L121 const emit = defineEmits(['update:modelValue', 'done', 'quiz'])
```

### 12. 错题总览、筛选与管理

源文件：`web/frontend/student/src/views/ai/WrongBook.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/WrongBook.vue:1) · 脚本 [L196](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/WrongBook.vue:196) · 样式 [L398](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/WrongBook.vue:398), [L495](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/ai/WrongBook.vue:495)。

**具体视觉重排：** `.wrong-banner` 改淡青大卡并保留四统计和三勋章；`.actions` 全宽横排，`.weak-panel` 为淡黄横向摘要；status/学科/sort在列表上方，批量条只在选中时显现；`.cards` 使用可读错题卡网格。所有子抽屉只承担当前题操作，不可改成常驻侧栏。

**功能、状态和边界：** 保留快速收录、今日待复习数量及禁用、AI计划、薄弱报告；总数/待复习/掌握/周复习统计和知识点/错因排行；全部+WQ_STATUS、学科、四种排序、10条分页、多选/取消/按选中生成提纲。每题题目、学科/标签/状态/来源/题型/章节/难度/错因/错次/连续答对/整理失败/到期；复习、AI同类题、编辑、删除及删除连同复习记录确认。今日列表与逐题开始、编辑全部12个业务字段、保存校验、五个子组件v-model/props/events完整；reload刷新列表/学科/统计/弱点，统计失败不阻断主流程，不改变复习算法。

**可编辑的现有结构类：** `.wrongbook` L2；`.wrong-banner` L4；`.banner-left` L5；`.banner-stats` L8；`.medal-row` L15；`.medal` L16；`.actions` L23；`.weak-panel` L33；`.weak-title` L34；`.weak-row` L35；`.weak-label` L36；`.weak-tag` L42；`.reason-item` L49；`.filters` L56；`.subject-filter` L61；`.batch-bar` L80；`.cards` L87；`.wq-card` L88；`.wq-head` L89；`.wq-source` L99；`.wq-q` L102；`.wq-meta` L104；`.meta-item` L105；`.err-reason` L108；`.analyze-failed` L111；`.due` L112；`.wq-ops` L115；`.pager` L131；`.today-empty` L136；`.today-hint` L141；`.today-item` L142；`.today-q` L143；`.today-meta` L144。

**原样保留的模板契约：**

```vue
L16 <div> :class="{ on: (stats.total ?? 0) > 0 }"
L17 <div> :class="{ on: (stats.weekReviewCount ?? 0) > 0 }"
L18 <div> :class="{ on: (stats.mastered ?? 0) > 0 }"
L24 <el-button> type="primary" @click="quickAddVisible = true"
L25 <el-button> type="success" :disabled="!stats.todayPending" @click="openTodayReview"
L26 <template> v-if="stats.todayPending"
L28 <el-button> @click="planVisible = true"
L29 <el-button> @click="openWeaknessReport"
L33 <div> v-if="weak.knowledgePoints.length || weak.errorReasons.length"
L37 <el-tag> v-for="kp in weak.knowledgePoints.slice(0, 6)" :key="kp.name" :type="kp.pendingCount > 0 ? 'danger' : 'info'"
L44 <template> v-if="kp.pendingCount"
L49 <span> v-for="r in weak.errorReasons.slice(0, 5)" :key="r.reason"
L57 <el-radio-group> v-model="statusFilter" @change="reload"
L58 <el-radio-button> value="all"
L59 <el-radio-button> v-for="s in WQ_STATUS" :key="s.value" :value="String(s.value)"
L62 <el-check-tag> :checked="!subject" @change="selectSubject('')"
L63 <el-check-tag> v-for="s in subjects" :key="s" :checked="subject === s" @change="selectSubject(s)"
L71 <el-select> v-model="sort" @change="reload"
L72 <el-option> label="最近收录" value="create_desc"
L73 <el-option> label="最久未复习" value="last_review_asc"
L74 <el-option> label="错误次数最多" value="wrong_desc"
L75 <el-option> label="难度最高" value="difficulty_desc"
L80 <div> v-if="selectedIds.length"
L82 <el-button> type="primary" @click="openOutlineFromSelected"
L83 <el-button> @click="selectedIds = []"
L87 <div> v-loading="loading"
L88 <el-card> v-for="wq in list" :key="wq.id"
L90 <el-checkbox> :model-value="selectedIds.includes(wq.id)" @change="toggleSelect(wq.id)"
L95 <el-tag> v-if="wq.tag" type="info"
L96 <el-tag> :type="statusOf(wq.status).type"
L102 <div> :title="wq.question" @click="openReview(wq.id)"
L105 <span> v-if="wq.questionType"
L106 <span> v-if="wq.chapter"
L107 <span> v-if="wq.difficulty" :class="diffCls(wq.difficulty)"
L108 <span> v-if="wq.errorReason"
L110 <span> v-if="wq.consecutiveCorrectCount"
L111 <span> v-if="wq.analyzeStatus === 1"
L112 <span> :class="{ overdue: isDue(wq) }"
L116 <el-button> type="success" @click="openReview(wq.id)"
L117 <el-button> type="primary" @click="openQuiz(wq)"
L118 <el-button> @click="openEdit(wq)"
L119 <el-button> type="danger" @click="remove(wq)"
L122 <EmptyBox> v-if="!loading && !list.length"
L125 <el-pagination> v-model:current-page="pageNum" :total="total" :page-size="pageSize" layout="prev, pager, next" @current-change="load"
L135 <el-dialog> v-model="todayVisible" append-to-body
L136 <div> v-if="!todayList.length"
L138 <el-button> @click="todayVisible = false"
L140 <div> v-else
L142 <div> v-for="t in todayList" :key="t.id"
L148 <el-button> type="success" @click="startReviewFromToday(t.id)"
L154 <el-dialog> v-model="editVisible" :title="editForm.id ? '编辑错题' : '收录错题'" append-to-body
L155 <el-form> :model="editForm"
L156 <el-form-item> label="题目"
L156 <el-input> v-model="editForm.question" type="textarea" :rows="3"
L157 <el-form-item> label="学科"
L157 <el-input> v-model="editForm.subject"
L158 <el-form-item> label="我的答案"
L158 <el-input> v-model="editForm.myAnswer" type="textarea" :rows="2"
L159 <el-form-item> label="正确答案"
L159 <el-input> v-model="editForm.correctAnswer" type="textarea" :rows="2"
L160 <el-form-item> label="解析"
L160 <el-input> v-model="editForm.analysis" type="textarea" :rows="3"
L161 <el-row> :gutter="8"
L162 <el-col> :span="8"
L162 <el-form-item> label="题型"
L162 <el-input> v-model="editForm.questionType"
L163 <el-col> :span="8"
L163 <el-form-item> label="章节"
L163 <el-input> v-model="editForm.chapter"
L164 <el-col> :span="8"
L164 <el-form-item> label="难度"
L164 <el-input> v-model="editForm.difficulty"
L166 <el-form-item> label="错误原因"
L166 <el-input> v-model="editForm.errorReason"
L167 <el-form-item> label="标签"
L167 <el-input> v-model="editForm.tag"
L168 <el-form-item> label="知识点"
L168 <el-input> v-model="editForm.knowledgePoints"
L169 <el-form-item> label="笔记"
L169 <el-input> v-model="editForm.note" type="textarea" :rows="2"
L171 <template> #footer
L172 <el-button> @click="editVisible = false"
L173 <el-button> type="primary" :loading="saving" @click="saveEdit"
L178 <WrongQuickAdd> v-model="quickAddVisible" :subjects="subjects" @saved="reload"
L179 <WrongReviewDrawer> v-model="reviewVisible" :question-id="reviewId" @done="onReviewDone" @quiz="openQuiz"
L185 <WrongQuizDrawer> v-model="quizVisible" :question="quizWq" @saved="reload"
L186 <WrongOutlineDialog> v-model="outlineVisible" :current-subject="subject" :selected-ids="selectedIds" :auto-mode="outlineAutoMode"
L192 <WrongPlanDialog> v-model="planVisible" :current-subject="subject"
```

**展示数据与动态文案（不得丢失）：**

```text
L9 stats.total ?? 0
L10 stats.pending ?? 0
L11 stats.mastered ?? 0
L12 stats.weekReviewCount ?? 0
L26 stats.todayPending
L44 kp.name
L44 kp.wrongCount
L44 kp.pendingCount
L50 r.reason
L50 r.count
L59 s.label
L69 s
L81 selectedIds.length
L94 wq.subject || '待整理'
L95 wq.tag
L97 statusOf(wq.status).label
L99 wq.source === 'ai' ? 'AI收录' : '手动收录'
L102 wq.question
L105 wq.questionType
L106 wq.chapter
L107 wq.difficulty
L108 wq.errorReason
L109 wq.wrongCount ?? 1
L110 wq.consecutiveCorrectCount
L112 formatDue(wq.nextReviewTime)
L141 todayList.length
L143 t.question
L145 t.subject || '待整理'
L146 t.wrongCount ?? 1
```

**冻结的脚本处理器/生命周期锚点：**

```js
L247 onMounted(() => {
L254 function statusOf(s) {
L258 function isDue(wq) {
L264 function diffCls(d) {
L268 async function load() {
L285 async function loadSubjects() {
L289 async function loadStats() {
L293 async function loadWeak() {
L301 function reload() {
L309 function selectSubject(s) {
L314 function toggleSelect(id) {
L321 async function openTodayReview() {
L326 function startReviewFromToday(id) {
L331 function onReviewDone() {
L336 function openReview(id) {
L341 function openQuiz(wq) {
L347 function openWeaknessReport() {
L352 function openOutlineFromSelected() {
L358 function openEdit(wq) {
L370 async function saveEdit() {
L390 async function remove(wq) {
```

### 13. 独立3D校园

源文件：`web/frontend/student/src/views/campus3d/Campus3D.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/campus3d/Campus3D.vue:1) · 脚本 [L118](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/campus3d/Campus3D.vue:118) · 样式 [L321](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/campus3d/Campus3D.vue:321)。

**具体视觉重排：** 只改 `.campus3d-header`、场景覆盖UI、`.map-dialog`、按钮与提示的外观；场景继续占据主区域，地图为居中弹层。可将可视控制整为顶部条/底部浮动小控制组，但不建立侧栏，也不让平台Dock遮住WASD说明或场景交互。3D世界几何、渲染、移动和门交互不属于本次换肤。

**功能、状态和边界：** 保留sceneFrame/sceneCanvas/sceneLabels/roomOpenButton refs、tabindex和聚焦；开始探索、进入房间提示、打开服务、退出到门口、回大厅、导览分组/所有服务、travel进度与cancelTravel；low/balanced/high画质、comfort持久化、全屏及fallback、回学生端。loading/error boot重试、map/workspace暂停场景、scene callbacks、chat登录初始化/销毁、auth-expired、fullscreenchange清理、DEV调试实例不动。Element弹窗teleport到body，全屏必须继续覆盖documentElement。

**可编辑的现有结构类：** `.campus3d-page` L2；`.campus3d-header` L3；`.back-button` L4；`.campus3d-brand` L8；`.brand-mark` L9；`.campus3d-header-actions` L15；`.status-chip` L16；`.toolbar-button` L17；`.campus3d-frame` L26；`.scene-canvas` L27；`.scene-labels` L28；`.scene-state` L30；`.scene-loading` L30；`.loader-ring` L31；`.scene-error` L36；`.error-icon` L37；`.primary-button` L40；`.scene-intro` L43；`.scene-kicker` L44；`.room-prompt` L50；`.room-prompt-kicker` L51；`.room-prompt-actions` L54；`.secondary-button` L56；`.travel-status` L61；`.small` L62；`.travel-progress` L65；`.scene-topline` L68；`.location-chip` L69；`.location-chip-scene` L69；`.pin-dot` L69；`.scene-tool` L70；`.scene-bottomline` L73；`.explore-hint` L76；`.mouse-icon` L76；`.minimap-reopen-button` L77；`.campus3d-footer` L83；`.map-layer` L88；`.map-dialog` L89；`.map-hub` L97；`.map-hub-icon` L98；`.map-zones` L102；`.map-zone` L103；`.map-dot` L107。

**原样保留的模板契约：**

```vue
L4 <button> type="button" @click="goHome"
L17 <button> type="button" @click="mapOpen = true"
L20 <button> type="button" @click="toggleFullscreen"
L26 <section> ref="sceneFrame" :class="{ 'scene-expanded': isFullscreen }" aria-label="3D校园场景"
L27 <div> ref="sceneCanvas" tabindex="0" aria-label="3D校园：拖动环视，WASD移动，点击服务门进入房间"
L28 <div> ref="sceneLabels"
L30 <div> v-if="loading"
L36 <div> v-else-if="errorMessage"
L40 <button> type="button" @click="boot"
L43 <div> v-if="!loading && !errorMessage && !explorationStarted"
L47 <button> type="button" @click="startExplore"
L50 <section> v-if="roomPrompt" aria-live="polite"
L55 <button> ref="roomOpenButton" type="button" @click="openService(roomPrompt.item.id)"
L56 <button> type="button" @click="exitRoom"
L61 <div> v-if="traveling" role="status"
L64 <button> type="button" aria-label="取消前往" @click="cancelTravel"
L65 <span> :style="{ width: `${travelProgress}%` }"
L70 <button> type="button" aria-label="切换舒适模式" :aria-pressed="comfort" @click="toggleComfort"
L74 <select> v-model="quality" aria-label="场景画质" @change="setQuality"
L74 <option> value="low"
L74 <option> value="balanced"
L74 <option> value="high"
L75 <button> v-if="isFullscreen" @click="toggleFullscreen"
L77 <button> type="button" @click="mapOpen = true"
L80 <CampusWorkspace> v-if="workspaceOpen" :service-id="workspaceServiceId" @close="closeWorkspace"
L88 <div> v-if="mapOpen" @click.self="mapOpen = false"
L89 <section> role="dialog" aria-modal="true" aria-labelledby="mapTitle"
L95 <button> type="button" aria-label="关闭校园导览" @click="mapOpen = false"
L97 <button> type="button" @click="goHall"
L103 <section> v-for="group in mapGroups" :key="group.id" :style="{ '--zone-color': group.color }"
L106 <button> v-for="item in group.items" :key="item.id" type="button" @click="navigateToService(item.id)"
L107 <span> :style="{ background: item.color }"
```

**展示数据与动态文案（不得丢失）：**

```text
L16 locationName
L21 isFullscreen ? '退出全屏' : '全屏'
L39 errorMessage
L51 roomPrompt.profile.type
L51 roomPrompt.item.room
L52 roomPrompt.item.name
L53 roomPrompt.profile.prompt
L53 roomPrompt.profile.facilities.join(' · ')
L63 travelText
L70 comfort ? '舒适模式已开' : '舒适模式'
L104 group.name
L105 group.description
L108 item.name
L109 item.room
```

**冻结的脚本处理器/生命周期锚点：**

```js
L150 watch(() => userStore.isLoggedIn, loggedIn => {
L154 function handleAuthExpired() { userStore.logout() }
L155 function setQuality() {
L159 watch([mapOpen, workspaceOpen, explorationStarted], ([map, workspace, started]) => scene.value?.setPaused(map || workspace || !started))
L167 function showRoomPrompt(id) {
L176 function hideRoomPrompt() {
L180 function startExplore() {
L187 function openService(id) {
L196 function closeWorkspace() {
L202 function exitRoom() {
L212 function goHall() {
L222 function navigateToService(id) {
L228 function cancelTravel() {
L234 function toggleComfort() {
L240 async function toggleFullscreen() {
L249 function goHome() {
L254 function handleNavigation({ phase, id, progress }) {
L265 function handlePosition({ zone }) {
L270 async function boot() {
L301 function syncFullscreen() {
L305 onMounted(() => {
L311 onBeforeUnmount(() => {
```

### 14. 3D房间内真实业务工作区

源文件：`web/frontend/student/src/views/campus3d/CampusWorkspace.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/campus3d/CampusWorkspace.vue:1) · 脚本 [L19](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/campus3d/CampusWorkspace.vue:19) · 样式 [L106](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/campus3d/CampusWorkspace.vue:106)。

**具体视觉重排：** `.room-workspace` 是覆盖场景的完整主工作区，顶部服务名与返回房间，下一行返回上级/服务首页，正文`.room-page-host`全宽滚动；不再引入网页侧栏，嵌入页复用同一主题。子页面顶部/底部留白应考虑房间壳，不出现双重固定Dock。

**功能、状态和边界：** 保留serviceId/close、workspaceRoot/pageHost/closeButton、返回上级atLanding禁用、service首页、失败mountPages重试和v-show保留宿主。独立createApp+memory roomRouter、共享Pinia/ElementPlus、SERVICE_PATHS、auth/request router、列表状态Map、各route.fullPath滚动恢复、MutationObserver、错误401/503与event handler处理、generation竞态/cleanup全部冻结。Escape优先给内部Element弹窗/预览/抽屉，Tab焦点陷阱、关闭focus、卸载释放不改；不能把真实表单替换成3D假屏幕。

**可编辑的现有结构类：** `.room-workspace` L2；`.room-workspace-header` L3；`.room-service-icon` L4；`.room-service-heading` L5；`.room-shared-data` L6；`.room-return` L7；`.room-workspace-nav` L9；`.room-workspace-error` L14；`.room-page-host` L15。

**原样保留的模板契约：**

```vue
L2 <section> ref="workspaceRoot" role="dialog" aria-modal="true" aria-labelledby="room-service-title"
L4 <div> v-html="icon(service.icon)"
L7 <button> ref="closeButton" @click="emit('close')"
L9 <nav> aria-label="房间服务导航"
L10 <button> :disabled="atLanding" @click="roomRouter?.back()"
L11 <button> @click="roomRouter?.push(landing)"
L14 <div> v-if="failure" role="alert"
L14 <button> @click="mountPages"
L15 <div> v-show="!failure" ref="pageHost" tabindex="-1"
```

**展示数据与动态文案（不得丢失）：**

```text
L5 service.room
L5 service.name
L14 failure
```

**冻结的脚本处理器/生命周期锚点：**

```js
L45 function cleanup() { scrollObserver?.disconnect(); app?.unmount(); app = null; releaseRouter?.(); releaseRouter = null }
L46 async function mountPages() {
L89 function onKey(event) {
L102 onMounted(() => { closeButton.value?.focus(); document.addEventListener('keydown', onKey); mountPages() })
L103 onBeforeUnmount(() => { disposed = true; generation++; document.removeEventListener('keydown', onKey); cleanup() })
```

**组件公开接口原文：**

```js
L31 const props = defineProps({ serviceId: { type: String, required: true } })
L32 const emit = defineEmits(['close'])
```

### 15. 实时私信

源文件：`web/frontend/student/src/views/chat/ChatRoom.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/chat/ChatRoom.vue:1) · 脚本 [L22](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/chat/ChatRoom.vue:22) · 样式 [L74](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/chat/ChatRoom.vue:74)。

**具体视觉重排：** `.room` 保留网格的头部/业务上下文/可滚消息/输入四层，改全宽居中消息工作区；用户气泡深绿、对方白色，输入区在底部Dock上方，按实际可用高度计算，不让620px最小高度造成窄屏操作被遮挡。

**功能、状态和边界：** 保留返回/chat、头像昵称、connectionText实时/离线REST说明、dropdown block/hide命令及拉黑确认；BizContextCard、历史加载与historyDone、MessageBubble稳定key与retry、ChatComposer send完整。activeConversationId进入设置/离开清空、getConversation/loadHistory/markRead、消息变化滚底、失败回会话列表、store发送与重试保持。禁止用静态对话代替消息、破坏WebSocket或发送失败/已读状态。

**可编辑的现有结构类：** `.room` L2；`.more` L7；`.history-end` L15。

**原样保留的模板契约：**

```vue
L2 <section> v-loading="loading"
L4 <el-button> @click="$router.push('/chat')"
L5 <el-avatar> :size="44" :src="conversation?.peerAvatar"
L7 <el-dropdown> v-if="conversation" @command="command"
L9 <template> #dropdown
L9 <el-dropdown-item> command="block"
L9 <el-dropdown-item> command="hide"
L12 <BizContextCard> :conversation="conversation"
L13 <main> ref="scroller"
L14 <el-button> v-if="!chatStore.historyDone[id]" :loading="historyLoading" @click="loadMore"
L15 <div> v-else
L16 <MessageBubble> v-for="message in messages" :key="message.id || message.clientMessageId" :message="message" :mine="Number(message.senderId) === Number(userStore.userInfo?.id)" :peer-name="conversation?.peerNickname" :peer-avatar="conversation?.peerAvatar" @retry="retry"
L18 <ChatComposer> @send="send"
```

**展示数据与动态文案（不得丢失）：**

```text
L5 conversation?.peerNickname?.charAt(0)
L6 conversation?.peerNickname || '私信'
L6 connectionText
```

**冻结的脚本处理器/生命周期锚点：**

```js
L39 async function scrollBottom() { await nextTick(); if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight }
L40 async function loadMore() {
L44 async function send(type, content) {
L47 async function retry(message) {
L50 async function command(value) {
L54 watch(() => messages.value.map((item) => `${item.id || item.clientMessageId}:${item.sendState || ''}`).join('|'), () => {
L58 onMounted(async () => {
L71 onBeforeUnmount(() => { chatStore.activeConversationId = null })
```

### 16. 私信会话列表

源文件：`web/frontend/student/src/views/chat/ConversationList.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/chat/ConversationList.vue:1) · 脚本 [L21](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/chat/ConversationList.vue:21) · 样式 [L36](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/chat/ConversationList.vue:36)。

**具体视觉重排：** `.inbox` 改全宽大圆角列表；会话头像、昵称、最近消息、上下文标题、相对时间与未读徽标同时可见；连接状态放标题旁。

**功能、状态和边界：** 保留store.conversations遍历、chat/id点击、connected/connecting/disconnected/error四状态文案、加载与无会话空态。不要引入左侧会话栏；列表仍是独立路由，实时初始化由既有上层/store承担。

**可编辑的现有结构类：** `.inbox` L3；`.connection` L6；`.conversation` L8；`.body` L12；`.top` L13；`.bottom` L14。

**原样保留的模板契约：**

```vue
L3 <section> v-loading="loading"
L6 <span> :class="chatStore.socketState"
L8 <button> v-for="item in chatStore.conversations" :key="item.id" @click="$router.push(`/chat/${item.id}`)"
L9 <el-badge> :value="item.unreadCount" :hidden="!item.unreadCount"
L10 <el-avatar> :size="52" :src="item.peerAvatar"
L14 <em> v-if="item.contextTitle"
L17 <EmptyBox> v-if="!loading && !chatStore.conversations.length"
```

**展示数据与动态文案（不得丢失）：**

```text
L5 chatStore.unreadTotal
L6 stateText
L10 item.peerNickname?.charAt(0)
L13 item.peerNickname || '校园同学'
L13 fromNow(item.lastMessageTime)
L14 item.lastMessageSummary || '开始一段新对话'
L14 item.contextTitle
```

**冻结的脚本处理器/生命周期锚点：**

```js
L30 onMounted(async () => {
```

### 17. 你画我猜大厅

源文件：`web/frontend/student/src/views/drawGuess/Lobby.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/drawGuess/Lobby.vue:1) · 脚本 [L177](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/drawGuess/Lobby.vue:177) · 样式 [L289](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/drawGuess/Lobby.vue:289)。

**具体视觉重排：** `.play-hero` 改浅青绿色标题区，`.entry-grid` 为加入/创建两张同级卡，`.room-grid`和`.gallery-grid`全宽分区，最近房间横向条。保持游戏独特画笔插画，主色对齐深绿与淡黄。

**功能、状态和边界：** 保留joinByCode与createRoom原生form submit.prevent；六位大写数字字母roomCode清洗、joinPassword、加入中/错误；title40、maxPlayers2–6、roundsPerPlayer1–4、privateRoom开关、密码4–32、创建禁用条件。公开房间刷新/错误重试/骨架/空态、人数/在线/轮数/头像、joinPublicRoom行级loading；最近房间打开及WAITING/PLAYING/FINISHED；作品墙错误重试、图片预览、word/作者/房间/题号全留。不要写死房间或作品数据。

**可编辑的现有结构类：** `.draw-guess-page` L2；`.play-hero` L3；`.hero-copy` L4；`.hero-eyebrow` L5；`.live-dot` L5；`.hero-facts` L8；`.hero-doodle` L16；`.doodle-card` L17；`.back-card` L17；`.front-card` L18；`.doodle-spark` L27；`.spark-one` L27；`.spark-two` L28；`.entry-grid` L32；`.entry-card` L33；`.join-card` L33；`.card-icon` L34；`.join-icon` L34；`.entry-heading` L35；`.section-kicker` L36；`.field-label` L40；`.room-code-input` L44；`.input-help` L53；`.plain-input` L54；`.action-button` L55；`.secondary-action` L55；`.form-error` L58；`.create-card` L61；`.create-icon` L62；`.select-row` L70；`.select-field` L71；`.private-toggle` L84；`.toggle-mark` L86；`.primary-action` L90；`.list-section` L97；`.section-heading` L98；`.refresh-button` L103；`.state-panel` L107；`.error-panel` L107；`.text-action` L108；`.room-grid` L110；`.room-skeleton` L111；`.room-card` L114；`.room-card-top` L115；`.room-open` L116；`.room-code` L117；`.room-card-meta` L120；`.room-card-bottom` L125；`.room-players` L126；`.player-dot` L127；`.player-overflow` L128；`.empty-panel` L136；`.empty-doodle` L137；`.compact-section` L142；`.recent-strip` L146；`.recent-room` L147；`.recent-room-symbol` L148；`.recent-room-text` L149；`.recent-arrow` L150；`.gallery-section` L155；`.gallery-note` L158；`.gallery-grid` L163；`.art-card` L164；`.art-image` L165；`.art-preview` L166；`.art-word` L167；`.art-caption` L169；`.gallery-empty` L172。

**原样保留的模板契约：**

```vue
L3 <section> aria-labelledby="draw-guess-title"
L8 <div> aria-label="游戏规则"
L32 <section> aria-label="加入或创建游戏房间"
L33 <form> @submit.prevent="joinByCode"
L41 <input> v-model="roomCode" type="text" autocomplete="off" autocapitalize="characters" maxlength="6" aria-describedby="join-help" @input="roomCode = roomCode.replace(/[^a-z\d]/gi, '').toUpperCase()"
L54 <input> v-model="joinPassword" type="password" autocomplete="off" maxlength="32" aria-label="房间密码"
L55 <button> type="submit" :disabled="joining || roomCode.length !== 6"
L58 <p> v-if="joinError" role="alert"
L61 <form> @submit.prevent="createRoom"
L69 <input> v-model.trim="form.title" type="text" maxlength="40"
L73 <select> v-model.number="form.maxPlayers"
L74 <option> v-for="count in [2, 3, 4, 5, 6]" :key="count" :value="count"
L79 <select> v-model.number="form.roundsPerPlayer"
L80 <option> v-for="count in [1, 2, 3, 4]" :key="count" :value="count"
L85 <input> v-model="form.privateRoom" type="checkbox"
L89 <input> v-if="form.privateRoom" v-model="form.password" type="password" autocomplete="new-password" minlength="4" maxlength="32" aria-label="设置房间密码"
L90 <button> type="submit" :disabled="creating || (form.privateRoom && form.password.length < 4)"
L93 <p> v-if="createError" role="alert"
L97 <section> aria-labelledby="public-rooms-title"
L103 <button> type="button" :disabled="loadingRooms" @click="loadRooms"
L107 <div> v-if="roomError" role="alert"
L108 <button> type="button" @click="loadRooms"
L110 <div> v-else-if="loadingRooms && !rooms.length" aria-label="正在加载房间"
L111 <div> v-for="item in 3" :key="item"
L113 <div> v-else-if="rooms.length"
L114 <article> v-for="room in rooms" :key="room.id"
L126 <span> :aria-label="`已有 ${room.playerCount} 名玩家`"
L127 <span> v-for="player in room.players.slice(0, 4)" :key="player.userId" :title="player.nickname"
L128 <span> v-if="room.playerCount > 4"
L130 <button> type="button" :disabled="joiningRoomId === room.id" @click="joinPublicRoom(room)"
L136 <div> v-else
L142 <section> v-if="recentRooms.length" aria-labelledby="recent-rooms-title"
L147 <button> v-for="room in recentRooms" :key="room.id" type="button" @click="openRoom(room)"
L155 <section> aria-labelledby="gallery-title"
L160 <div> v-if="galleryError" role="alert"
L161 <button> type="button" @click="loadGallery"
L163 <div> v-else-if="gallery.length"
L164 <article> v-for="record in gallery" :key="record.roundId"
L165 <div> :aria-label="`预览 ${record.drawerNickname} 保存的作品`"
L166 <el-image> :src="record.snapshotUrl" :preview-src-list="[record.snapshotUrl]" :alt="`${record.drawerNickname} 的你画我猜作品`" loading="lazy"
L172 <div> v-else
```

**展示数据与动态文案（不得丢失）：**

```text
L56 joining ? '正在加入…' : '加入房间'
L58 joinError
L74 count
L91 creating ? '正在创建…' : '创建游戏房'
L93 createError
L104 loadingRooms ? '刷新中' : '刷新房间'
L108 roomError
L117 room.roomCode
L119 room.title || '校园画画房'
L121 room.playerCount
L121 room.maxPlayers
L122 room.roundsPerPlayer
L123 room.onlineCount
L127 (player.nickname || '同').slice(0, 1)
L128 room.playerCount - 4
L131 joiningRoomId === room.id ? '加入中…' : '加入房间 →'
L149 room.status === 'PLAYING' ? '游戏进行中' : room.status === 'FINISHED' ? '已结束' : '等待中'
L161 galleryError
L167 record.word
L169 record.drawerNickname
L169 record.title || '校园画画房'
L169 record.turnNumber
```

**冻结的脚本处理器/生命周期锚点：**

```js
L199 async function loadRooms() {
L212 async function loadGallery() {
L222 async function loadRecent() {
L231 async function joinByCode() {
L245 async function joinPublicRoom(room) {
L258 async function createRoom() {
L278 function openRoom(room) {
L282 onMounted(() => {
```

### 18. 实时绘画、猜词、聊天与作品保存

源文件：`web/frontend/student/src/views/drawGuess/Room.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/drawGuess/Room.vue:1) · 脚本 [L145](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/drawGuess/Room.vue:145) · 样式 [L529](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/drawGuess/Room.vue:529)。

**具体视觉重排：** 明确移除 `.side-panel` 侧栏：玩家榜单搬到画板上方横向玩家条，`.chat-panel` 搬到画板下方全宽猜词聊天区域；`.room-layout` 单列，保持canvas获得真实可测宽高。画具在画板上缘横排，底部Dock不能遮挡canvas或输入。非画手私密题目不可被视觉重排泄露。

**功能、状态和边界：** 保留返回/leaveRoom、连接四状态、loadError重试、WAITING/PLAYING/FINISHED、倒计时<=10警示、题号/轮数/房间码复制fallback、turnNotice。房主等至少2人才start；只有画手进行中有颜色/橡皮/清空/跳题/当前题保存；pointerdown/move/up/cancel/lostpointercapture和canvasRef全部保留、pointer capture/归一化坐标/DPR/ResizeObserver重绘不改。结束回合待保存作品不能删，saveSnapshot(roundId)使用已保留快照/当前canvas、去重与刷新恢复。玩家房主/自己/在线/积分、聊天/猜词模式禁用、240字、Enter和submit、FINISHED禁用、正确猜中样式、消息滚底；ticket/WebSocket事件机、私密答案、服务端计时、消息去重100条、离开规则、清理连接/观察器全部冻结。

**可编辑的现有结构类：** `.draw-room-page` L2；`.room-page-head` L3；`.back-link` L4；`.room-head-title` L7；`.room-eyebrow` L8；`.connection-state` L11；`.room-error` L16；`.text-action` L17；`.room-status-bar` L21；`.round-status` L22；`.round-icon` L23；`.timer` L26；`.room-invite` L29；`.turn-notice` L35；`.completed-artwork-actions` L38；`.notice-save` L40；`.room-layout` L46；`.board-panel` L47；`.board-toolbar` L48；`.drawer-prompt` L49；`.prompt-marker` L50；`.drawing-tools` L55；`.color-tools` L56；`.color-swatch` L57；`.tool-button` L59；`.clear-tool` L60；`.skip-tool` L61；`.owner-tools` L63；`.start-button` L64；`.save-button` L68；`.canvas-frame` L73；`.draw-canvas` L76；`.canvas-empty-hint` L86；`.finished-hint` L89；`.board-footer` L93；`.lock-indicator` L94；`.side-panel` L99；`.players-panel` L100；`.panel-heading` L101；`.panel-kicker` L101；`.online-count` L101；`.player-list` L102；`.player-row` L103；`.rank-number` L104；`.player-avatar` L105；`.player-details` L106；`.player-score` L107；`.waiting-note` L110；`.chat-panel` L113；`.chat-heading` L114；`.chat-count` L114；`.message-list` L115；`.chat-empty` L116；`.chat-message` L117；`.message-avatar` L118；`.message-body` L119；`.chat-composer` L122；`.composer-modes` L123；`.composer-form` L127；`.composer-help` L131；`.room-footer` L137；`.leave-button` L139。

**原样保留的模板契约：**

```vue
L2 <div> :aria-busy="loading"
L4 <button> type="button" @click="leaveRoom"
L11 <div> :class="`state-${socketState}`" role="status" aria-live="polite"
L16 <div> v-if="loadError" role="alert"
L17 <button> type="button" @click="loadRoom"
L20 <template> v-else-if="room"
L21 <section> aria-label="游戏状态"
L26 <div> v-if="room.status === 'PLAYING'" :class="{ urgent: remainingSeconds <= 10 }" aria-live="off"
L29 <div> v-else
L31 <button> type="button" aria-label="复制房间码" @click="copyRoomCode"
L35 <div> v-if="turnNotice" role="status"
L38 <div> v-if="pendingCompletedArtworks.length" aria-label="已结束回合的待保存作品"
L40 <button> v-for="artwork in pendingCompletedArtworks" :key="artwork.roundId" type="button" :disabled="savingSnapshot" @click="saveSnapshot(artwork.roundId)"
L47 <section> aria-label="实时画板"
L49 <div> aria-live="polite"
L50 <span> :class="{ active: room.isDrawer }"
L51 <span> v-if="room.isDrawer"
L52 <span> v-else-if="room.status === 'PLAYING'"
L53 <span> v-else
L55 <div> v-if="room.isDrawer && room.status === 'PLAYING'" aria-label="画笔工具"
L56 <div> role="group" aria-label="画笔颜色"
L57 <button> v-for="color in colors" :key="color" :class="{ selected: selectedColor === color }" :style="{ '--swatch': color }" type="button" :aria-label="`选择颜色 ${color}`" :aria-pressed="selectedColor === color" @click="selectedColor = color"
L59 <button> :class="{ selected: tool === 'eraser' }" type="button" :aria-pressed="tool === 'eraser'" @click="tool = tool === 'eraser' ? 'pen' : 'eraser'"
L60 <button> type="button" @click="clearCanvas"
L61 <button> type="button" @click="skipTurn"
L63 <div> v-else-if="room.isOwner && room.status === 'WAITING'"
L64 <button> type="button" :disabled="room.playerCount < 2 || starting" @click="startGame"
L68 <button> v-if="room.isDrawer && room.status === 'PLAYING' && room.currentRoundId" type="button" :disabled="savingSnapshot || isRoundSaved(room.currentRoundId)" @click="saveSnapshot(room.currentRoundId)"
L73 <div> :class="{ 'canvas-locked': !room.isDrawer || room.status !== 'PLAYING' }"
L74 <canvas> ref="canvasRef" tabindex="0" role="img" aria-label="你画我猜共享画板。画手可以使用触控、鼠标或触控笔绘画。" @pointerdown="beginStroke" @pointermove="continueStroke" @pointerup="endStroke" @pointercancel="endStroke" @lostpointercapture="endStroke"
L86 <div> v-if="room.status === 'WAITING'"
L89 <div> v-else-if="room.status === 'FINISHED'"
L100 <section> aria-labelledby="players-heading"
L103 <li> v-for="(player, index) in room.players" :key="player.userId"
L104 <span> :class="{ winner: index === 0 && player.score > 0 }"
L105 <WtAvatar> :class="`avatar-tone-${index % 4}`" :name="player.nickname || '校园同学'" :src="player.avatar" :size="30"
L106 <small> v-if="player.owner"
L106 <small> v-if="Number(player.userId) === myUserId"
L106 <i> :class="{ online: player.online }"
L110 <div> v-if="room.status === 'WAITING'"
L113 <section> aria-labelledby="chat-heading"
L115 <div> ref="messagesRef" aria-live="polite" aria-relevant="additions text" aria-label="房间聊天记录"
L116 <p> v-if="!messages.length"
L117 <article> v-for="message in messages" :key="message.id" :class="{ correct: message.correct, mine: Number(message.userId) === myUserId }"
L123 <div> role="group" aria-label="发送方式"
L124 <button> type="button" :class="{ active: composerMode === 'guess' }" :disabled="room.status !== 'PLAYING' || room.isDrawer" @click="composerMode = 'guess'"
L125 <button> type="button" :class="{ active: composerMode === 'chat' }" @click="composerMode = 'chat'"
L127 <form> @submit.prevent="sendComposerMessage"
L128 <input> ref="composerInput" v-model="composerText" type="text" maxlength="240" :disabled="room.status === 'FINISHED'" :placeholder="composerMode === 'guess' ? '你觉得画的是什么？' : '说点什么…'" aria-label="输入猜词或聊天内容" @keydown.enter.prevent="sendComposerMessage"
L129 <button> type="submit" :disabled="!composerText.trim() || room.status === 'FINISHED'" aria-label="发送消息"
L139 <button> type="button" @click="leaveRoom"
```

**展示数据与动态文案（不得丢失）：**

```text
L9 room?.title || '你画我猜房间'
L12 socketLabel
L17 loadError
L24 room.status === 'PLAYING' ? `第 ${room.currentTurn} / ${room.totalTurns} 题` : room.status === 'FINISHED' ? '本局已结束' : '房间等待中'
L24 room.status === 'PLAYING' ? (room.isDrawer ? '轮到你来画' : '仔细看画，猜猜是什么') : `${room.playerCount} 位同学已加入`
L27 remainingSeconds
L30 room.roomCode
L36 turnNotice
L39 pendingCompletedArtworks.length
L42 savingSnapshot ? '保存中…' : `保存第 ${artwork.turnNumber} 题的画`
L51 privateAnswer || `${room.answerLength || '？'} 个字`
L52 drawerName || '画手'
L53 room.status === 'FINISHED' ? '游戏结束' : '等待房主开始'
L53 room.status === 'WAITING' ? '至少两位同学加入后就能开局' : '可以返回大厅再开一局'
L59 tool === 'eraser' ? '橡皮擦' : '橡皮'
L65 starting ? '准备开局…' : room.playerCount < 2 ? '再等一位同学' : '开始游戏'
L69 isRoundSaved(room.currentRoundId) ? '✓ 已保存' : savingSnapshot ? '保存中…' : '保存画作'
L94 room.isDrawer && room.status === 'PLAYING' ? '只有当前画手可以落笔' : '画板由当前画手操作'
L101 room.playerCount
L101 room.maxPlayers
L101 room.onlineCount
L104 index + 1
L106 player.nickname
L106 player.online ? '在线' : '暂时离开'
L107 player.score
L110 Math.max(0, 2 - room.playerCount)
L114 messages.length
L118 (message.nickname || '同').slice(0, 1)
L119 message.nickname || '校园同学'
L119 formatTime(message.createdAt)
L119 message.content
L131 composerMode === 'guess' ? '答错会作为消息发送，猜中后一起得分。' : '友善交流，不要在聊天里直接透露题目。'
```

**冻结的脚本处理器/生命周期锚点：**

```js
L192 async function loadRoom() {
L228 function connectSocket(id) {
L242 function handleEvent(event) {
L315 function addMessage(message) {
L323 function scrollMessagesToEnd() {
L329 function sendComposerMessage() {
L337 async function startGame() {
L351 function clearCanvas() {
L355 function skipTurn() {
L359 function getCanvasContext() {
L363 function clearCanvasPixels() {
L369 function redrawCanvas() {
L382 function drawStroke(context, width, height, stroke) {
L402 function beginStroke(event) {
L413 function continueStroke(event) {
L436 function endStroke(event) {
L451 function isRoundSaved(id) {
L455 async function saveSnapshot(roundId) {
L478 async function copyRoomCode() {
L487 async function leaveRoom() {
L497 function formatTime(value) {
L504 function attachResizeObserver() {
L518 watch(roomId, (id) => { if (id) loadRoom() }, { immediate: true })
L519 watch(() => messages.value.length, scrollMessagesToEnd)
L521 onBeforeUnmount(() => {
```

### 19. 首页聚合门户

源文件：`web/frontend/student/src/views/home/Home.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/home/Home.vue:1) · 脚本 [L226](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/home/Home.vue:226) · 样式 [L419](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/home/Home.vue:419)。

**具体视觉重排：** 严格按主文档第 7.3 节组织 `.portal`：上部 `.tp-home-top` 为 WtHero 插画校园与 `.study-note/.calendar-panel` 便笺的非对称内容双栏；下部保留四项服务、3D入口、活动/闲置/失物切换、闲置互换及社区横幅。`.home-columns` 与 `.home-aside` 类保留，公告和消息可以作为非导航内容列；窄屏再折为单列。保留 WtHero 及 Home 原有全部传参（尤其 photo 与 photo-note），地图在 WtHero 模板内增强，不改 Home 脚本与导入。`.study-note` 用淡黄，`.bulletin/.calendar-panel` 用白底薄边，深绿用于主按钮。首页没有常驻应用导航侧栏；不可把“无侧栏”误解为删除原型的内容双栏。

**功能、状态和边界：** 保留 WtHero 的 hello、primary、secondary、event 绑定；`go(e)` 对 needLogin 的判定；四个 entries 及 3D、活动全部、闲置、动态、AI 答疑、错题复习、公告详情/全部、我的报名、私信入口。活动/闲置/失物三个 tab 的 feedList 映射及每类截取三条不能换成静态原型卡片。保留真实图片与 WtEventArt 兜底、分类/状态/时间/地点/人数、交换期望、发布者、骨架和无数据提示。学习统计的登录分支与聚合/公告/错题接口各自容错保留；日历目前是展示与报名入口，不得虚构新增日程操作。

**可编辑的现有结构类：** `.portal` L2；`.campus3d-entry` L15；`.campus3d-entry-icon` L16；`.campus3d-entry-copy` L17；`.campus3d-entry-arrow` L21；`.quick-strip` L25；`.home-columns` L41；`.section-title` L44；`.text-btn` L49；`.tabs` L51；`.home-tabs` L51；`.tab` L56；`.cards` L61；`.home-cards` L61；`.item` L62；`.event-card` L62；`.skeleton-card` L62；`.skeleton-block` L63；`.item-body` L64；`.event-cover-img` L74；`.event-title-row` L77；`.event-date` L78；`.card-category` L83；`.item-meta` L87；`.meta-divider` L90；`.item-bottom` L93；`.avatar-stack` L95；`.card-arrow` L98；`.empty` L105；`.spaced` L108；`.section-gap` L108；`.object-card` L119；`.cover` L122；`.cover-fallback` L124；`.tag` L127；`.exchange-line` L132；`.mini-avatar` L138；`.community-banner` L148；`.round-arrow` L155；`.home-aside` L162；`.study-note` L164；`.study-note-top` L165；`.service-icon` L166；`.btn` L173；`.primary` L173；`.study-todo` L176；`.bulletin` L184；`.bulletin-item` L189；`.muted` L193；`.calendar-panel` L197；`.weekly` L202；`.calendar-empty` L208；`.message-entry` L216；`.msg-arrow` L219。

**原样保留的模板契约：**

```vue
L4 <WtHero> :hello="helloLine" :primary="{ label: '发现校园活动', to: '/activity' }" :secondary="{ label: '找 AI 帮忙', to: '/ai/chat' }" :event="heroEvent"
L15 <button> type="button" @click="go({ to: '/campus-3d' })"
L25 <div> aria-label="校园服务快捷入口"
L26 <WtQuickEntry> v-for="e in entries" :key="e.to" :title="e.title" :desc="e.desc" :color="e.color" @click="go(e)"
L34 <template> #icon
L35 <svg> v-html="ICONS[e.icon]"
L49 <a> @click="go({ to: '/activity' })"
L52 <button> v-for="t in tabs" :key="t.value" type="button" :class="{ active: tab === t.value }" @click="tab = t.value"
L61 <div> v-if="loading"
L62 <div> v-for="i in 3" :key="i"
L67 <div> v-else-if="feedList.length"
L68 <a> v-for="a in feedList" :key="a.key" @click="go({ to: a.to, needLogin: a.needLogin })"
L74 <img> v-if="firstContentImage(a, a.moduleId)" :src="firstContentImage(a, a.moduleId)" :alt="a.title"
L75 <WtEventArt> v-else :item="a"
L105 <div> v-else
L113 <a> @click="go({ to: '/idle' })"
L116 <a> v-for="i in data.idleItems.slice(0, 3)" :key="'i' + i.id" @click="go({ to: `/idle/detail/${i.id}` })"
L123 <img> v-if="firstContentImage(i, 'idle', i.category)" :src="firstContentImage(i, 'idle', i.category)" :alt="i.title"
L124 <div> v-else
L148 <a> @click="go({ to: '/social' })"
L154 <img> loading="lazy"
L173 <button> type="button" @click="go({ to: '/ai/chat', needLogin: true })"
L179 <a> @click="go({ to: '/ai/wrong', needLogin: true })"
L187 <a> @click="go({ to: '/notice' })"
L189 <a> v-for="n in notices" :key="n.id" @click="go({ to: `/notice/detail/${n.id}` })"
L193 <div> v-if="!notices.length"
L203 <span> v-for="(d, i) in weekDays" :key="i"
L205 <b> :class="{ today: i === todayIdx }"
L211 <a> @click="go({ to: '/activity/my-signup', needLogin: true })"
L216 <a> @click="go({ to: '/chat', needLogin: true })"
```

**展示数据与动态文案（不得丢失）：**

```text
L59 t.label
L79 a.day
L80 a.month
L83 a.category
L83 a.statusText
L84 a.title
L89 a.location || '地点待定'
L91 a.timeText
L96 a.memberCount
L127 i.category || '二手'
L130 i.location || '校内面交'
L131 i.title
L134 i.expectItem ? '期望换：' + i.expectItem : '面议'
L138 (i.nickname || '同').charAt(0)
L139 i.nickname || '同学'
L178 wrongCount
L190 n.type || '公告'
L190 formatNoticeDate(n.createTime || n.publishTime)
L191 n.title
L200 monthLabel
L204 d.week
L205 d.day
```

**冻结的脚本处理器/生命周期锚点：**

```js
L294 function statusText(a) {
L297 function timeText(t) {
L300 function dayOf(t) {
L304 function monthOf(t) {
L365 function go(entry) {
L388 function formatNoticeDate(t) {
L393 onMounted(async () => {
```

### 20. 闲置详情、预约及互评

源文件：`web/frontend/student/src/views/idle/Detail.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/idle/Detail.vue:1) · 脚本 [L119](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/idle/Detail.vue:119) · 样式 [L269](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/idle/Detail.vue:269), [L327](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/idle/Detail.vue:327)。

**具体视觉重排：** `.layout` 由图片与信息并列改为上方图库、下方内容与横向操作卡；`.publisher` 是可点击作者条；交换期望用淡黄底，主预约按钮深绿，收藏/举报轻量排列。各弹窗与评分输入保持清晰。

**功能、状态和边界：** 保留图片轮播/预览/懒加载/语义兜底与示意图标记、浏览数、category、description、expectItem、卖家评分、主页和私信；非所有者按 reviewAppointmentId/reviewed/myAppointmentId/status 依序展示评价、已评价、已预约或可预约；所有者下架及互评；收藏、举报双方状态不删。预约留言255字、确认预约、5星默认互评及255字内容、举报类型/说明500字、各自loading和登录跳转；offline 的确认与返回列表、reviewAppointmentId 优先于 myAppointmentId 的提交逻辑冻结。

**可编辑的现有结构类：** `.detail` L4；`.layout` L6；`.gallery` L8；`.schematic-flag` L10；`.info` L18；`.meta` L20；`.views` L23；`.expect` L25；`.desc` L26；`.publisher` L27；`.score` L31；`.actions` L34；`.rate-row` L79。

**原样保留的模板契约：**

```vue
L4 <div> v-loading="loading"
L5 <el-card> v-if="item"
L9 <el-carousel> v-if="detailImages.length" :arrow="detailImages.length > 1 ? 'hover' : 'never'"
L10 <span> v-if="isSchematic"
L11 <el-carousel-item> v-for="img in detailImages" :key="img"
L12 <el-image> :src="img" :preview-src-list="detailImages" lazy @error="onImgError($event, img)"
L15 <el-empty> v-else :image-size="80"
L21 <el-tag> v-if="item.category"
L22 <el-tag> :type="statusType"
L27 <div> @click="goUser(item.userId)"
L28 <el-avatar> :size="36" :src="item.publisherAvatar"
L31 <div> v-if="item.sellerAvgScore"
L35 <template> v-if="!item.isOwner"
L36 <el-button> v-if="item.reviewAppointmentId && !item.reviewed" type="warning" @click="openReview"
L39 <el-button> v-else-if="item.reviewAppointmentId && item.reviewed" disabled
L40 <el-button> v-else-if="item.myAppointmentId" disabled
L41 <el-button> v-else type="primary" :disabled="item.status !== 0" @click="appointVisible = true"
L44 <el-button> @click="contactPublisher"
L46 <template> v-else
L47 <el-button> type="danger" @click="offline"
L48 <el-button> v-if="item.reviewAppointmentId && !item.reviewed" type="warning" @click="openReview"
L51 <el-button> v-else-if="item.reviewAppointmentId && item.reviewed" disabled
L53 <el-button> type="warning" @click="reportVisible = true"
L54 <el-button> :type="favorited ? 'warning' : 'default'" @click="toggleFavorite"
L63 <el-dialog> v-model="appointVisible"
L64 <el-input> v-model="appointMsg" type="textarea" :rows="3" maxlength="255"
L71 <template> #footer
L72 <el-button> @click="appointVisible = false"
L73 <el-button> type="primary" :loading="appointing" @click="doAppoint"
L78 <el-dialog> v-model="reviewVisible"
L81 <el-rate> v-model="reviewForm.score"
L83 <el-input> v-model="reviewForm.content" type="textarea" :rows="3" maxlength="255"
L90 <template> #footer
L91 <el-button> @click="reviewVisible = false"
L92 <el-button> type="primary" :loading="reviewing" @click="doReview"
L97 <el-dialog> v-model="reportVisible"
L99 <el-form-item> label="举报类型"
L100 <el-select> v-model="reportForm.reasonType"
L101 <el-option> label="虚假/欺诈信息" value="欺诈"
L102 <el-option> label="违规内容" value="违规"
L103 <el-option> label="广告骚扰" value="广告"
L104 <el-option> label="其他" value="其他"
L107 <el-form-item> label="补充说明"
L108 <el-input> v-model="reportForm.reason" type="textarea" :rows="3" maxlength="500"
L111 <template> #footer
L112 <el-button> @click="reportVisible = false"
L113 <el-button> type="primary" @click="doReport"
```

**展示数据与动态文案（不得丢失）：**

```text
L19 item.title
L21 item.category
L22 statusText
L23 item.viewCount
L25 item.expectItem || '面议'
L26 item.description
L28 item.publisherNickname?.charAt(0)
L30 item.publisherNickname
L31 item.sellerAvgScore.toFixed(1)
L42 item.status === 0 ? '发起预约互换' : '该物品暂不可预约'
L55 favorited ? '★ 已收藏' : '☆ 收藏'
```

**冻结的脚本处理器/生命周期锚点：**

```js
L145 function onImgError(event, img) {
L162 async function load() {
L174 async function toggleFavorite() {
L190 async function doAppoint() {
L206 async function offline() {
L217 function goUser(id) {
L223 async function contactPublisher() {
L227 function openReview() {
L237 async function doReview() {
L251 async function doReport() {
L266 onMounted(load)
```

### 21. 闲置互换列表

源文件：`web/frontend/student/src/views/idle/List.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/idle/List.vue:1) · 脚本 [L55](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/idle/List.vue:55) · 样式 [L137](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/idle/List.vue:137)。

**具体视觉重排：** `.toolbar` 改顶部搜索带和可换行分类胶囊，我的预约与发布并列；`.grid` 统一成白色圆角图文卡，期望换物突出，状态 badge 位于封面角落，禁止改造成商品购买商城。

**功能、状态和边界：** 保留教材书籍/数码电子/生活用品/运动器材/服饰鞋包/其他筛选、关键词Enter/清空、我的预约、发布登录检查、详情跳转；ItemCard 的 cover/title/desc/time/module/category 与 badge/footer 插槽；在架/已预约/已完成/已下架四状态、12条分页、路由q与 useListState、加载错误重试和空态。

**可编辑的现有结构类：** `.load-error` L2；`.text-btn` L2；`.idle-list` L5；`.toolbar` L7；`.chips` L11；`.chip` L12；`.spacer` L15；`.grid` L21；`.badge-tag` L34；`.card-footer` L37；`.expect` L39。

**原样保留的模板契约：**

```vue
L2 <div> v-if="loadError" role="alert"
L2 <button> type="button" @click="load"
L8 <el-input> v-model="keyword" clearable @keyup.enter="search" @clear="search"
L9 <template> #append
L9 <el-button> @click="search"
L12 <span> :class="{ active: !category }" @click="selectCategory('')"
L13 <span> v-for="c in categories" :key="c" :class="{ active: category === c }" @click="selectCategory(c)"
L16 <el-button> @click="$router.push('/idle/appointments')"
L17 <el-button> type="primary" @click="goPublish"
L21 <div> v-loading="loading"
L22 <ItemCard> v-for="item in list" :key="item.id" :cover="firstContentImage(item, 'idle', item.category)" :title="item.title" :desc="item.description" :time="item.createTime" :category="item.category" @click="$router.push(`/idle/detail/${item.id}`)"
L33 <template> #badge
L34 <span> :class="badgeCls(item.status)"
L36 <template> #footer
L38 <el-tag> v-if="item.category"
L44 <EmptyBox> v-if="!loadError && !loading && !list.length"
L45 <el-pagination> v-model:current-page="pageNum" :total="total" :page-size="12" layout="prev, pager, next" @current-change="load"
```

**展示数据与动态文案（不得丢失）：**

```text
L2 loadError
L13 c
L34 badgeText(item.status)
L38 item.category
L39 item.expectItem || '面议'
```

**冻结的脚本处理器/生命周期锚点：**

```js
L80 function selectCategory(c) {
L87 function badgeCls(s) {
L90 function badgeText(s) {
L94 function search() {
L99 async function load() {
L113 function goPublish() {
L123 watch(
```

### 22. 买家与卖家预约

源文件：`web/frontend/student/src/views/idle/MyAppointments.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/idle/MyAppointments.vue:1) · 脚本 [L69](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/idle/MyAppointments.vue:69) · 样式 [L138](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/idle/MyAppointments.vue:138)。

**具体视觉重排：** `.my-appointments` 用全宽管理卡，buyer/seller 顶部横向切换；物品缩略图、对象、留言、状态、操作保持同一行，窄屏横滚。互评弹窗与详情一致。

**功能、状态和边界：** 保留 route.query.role=seller 预选、role tab-change=load、10条分页；seller且status0才接受/拒绝，status1确认完成，status3且未评价才互评，已评价文本。保留5星默认、评价内容255字、reviewing；状态待确认/已接受/已拒绝/已完成/已取消不得压缩丢失。

**可编辑的现有结构类：** `.my-appointments` L4；`.item-cell` L14；`.thumb` L15；`.done-text` L40；`.rate-row` L56。

**原样保留的模板契约：**

```vue
L6 <template> #header
L7 <el-tabs> v-model="role" @tab-change="load"
L8 <el-tab-pane> label="我发起的（买家）" name="buyer"
L9 <el-tab-pane> label="我收到的（卖家）" name="seller"
L11 <el-table> :data="list" v-loading="loading"
L12 <el-table-column> label="物品"
L13 <template> #default="{ row }"
L15 <el-image> v-if="row.itemImage" :src="row.itemImage"
L20 <el-table-column> :label="role === 'buyer' ? '卖家' : '买家'"
L21 <template> #default="{ row }"
L23 <el-table-column> prop="message" label="留言"
L24 <el-table-column> label="状态"
L25 <template> #default="{ row }"
L26 <el-tag> :type="statusType(row.status)"
L29 <el-table-column> label="操作"
L30 <template> #default="{ row }"
L32 <template> v-if="role === 'seller' && row.status === 0"
L33 <el-button> type="success" @click="handle(row, true)"
L34 <el-button> type="danger" @click="handle(row, false)"
L37 <el-button> v-if="row.status === 1" type="primary" @click="finish(row)"
L39 <el-button> v-if="row.status === 3 && !row.reviewed" type="warning" @click="openReview(row)"
L40 <span> v-if="row.status === 3 && row.reviewed"
L44 <el-pagination> v-model:current-page="pageNum" :total="total" :page-size="10" layout="prev, pager, next" @current-change="load"
L55 <el-dialog> v-model="reviewVisible"
L58 <el-rate> v-model="reviewForm.score"
L60 <el-input> v-model="reviewForm.content" type="textarea" :rows="3" maxlength="255"
L61 <template> #footer
L62 <el-button> @click="reviewVisible = false"
L63 <el-button> type="primary" :loading="reviewing" @click="doReview"
```

**展示数据与动态文案（不得丢失）：**

```text
L16 row.itemTitle
L21 role === 'buyer' ? row.sellerNickname : row.buyerNickname
L26 statusText(row.status)
```

**冻结的脚本处理器/生命周期锚点：**

```js
L93 async function load() {
L104 async function handle(row, accept) {
L110 async function finish(row) {
L116 function openReview(row) {
L123 async function doReview() {
L135 onMounted(load)
```

### 23. 闲置发布编辑与AI估价

源文件：`web/frontend/student/src/views/idle/Publish.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/idle/Publish.vue:1) · 脚本 [L64](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/idle/Publish.vue:64) · 样式 [L144](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/idle/Publish.vue:144)。

**具体视觉重排：** `.publish` 纵向分为审核说明、AI 文案助手、物品表单和淡黄估价结果卡；估价与表单同宽，不能成为右侧工具栏。所有图片控制留在表单。

**功能、状态和边界：** 保留 query.id 编辑分支、标题64字、分类、description、expectItem、最多9图、提交审核/取消；AiAssistPanel(idle) 填充标题描述。仅新建显示 doEstimate，标题空禁用；价格区间、行情参考、建议、sellingPoints 卖点均保留，失败提示和 estimating 独立。估价不创建价格字段、不改变互换业务；编辑回填、重新审核及提交后到 profile 不改。

**可编辑的现有结构类：** `.publish` L4；`.est-head` L36；`.est-tip` L38；`.est-card` L48；`.est-price` L49；`.est-line` L50。

**原样保留的模板契约：**

```vue
L2 <WtPageHeader> :title="editId ? '编辑闲置' : '发布闲置'" :subtitle="editId ? '修改物品信息，保存后重新进入审核' : '把闲置好物分享给同学'"
L6 <template> #header
L7 <el-alert> type="info" :closable="false"
L8 <AiAssistPanel> :type="'idle'" @fill="applyAssist"
L9 <el-form> :model="form"
L10 <el-form-item> label="标题"
L11 <el-input> v-model="form.title" maxlength="64" show-word-limit
L13 <el-form-item> label="分类"
L14 <el-select> v-model="form.category"
L15 <el-option> v-for="c in categories" :key="c" :label="c" :value="c"
L18 <el-form-item> label="物品描述"
L19 <el-input> v-model="form.description" type="textarea" :rows="4"
L21 <el-form-item> label="期望换物"
L22 <el-input> v-model="form.expectItem"
L24 <el-form-item> label="图片"
L25 <UploadImg> v-model="form.images" :max="9"
L28 <el-button> type="primary" :loading="submitting" @click="submit"
L29 <el-button> @click="$router.back()"
L34 <template> v-if="!editId"
L40 <el-button> type="success" :loading="estimating" :disabled="!form.title.trim()" @click="doEstimate"
L48 <div> v-if="estimate"
L50 <div> v-if="estimate.reference"
L51 <div> v-if="estimate.tip"
L52 <div> v-if="estimate.sellingPoints?.length"
L55 <li> v-for="(p, i) in estimate.sellingPoints" :key="i"
```

**展示数据与动态文案（不得丢失）：**

```text
L46 estimating ? 'AI 估价中…' : '让 AI 估个价'
L49 estimate.priceMin
L49 estimate.priceMax
L50 estimate.reference
L51 estimate.tip
L55 p
```

**冻结的脚本处理器/生命周期锚点：**

```js
L82 onMounted(async () => {
L97 function applyAssist(data) {
L103 async function doEstimate() {
L123 async function submit() {
```

### 24. 学生登录

源文件：`web/frontend/student/src/views/login/Login.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/login/Login.vue:1) · 脚本 [L41](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/login/Login.vue:41) · 样式 [L93](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/login/Login.vue:93)。

**具体视觉重排：** 在AuthCampusShell中用浅青环境背景与白色表单卡；登录标题和按钮深绿，验证码区淡黄细边；插画/故事区域可移至顶部，不能做常驻导航栏。

**功能、状态和边界：** 保留formRef与rules、studentNo/password/captchaId/captchaCode、密码显示切换、form和验证码Enter提交、图片验证码与数学验证码两模式、3/4字符限制、点击刷新、失败自动loadCaptcha、loading、loginSuccess(token,userInfo)、query.redirect优先及注册链接。不要把学号改手机号，不删除验证码或擅增第三方登录。

**可编辑的现有结构类：** `.hello` L4；`.auth-story-more` L6；`.login-card` L9；`.auth-form-head` L10；`.muted` L13；`.captcha-row` L23；`.captcha-img` L27；`.captcha-math` L29；`.submit` L32；`.login-foot` L34。

**原样保留的模板契约：**

```vue
L3 <template> #story
L15 <el-form> ref="formRef" :model="form" :rules="rules" @keyup.enter="submit"
L16 <el-form-item> prop="studentNo"
L17 <el-input> v-model="form.studentNo" :prefix-icon="User"
L19 <el-form-item> prop="password"
L20 <el-input> v-model="form.password" type="password" show-password :prefix-icon="Lock"
L22 <el-form-item> prop="captchaCode"
L24 <el-input> v-model="form.captchaCode" :placeholder="captchaMode === 'math' ? '输入运算结果' : '4位验证码'" :maxlength="captchaMode === 'math' ? 3 : 4" @keyup.enter="submit"
L27 <img> v-if="captchaMode !== 'math'" :src="captchaImage" @click="loadCaptcha"
L29 <div> v-else @click="loadCaptcha"
L32 <el-button> type="primary" :loading="loading" @click="submit"
L35 <router-link> to="/register"
```

**展示数据与动态文案（不得丢失）：**

```text
L29 captchaExpression
```

**冻结的脚本处理器/生命周期锚点：**

```js
L65 async function loadCaptcha() {
L74 async function submit() {
L90 onMounted(loadCaptcha)
```

### 25. 学生注册

源文件：`web/frontend/student/src/views/login/Register.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/login/Register.vue:1) · 脚本 [L47](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/login/Register.vue:47) · 样式 [L121](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/login/Register.vue:121)。

**具体视觉重排：** 与登录共用同一视觉框架，字段纵排、标签与校验可读，长表单小屏可以滚动；验证码和提交始终可操作。

**功能、状态和边界：** 保留学号6–20位数字、nickname、password6–32、confirm一致校验、captchaId/code和两模式刷新、Enter/按钮、loading；register只发送既有字段、成功自动登录首页、失败刷新验证码、去登录链接。演示未做真认证的现有说明不能用视觉重设计虚构实名功能。

**可编辑的现有结构类：** `.hello` L4；`.auth-story-more` L6；`.register-card` L9；`.auth-form-head` L10；`.muted` L13；`.captcha-row` L29；`.captcha-img` L33；`.captcha-math` L35；`.submit` L38；`.links` L40。

**原样保留的模板契约：**

```vue
L3 <template> #story
L15 <el-form> ref="formRef" :model="form" :rules="rules" @keyup.enter="submit"
L16 <el-form-item> prop="studentNo"
L17 <el-input> v-model="form.studentNo" :prefix-icon="User"
L19 <el-form-item> prop="nickname"
L20 <el-input> v-model="form.nickname" :prefix-icon="Avatar"
L22 <el-form-item> prop="password"
L23 <el-input> v-model="form.password" type="password" show-password :prefix-icon="Lock"
L25 <el-form-item> prop="confirm"
L26 <el-input> v-model="form.confirm" type="password" show-password :prefix-icon="Lock"
L28 <el-form-item> prop="captchaCode"
L30 <el-input> v-model="form.captchaCode" :placeholder="captchaMode === 'math' ? '输入运算结果' : '4位验证码'" :maxlength="captchaMode === 'math' ? 3 : 4" @keyup.enter="submit"
L33 <img> v-if="captchaMode !== 'math'" :src="captchaImage" @click="loadCaptcha"
L35 <div> v-else @click="loadCaptcha"
L38 <el-button> type="primary" :loading="loading" @click="submit"
L41 <router-link> to="/login"
```

**展示数据与动态文案（不得丢失）：**

```text
L35 captchaExpression
```

**冻结的脚本处理器/生命周期锚点：**

```js
L87 async function loadCaptcha() {
L96 async function submit() {
L118 onMounted(loadCaptcha)
```

### 26. 失物详情与认领归还

源文件：`web/frontend/student/src/views/lostfound/Detail.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/lostfound/Detail.vue:1) · 脚本 [L127](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/lostfound/Detail.vue:127) · 样式 [L286](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/lostfound/Detail.vue:286), [L327](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/lostfound/Detail.vue:327)。

**具体视觉重排：** `.layout` 改图库在上、信息在下，地点/时间/联系方式横向摘要，认领进度独立提示条，动作区全宽；申请、认领管理、举报三个弹窗统一视觉。

**功能、状态和边界：** 保留失物/招领类型、完成状态、描述、作者主页、收藏、非本人私信/举报。所有者未完成时标记完成/编辑，且type1时认领申请管理；非本人type1/status0/无myClaim才申请；myClaim.status1才确认已找回；待确认/同意待归还/拒绝/已归还各状态不得丢。申请message255/contact64至少填一项；管理名单10条分页、只对status0同意/拒绝、等待确认和已处理，claim计数、loading；确认归还后刷新、举报类型与500字原因保持。

**可编辑的现有结构类：** `.detail` L4；`.layout` L6；`.gallery` L7；`.info` L15；`.kv` L23；`.desc` L25；`.contact` L26；`.publisher` L29；`.actions` L42；`.claim-pager` L98。

**原样保留的模板契约：**

```vue
L4 <div> v-loading="loading"
L5 <el-card> v-if="lf"
L8 <el-carousel> v-if="detailImages.length" :arrow="detailImages.length > 1 ? 'hover' : 'never'"
L9 <el-carousel-item> v-for="img in detailImages" :key="img"
L10 <el-image> :src="img" :preview-src-list="detailImages"
L13 <el-empty> v-else :image-size="80"
L17 <el-tag> :type="lf.type === 0 ? 'danger' : 'success'"
L22 <el-tag> v-if="lf.status === 1" type="info"
L29 <div> @click="goUser(lf.userId)"
L30 <el-avatar> :size="36" :src="lf.publisherAvatar"
L35 <el-alert> v-if="!lf.isOwner && myClaim" :type="myClaim.status === 1 ? 'success' : 'warning'" :closable="false"
L37 <template> #title
L43 <el-button> v-if="lf.isOwner && lf.status === 0" type="success" @click="finish"
L44 <el-button> v-if="lf.isOwner && lf.status === 0" type="primary" @click="editInfo"
L45 <el-button> v-if="lf.isOwner && lf.type === 1 && lf.status === 0" type="warning" @click="openClaims"
L46 <el-badge> v-if="claims.length" :value="claims.filter(c => c.status === 0).length"
L48 <el-button> v-if="!lf.isOwner && lf.type === 1 && lf.status === 0 && !myClaim" type="primary" @click="claimVisible = true"
L50 <el-button> v-if="!lf.isOwner && myClaim && myClaim.status === 1" type="success" @click="confirmReturn"
L51 <el-button> v-if="!lf.isOwner" type="primary" @click="contactPublisher"
L52 <el-button> v-if="!lf.isOwner" type="warning" @click="reportVisible = true"
L53 <el-button> :type="favorited ? 'warning' : 'default'" @click="toggleFavorite"
L62 <el-dialog> v-model="claimVisible"
L64 <el-input> v-model="claimForm.message" type="textarea" :rows="3" maxlength="255"
L65 <el-input> v-model="claimForm.contact" maxlength="64"
L66 <template> #footer
L67 <el-button> @click="claimVisible = false"
L68 <el-button> type="primary" :loading="claiming" @click="doClaim"
L73 <el-dialog> v-model="claimsVisible" destroy-on-close
L74 <el-table> :data="claims" v-loading="claimsLoading"
L75 <el-table-column> prop="claimNickname" label="申请人"
L76 <el-table-column> prop="message" label="认领说明"
L77 <el-table-column> prop="contact" label="联系方式"
L78 <el-table-column> label="申请时间"
L79 <template> #default="{ row }"
L81 <el-table-column> label="状态"
L82 <template> #default="{ row }"
L83 <el-tag> :type="['warning','success','danger','info'][row.status]"
L86 <el-table-column> label="操作"
L87 <template> #default="{ row }"
L88 <template> v-if="row.status === 0"
L89 <el-button> type="success" @click="doHandleClaim(row, true)"
L90 <el-button> type="danger" @click="doHandleClaim(row, false)"
L92 <span> v-else-if="row.status === 1"
L93 <span> v-else
L97 <el-empty> v-if="!claimsLoading && !claims.length"
L98 <div> v-if="claimTotal > claimPageSize"
L99 <el-pagination> layout="prev, pager, next" :total="claimTotal" :page-size="claimPageSize" :current-page="claimPage" @current-change="onClaimPageChange"
L111 <el-dialog> v-model="reportVisible"
L112 <el-select> v-model="reasonType"
L113 <el-option> label="虚假/欺诈信息" value="欺诈"
L114 <el-option> label="违规内容" value="违规"
L115 <el-option> label="广告骚扰" value="广告"
L116 <el-option> label="其他" value="其他"
L118 <el-input> v-model="reason" type="textarea" :rows="3" maxlength="500"
L119 <template> #footer
L120 <el-button> @click="reportVisible = false"
L121 <el-button> type="primary" @click="doReport"
```

**展示数据与动态文案（不得丢失）：**

```text
L18 lf.type === 0 ? '失物' : '招领'
L20 lf.title
L23 lf.location || '未填写'
L24 formatTime(lf.happenTime) || '未填写'
L25 lf.description
L27 lf.contact || '请通过消息联系发布者'
L30 lf.publisherNickname?.charAt(0)
L31 lf.publisherNickname
L38 claimStatusText(myClaim.status)
L54 favorited ? '★ 已收藏' : '☆ 收藏'
L79 formatTime(row.createTime)
L83 claimStatusText(row.status)
```

**冻结的脚本处理器/生命周期锚点：**

```js
L171 async function load() {
L188 async function toggleFavorite() {
L204 async function finish() {
L210 function editInfo() {
L214 async function loadClaims(page = claimPage.value) {
L226 function onClaimPageChange(page) {
L230 async function openClaims() {
L235 async function doClaim() {
L251 async function doHandleClaim(row, accept) {
L257 async function confirmReturn() {
L263 function goUser(id) {
L269 async function contactPublisher() {
L273 async function doReport() {
L283 onMounted(load)
```

### 27. 失物与招领列表

源文件：`web/frontend/student/src/views/lostfound/List.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/lostfound/List.vue:1) · 脚本 [L45](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/lostfound/List.vue:45) · 样式 [L117](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/lostfound/List.vue:117)。

**具体视觉重排：** `.lf-list` 顶部类型胶囊与搜索横排，发布按钮靠右；图片卡片按原型浅底和深绿文字重排，寻物/招领分别有文字标签，保留地点/时间。

**功能、状态和边界：** 保留 undefined全部/0寻物/1招领、selectType、关键词Enter/清空、goPublish 登录判断、详情跳转、firstContentImage(lf,'lost')、12条分页、q与列表状态恢复、loadError重试及正确空态。不把两种业务合并成一种发布。

**可编辑的现有结构类：** `.load-error` L2；`.text-btn` L2；`.lf-list` L5；`.toolbar` L6；`.chips` L7；`.chip` L8；`.spacer` L15；`.grid` L19；`.badge-tag` L30；`.card-footer` L33。

**原样保留的模板契约：**

```vue
L2 <div> v-if="loadError" role="alert"
L2 <button> type="button" @click="load"
L8 <span> :class="{ active: type === undefined }" @click="selectType(undefined)"
L9 <span> :class="{ active: type === 0 }" @click="selectType(0)"
L10 <span> :class="{ active: type === 1 }" @click="selectType(1)"
L12 <el-input> v-model="keyword" clearable @keyup.enter="search" @clear="search"
L13 <template> #append
L13 <el-button> @click="search"
L16 <el-button> type="primary" @click="goPublish"
L19 <div> v-loading="loading"
L20 <ItemCard> v-for="lf in list" :key="lf.id" :cover="firstContentImage(lf, 'lost')" :title="lf.title" :desc="lf.description" :time="lf.createTime" @click="$router.push(`/lostfound/detail/${lf.id}`)"
L29 <template> #badge
L30 <span> :class="lf.type === 0 ? 'tag-error' : 'tag-success'"
L32 <template> #footer
L39 <EmptyBox> v-if="!loadError && !loading && !list.length"
L40 <el-pagination> v-model:current-page="pageNum" :total="total" :page-size="12" layout="prev, pager, next" @current-change="load"
```

**展示数据与动态文案（不得丢失）：**

```text
L2 loadError
L30 lf.type === 0 ? '寻物' : '招领'
L34 lf.location || '未知地点'
```

**冻结的脚本处理器/生命周期锚点：**

```js
L69 function selectType(t) {
L74 function search() {
L79 async function load() {
L93 function goPublish() {
L103 watch(
```

### 28. 失物发布编辑与AI匹配

源文件：`web/frontend/student/src/views/lostfound/Publish.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/lostfound/Publish.vue:1) · 脚本 [L75](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/lostfound/Publish.vue:75) · 样式 [L156](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/lostfound/Publish.vue:156)。

**具体视觉重排：** 发布页纵向安排类型选择、基础信息、地点时间联系、图片、提交，再接淡黄 AI 匹配区；匹配结果是完整内容卡，不藏入侧栏。

**功能、状态和边界：** 保留 query.id、form.type(0/1)、title64、description/location/happenTime/contact/images6图、AiAssistPanel(lostfound) 的applyAssist；新建且type0才显示 lostMatch，标题空禁用、matching和matchedDone、原因/地点/时间/作者、去看看详情入口、无匹配结果。编辑回填、日期格式、重新审核、submit后/lostfound、取消返回均冻结。

**可编辑的现有结构类：** `.publish` L4；`.match-head` L43；`.match-tip` L45；`.match-list` L55；`.match-card` L56；`.match-card__main` L57；`.match-reason` L59；`.match-meta` L60。

**原样保留的模板契约：**

```vue
L2 <WtPageHeader> :title="editId ? '编辑信息' : '发布招领'" :subtitle="editId ? '修改信息，保存后重新进入审核' : '帮物品找到它的主人'"
L6 <template> #header
L7 <el-alert> type="info" :closable="false"
L8 <AiAssistPanel> :type="'lostfound'" @fill="applyAssist"
L9 <el-form> :model="form"
L10 <el-form-item> label="类型"
L11 <el-radio-group> v-model="form.type"
L12 <el-radio> :value="0"
L13 <el-radio> :value="1"
L16 <el-form-item> label="标题"
L17 <el-input> v-model="form.title" maxlength="64" show-word-limit
L19 <el-form-item> label="描述"
L20 <el-input> v-model="form.description" type="textarea" :rows="4"
L22 <el-form-item> label="地点"
L23 <el-input> v-model="form.location"
L25 <el-form-item> label="发生时间"
L26 <el-date-picker> v-model="form.happenTime" type="datetime"
L28 <el-form-item> label="联系方式"
L29 <el-input> v-model="form.contact"
L31 <el-form-item> label="图片"
L32 <UploadImg> v-model="form.images" :max="6"
L35 <el-button> type="primary" :loading="submitting" @click="submit"
L36 <el-button> @click="$router.back()"
L41 <template> v-if="form.type === 0 && !editId"
L47 <el-button> type="success" :loading="matching" :disabled="!form.title.trim()" @click="doMatch"
L55 <div> v-if="matches.length"
L56 <div> v-for="m in matches" :key="m.id"
L61 <span> v-if="m.location"
L62 <span> v-if="m.happenTime"
L63 <span> v-if="m.publisherNickname"
L66 <el-button> type="primary" @click="router.push(`/lostfound/detail/${m.id}`)"
L69 <el-empty> v-else-if="matchedDone" :image-size="70"
```

**展示数据与动态文案（不得丢失）：**

```text
L53 matching ? 'AI 匹配中…' : '帮我找找（AI 匹配）'
L58 m.title
L59 m.reason
L61 m.location
L62 m.happenTime.replace('T', ' ')
L63 m.publisherNickname
```

**冻结的脚本处理器/生命周期锚点：**

```js
L93 onMounted(async () => {
L110 function applyAssist(data) {
L116 async function doMatch() {
L135 async function submit() {
```

### 29. 维护状态

源文件：`web/frontend/student/src/views/Maintenance.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/Maintenance.vue:1) · 脚本 [L13](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/Maintenance.vue:13) · 样式 [L32](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/Maintenance.vue:32)。

**具体视觉重排：** `.maintenance-page` 用淡青全屏背景，居中白色圆角状态卡，深绿标题与重试按钮、轻量工具图形；此页不显示无意义侧栏。

**功能、状态和边界：** 保留siteName、checkStatus对/home/aggregate的silent请求，恢复后去首页、仍503时停在本页。只改样式，不让重试绕过维护状态，也不虚构恢复时间。

**可编辑的现有结构类：** `.maintenance-page` L2；`.maintenance-card` L3；`.icon` L4；`.subtitle` L6；`.desc` L7。

**原样保留的模板契约：**

```vue
L8 <el-button> type="primary" @click="checkStatus"
```

**展示数据与动态文案（不得丢失）：**

```text
L6 siteName
```

**冻结的脚本处理器/生命周期锚点：**

```js
L21 async function checkStatus() {
```

### 30. 系统消息中心

源文件：`web/frontend/student/src/views/message/MessageCenter.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/message/MessageCenter.vue:1) · 脚本 [L56](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/message/MessageCenter.vue:56) · 样式 [L129](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/message/MessageCenter.vue:129), [L202](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/message/MessageCenter.vue:202)。

**具体视觉重排：** 明确拆除 `.msg-sidebar` 侧栏排版：msgTypes 改页头横向胶囊，私信入口与未读徽标放同排；`.msg-detail` 全宽，全部已读按钮在标题右侧，消息标题/内容/时间纵向行卡。

**功能、状态和边界：** 保留全部/system/interact/audit类型、selectType页码复位、messageStore统计徽标、chatStore.unreadTotal、私信/chat入口；10条分页、loading/空态、未读点和unread样式、openMsg先markRead并更新未读再按messageTarget跳转；readAll的markAllRead、列表刷新、统计刷新保持，不因视觉改为点击即本地清零。

**可编辑的现有结构类：** `.message-center` L4；`.msg-sidebar` L6；`.card` L6；`.msg-sidebar-title` L7；`.msg-side-item` L12；`.private` L19；`.msg-detail` L26；`.msg-detail-head` L27；`.msg-list` L31；`.msg-item` L35；`.m-icon` L40；`.m-body` L42；`.m-title` L43；`.m-content` L44；`.m-time` L46。

**原样保留的模板契约：**

```vue
L8 <button> v-for="t in msgTypes" :key="t.value" type="button" :class="{ active: type === t.value }" @click="selectType(t.value)"
L17 <el-badge> v-if="t.badge !== undefined" :value="t.badge" :hidden="!t.badge"
L19 <button> type="button" @click="router.push('/chat')"
L21 <el-badge> :value="chatStore.unreadTotal" :hidden="!chatStore.unreadTotal"
L29 <el-button> @click="readAll"
L31 <div> v-loading="loading"
L32 <div> v-for="m in list" :key="m.id" :class="{ unread: m.isRead === 0 }" @click="openMsg(m)"
L39 <el-badge> :hidden="m.isRead === 1"
L48 <EmptyBox> v-if="!loading && !list.length"
L50 <el-pagination> v-model:current-page="pageNum" :total="total" :page-size="10" layout="prev, pager, next" @current-change="load"
```

**展示数据与动态文案（不得丢失）：**

```text
L16 t.label
L28 currentLabel
L40 iconOf(m.type)
L43 m.title
L44 m.content
L46 fromNow(m.createTime)
```

**冻结的脚本处理器/生命周期锚点：**

```js
L87 function selectType(t) {
L92 function search() {
L97 async function load() {
L110 async function openMsg(m) {
L120 async function readAll() {
L126 onMounted(load)
```

### 31. 公告正文

源文件：`web/frontend/student/src/views/notice/Detail.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/notice/Detail.vue:1) · 脚本 [L15](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/notice/Detail.vue:15) · 样式 [L37](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/notice/Detail.vue:37)。

**具体视觉重排：** `.notice-detail` 改居中阅读卡，标题深绿、发布时间弱化、正文留足行距；代码块/表格横滚不撑破卡片。

**功能、状态和边界：** 保留route.params.id、noticeDetail请求、loading、notice条件、formatTime和renderMarkdown(notice.content)；不得用原型占位文案代替后台公告，不能删Markdown图片、表格、代码块等渲染能力。

**可编辑的现有结构类：** `.notice-detail` L4；`.title` L6；`.time` L7；`.md-body` L10。

**原样保留的模板契约：**

```vue
L4 <div> v-loading="loading"
L5 <el-card> v-if="notice"
L10 <div> v-html="renderMarkdown(notice.content)"
```

**展示数据与动态文案（不得丢失）：**

```text
L6 notice.title
L7 formatTime(notice.publishTime)
```

**冻结的脚本处理器/生命周期锚点：**

```js
L27 onMounted(async () => {
```

### 32. 公告列表

源文件：`web/frontend/student/src/views/notice/List.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/notice/List.vue:1) · 脚本 [L33](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/notice/List.vue:33) · 样式 [L65](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/notice/List.vue:65)。

**具体视觉重排：** `.notice-list .list-page` 为全宽公告行卡，公告标记、标题、发布时间与箭头形成清晰层次，取消任何导航侧栏。

**功能、状态和边界：** 保留notice/detail跳转、publishTime格式、10条分页、useListState、loading、loadError重试与不重叠空态；不添加源码不存在的类别筛选、已读状态或附件操作。

**可编辑的现有结构类：** `.load-error` L2；`.text-btn` L2；`.notice-list` L5；`.list-page` L6；`.notice-card` L10；`.card` L10；`.card-hover` L10；`.tag` L13；`.tag-brand` L13；`.notice-main` L14；`.n-title` L15；`.n-meta` L16；`.n-arrow` L18。

**原样保留的模板契约：**

```vue
L2 <div> v-if="loadError" role="alert"
L2 <button> type="button" @click="load"
L6 <div> v-loading="loading"
L7 <div> v-for="n in list" :key="n.id" @click="$router.push(`/notice/detail/${n.id}`)"
L20 <EmptyBox> v-if="!loadError && !loading && !list.length"
L21 <el-pagination> v-model:current-page="pageNum" :total="total" :page-size="10" layout="prev, pager, next" @current-change="load"
```

**展示数据与动态文案（不得丢失）：**

```text
L2 loadError
L15 n.title
L16 formatTime(n.publishTime)
```

**冻结的脚本处理器/生命周期锚点：**

```js
L48 async function load() {
L62 onMounted(load)
```

### 33. 学习搭子列表

源文件：`web/frontend/student/src/views/partner/List.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/partner/List.vue:1) · 脚本 [L39](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/partner/List.vue:39) · 样式 [L99](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/partner/List.vue:99)。

**具体视觉重排：** `.partner-list` 顶部全宽搜索和发布按钮，`.p-card` 采用浅青卡片配学科大标题、目标淡黄标签，时间安排/联系方式/发布人置下方，不设置个人侧栏。

**功能、状态和边界：** 保留keyword搜索/清空/Enter、12条分页、loadError重试、useListState、登录后发布；subject、goal、intro、schedule、contact、publisherNickname全部展示。goDetail实际进入发布者主页，自己的条目去profile，缺userId不跳；禁止编造不存在的搭子详情路由。

**可编辑的现有结构类：** `.load-error` L2；`.text-btn` L2；`.partner-list` L5；`.toolbar` L6；`.spacer` L10；`.grid` L14；`.p-card` L15；`.p-card__head` L16；`.goal` L18；`.intro` L20；`.meta` L21。

**原样保留的模板契约：**

```vue
L2 <div> v-if="loadError" role="alert"
L2 <button> type="button" @click="load"
L7 <el-input> v-model="keyword" clearable @keyup.enter="search" @clear="search"
L8 <template> #append
L8 <el-button> @click="search"
L11 <el-button> type="primary" @click="goPublish"
L14 <div> v-loading="loading"
L15 <div> v-for="p in list" :key="p.id" @click="goDetail(p)"
L18 <span> v-if="p.goal"
L20 <p> v-if="p.intro"
L22 <span> v-if="p.schedule"
L23 <span> v-if="p.contact"
L24 <span> v-if="p.publisherNickname"
L28 <EmptyBox> v-if="!loadError && !loading && !list.length"
L29 <el-pagination> v-model:current-page="pageNum" :total="total" :page-size="12" layout="prev, pager, next" @current-change="load"
```

**展示数据与动态文案（不得丢失）：**

```text
L2 loadError
L17 p.subject
L18 p.goal
L20 p.intro
L22 p.schedule
L23 p.contact
L24 p.publisherNickname
```

**冻结的脚本处理器/生命周期锚点：**

```js
L59 function search() {
L64 async function load() {
L78 function goPublish() {
L87 function goDetail(p) {
```

### 34. 搭子信息与AI匹配

源文件：`web/frontend/student/src/views/partner/Publish.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/partner/Publish.vue:1) · 脚本 [L62](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/partner/Publish.vue:62) · 样式 [L123](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/partner/Publish.vue:123)。

**具体视觉重排：** 表单与AI匹配结果上下排列，subject/goal/schedule 可在宽屏同行，intro/contact 保持全宽；建议匹配为淡黄卡。

**功能、状态和边界：** 保留subject32字、goal64、schedule64、intro/contact及提交审核/取消；subject必填、trim数据、成功/partner；AI匹配独立doMatch，subject空禁用、matching、matchedDone、返回数组/list兼容、reason/goal/schedule/contact/昵称和空结果。源码无AI文案助手、无结果私信按钮，不凭视觉追加业务。

**可编辑的现有结构类：** `.publish` L4；`.match-head` L31；`.match-tip` L33；`.match-list` L43；`.match-card` L44；`.match-card__main` L45；`.match-reason` L47；`.match-meta` L48。

**原样保留的模板契约：**

```vue
L6 <template> #header
L7 <el-alert> type="info" :closable="false"
L8 <el-form> :model="form"
L9 <el-form-item> label="科目/领域"
L10 <el-input> v-model="form.subject" maxlength="32" show-word-limit
L12 <el-form-item> label="目标"
L13 <el-input> v-model="form.goal" maxlength="64"
L15 <el-form-item> label="可搭时间"
L16 <el-input> v-model="form.schedule" maxlength="64"
L18 <el-form-item> label="自我介绍"
L19 <el-input> v-model="form.intro" type="textarea" :rows="3"
L21 <el-form-item> label="联系方式"
L22 <el-input> v-model="form.contact"
L25 <el-button> type="primary" :loading="submitting" @click="submit"
L26 <el-button> @click="$router.back()"
L35 <el-button> type="success" :loading="matching" :disabled="!form.subject.trim()" @click="doMatch"
L43 <div> v-if="matches.length"
L44 <div> v-for="m in matches" :key="m.id"
L47 <span> v-if="m.reason"
L49 <span> v-if="m.goal"
L50 <span> v-if="m.schedule"
L51 <span> v-if="m.contact"
L52 <span> v-if="m.publisherNickname"
L57 <el-empty> v-else-if="matchedDone" :image-size="70"
```

**展示数据与动态文案（不得丢失）：**

```text
L41 matching ? 'AI 匹配中…' : '帮我找搭子（AI 匹配）'
L46 m.subject
L47 m.reason
L49 m.goal
L50 m.schedule
L51 m.contact
L52 m.publisherNickname
```

**冻结的脚本处理器/生命周期锚点：**

```js
L76 async function submit() {
L97 async function doMatch() {
```

### 35. 个人中心与自主管理

源文件：`web/frontend/student/src/views/profile/Profile.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/profile/Profile.vue:1) · 脚本 [L165](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/profile/Profile.vue:165) · 样式 [L309](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/profile/Profile.vue:309)。

**具体视觉重排：** `.profile-banner` 改全宽用户名片，编辑资料/改密右侧横向按钮；`.profile-summary` 以两组数字卡排列；`.profile-management` 的五个标签横向置顶，表格全宽，不能迁移为左侧账户菜单。

**功能、状态和边界：** 保留idle/signup/wrong/favorite/report及query.tab初始选择，学号/手机号/昵称/头像/简介标记、统计数据来源不变；我的闲置审核状态/驳回理由/业务状态，编辑、下架、下架后重新上架、已完成不可操作；活动和错题入口；收藏类型/标题/时间/取消，内容已删除时无链接；举报对象/原因/处理状态/回复/时间全部保留。资料nickname32、avatarList最多1图、gender0/1/2、phone11、bio255，保存后refresh；改密old/new及完整性校验、共用saving。原列表固定pageSize50、无分页UI；不可假装已完成分页或顺手修统计名称/收藏路由问题。

**可编辑的现有结构类：** `.profile` L4；`.profile-banner` L6；`.banner-avatar` L7；`.banner-info` L8；`.banner-id` L10；`.banner-tags` L11；`.banner-tag` L12；`.tag-brand` L12；`.tag-success` L13；`.tag-info` L14；`.banner-ops` L17；`.profile-summary` L23；`.summary-group` L24；`.summary-items` L26；`.summary-item` L27；`.profile-management` L42。

**原样保留的模板契约：**

```vue
L6 <section> aria-label="个人资料"
L7 <el-avatar> :size="76" :src="user?.avatar"
L12 <span> v-if="user?.avatar"
L13 <span> v-if="user?.phone"
L14 <span> v-if="user?.bio"
L18 <el-button> @click="editVisible = true"
L19 <el-button> @click="pwdVisible = true"
L23 <section> aria-label="个人数据概览"
L43 <el-tabs> v-model="tab"
L44 <el-tab-pane> label="我的闲置" name="idle"
L45 <el-table> :data="myIdle"
L46 <el-table-column> prop="title" label="标题"
L47 <template> #default="{ row }"
L48 <router-link> :to="`/idle/detail/${row.id}`"
L51 <el-table-column> label="审核"
L52 <template> #default="{ row }"
L53 <el-tag> :type="['warning','success','danger'][row.auditStatus]"
L58 <el-table-column> label="状态"
L59 <template> #default="{ row }"
L61 <el-table-column> label="操作"
L62 <template> #default="{ row }"
L63 <template> v-if="row.status !== 3 && row.status !== 2"
L64 <el-button> type="primary" @click="editIdle(row)"
L65 <el-button> type="danger" @click="offlineIdle(row)"
L67 <el-button> v-if="row.status === 3" type="success" @click="relistIdle(row)"
L68 <span> v-if="row.status === 2"
L73 <el-tab-pane> label="我的报名" name="signup"
L74 <el-button> type="primary" @click="$router.push('/activity/my-signup')"
L76 <el-tab-pane> label="错题本" name="wrong"
L77 <el-button> type="primary" @click="$router.push('/ai/wrong')"
L79 <el-tab-pane> label="我的收藏" name="favorite"
L80 <div> v-loading="favLoading"
L81 <el-table> :data="myFavList" v-if="myFavList.length"
L82 <el-table-column> label="类型"
L83 <template> #default="{ row }"
L87 <el-table-column> prop="title" label="标题"
L88 <template> #default="{ row }"
L89 <router-link> :to="`/${row.targetType === 'idle' ? 'idle' : row.targetType === 'activity' ? 'activity' : row.targetType === 'lostfound' ? 'lostfound' : 'social'}/${row.targetType === 'post' ? '?id=' : 'detail/'}${row.targetType === 'post' ? '' : row.targetId}`" v-if="row.title !== '内容已删除'"
L90 <span> v-else
L93 <el-table-column> prop="createTime" label="收藏时间"
L94 <template> #default="{ row }"
L96 <el-table-column> label="操作"
L97 <template> #default="{ row }"
L98 <el-button> type="danger" @click="removeFav(row)"
L102 <EmptyBox> v-else-if="!favLoading"
L105 <el-tab-pane> label="我的举报" name="report"
L106 <div> v-loading="reportLoading"
L107 <el-table> v-if="myReports.length" :data="myReports"
L108 <el-table-column> label="对象"
L109 <template> #default="{ row }"
L111 <el-table-column> prop="reason" label="举报说明"
L112 <el-table-column> label="状态"
L113 <template> #default="{ row }"
L114 <el-tag> :type="row.status === 1 ? 'success' : 'warning'"
L117 <el-table-column> prop="handleResult" label="处理结果"
L118 <el-table-column> prop="createTime" label="提交时间"
L119 <template> #default="{ row }"
L122 <EmptyBox> v-else-if="!reportLoading"
L129 <el-dialog> v-model="editVisible"
L130 <el-form> :model="editForm"
L131 <el-form-item> label="昵称"
L131 <el-input> v-model="editForm.nickname" maxlength="32"
L132 <el-form-item> label="头像"
L133 <UploadImg> v-model="avatarList" :max="1"
L135 <el-form-item> label="性别"
L136 <el-radio-group> v-model="editForm.gender"
L137 <el-radio> :value="0"
L138 <el-radio> :value="1"
L139 <el-radio> :value="2"
L142 <el-form-item> label="手机号"
L142 <el-input> v-model="editForm.phone" maxlength="11"
L143 <el-form-item> label="简介"
L143 <el-input> v-model="editForm.bio" type="textarea" :rows="2" maxlength="255"
L145 <template> #footer
L146 <el-button> @click="editVisible = false"
L147 <el-button> type="primary" :loading="saving" @click="saveProfile"
L152 <el-dialog> v-model="pwdVisible"
L153 <el-form> :model="pwdForm"
L154 <el-form-item> label="原密码"
L154 <el-input> v-model="pwdForm.oldPassword" type="password" show-password
L155 <el-form-item> label="新密码"
L155 <el-input> v-model="pwdForm.newPassword" type="password" show-password
L157 <template> #footer
L158 <el-button> @click="pwdVisible = false"
L159 <el-button> type="primary" :loading="saving" @click="savePassword"
```

**展示数据与动态文案（不得丢失）：**

```text
L7 user?.nickname?.charAt(0)
L9 user?.nickname
L10 user?.studentNo || '未绑定'
L10 user?.phone ? '手机 ' + user?.phone : '未绑定手机'
L27 myIdle.length
L28 wrongStatsData.total ?? 0
L29 conversationCount
L35 wrongStatsData.pending ?? 0
L36 wrongStatsData.mastered ?? 0
L37 wrongStatsData.weekReviewCount ?? 0
L48 row.title
L54 ['待审核','已通过','已驳回'][row.auditStatus]
L59 ['在架','已预约','已完成','已下架'][row.status]
L84 { activity: '活动', idle: '闲置', lostfound: '失物', post: '动态' }[row.targetType] || row.targetType
L94 (row.createTime || '').replace('T', ' ').slice(0, 16)
L109 reportTargetText(row)
L114 row.status === 1 ? '已处理' : '待处理'
```

**冻结的脚本处理器/生命周期锚点：**

```js
L202 watch(tab, (v) => {
L207 async function loadFavorites() {
L217 async function removeFav(row) {
L223 async function loadReports() {
L233 function reportTargetText(row) {
L238 onMounted(async () => {
L258 async function loadMyIdle() {
L263 async function offlineIdle(row) {
L269 function editIdle(row) {
L273 async function relistIdle(row) {
L279 async function saveProfile() {
L291 async function savePassword() {
```

### 36. 问题、AI参考与最佳回答

源文件：`web/frontend/student/src/views/qa/Detail.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/qa/Detail.vue:1) · 脚本 [L61](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/qa/Detail.vue:61) · 样式 [L152](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/qa/Detail.vue:152), [L179](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/qa/Detail.vue:179)。

**具体视觉重排：** `.detail` 纵向为问题大卡、淡黄AI参考卡、回答列表和答题输入；采纳按钮与回答同行，不放侧栏。最佳回答用深绿细边和显式已采纳标识。

**功能、状态和边界：** 保留问题分类/状态/内容/发布信息，askAi 登录判断与aiLoading/aiText、答案空态、回答昵称/时间/内容、10条回答分页。仅question.isOwner且status0且答案未采纳可accept；仅非所有者展示回答输入；answerText为空校验、登录跳转、提交后清空并刷新第1页、采纳刷新当前页、加载失败router.back不改。AI文本当前普通文本显示，不擅改生成/请求协议。

**可编辑的现有结构类：** `.detail` L2；`.q-head` L5；`.cat` L6；`.solved` L8；`.pending` L9；`.q-content` L12；`.q-meta` L13；`.tip` L22；`.ai-box` L24；`.answer` L30；`.answer__head` L31；`.who` L32；`.accept-tag` L33；`.time` L34；`.answer__content` L36；`.answer__ops` L37；`.answer-pager` L41；`.answer-form` L53。

**原样保留的模板契约：**

```vue
L2 <div> v-if="question"
L4 <template> #header
L8 <span> v-if="question.status === 1"
L9 <span> v-else
L21 <template> #header
L23 <el-button> type="primary" :loading="aiLoading" @click="askAi"
L24 <div> v-if="aiText"
L28 <template> #header
L29 <div> v-if="!answers.length"
L30 <div> v-for="a in answers" :key="a.id" :class="{ accepted: a.isAccepted === 1 }"
L33 <span> v-if="a.isAccepted === 1"
L37 <div> v-if="question.isOwner && question.status === 0 && a.isAccepted !== 1"
L38 <el-button> type="success" @click="accept(a.id)"
L41 <div> v-if="answerTotal > answerPageSize"
L42 <el-pagination> layout="prev, pager, next" :total="answerTotal" :page-size="answerPageSize" :current-page="answerPage" @current-change="onAnswerPageChange"
L52 <el-divider> v-if="!question.isOwner || question.status === 0"
L53 <div> v-if="!question.isOwner"
L54 <el-input> v-model="answerText" type="textarea" :rows="3"
L55 <el-button> type="primary" :loading="answering" @click="submitAnswer"
```

**展示数据与动态文案（不得丢失）：**

```text
L6 question.category
L7 question.title
L12 question.content || '（无补充描述）'
L14 question.publisherNickname
L15 question.viewCount
L16 String(question.createTime).slice(0, 16)
L24 aiText
L28 answerTotal
L32 a.answererNickname
L34 String(a.createTime).slice(0, 16)
L36 a.content
```

**冻结的脚本处理器/生命周期锚点：**

```js
L81 async function load(page = answerPage.value) {
L94 function onAnswerPageChange(page) {
L98 onMounted(load)
L100 async function askAi() {
L116 async function submitAnswer() {
L140 async function accept(answerId) {
```

### 37. 互助问答列表

源文件：`web/frontend/student/src/views/qa/List.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/qa/List.vue:1) · 脚本 [L47](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/qa/List.vue:47) · 样式 [L105](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/qa/List.vue:105)。

**具体视觉重排：** `.qa-list` 改全宽问答行卡，分类胶囊放搜索下方，待答/已解决靠标题，作者/回答数/时间排成底部元信息；我的提问和我要提问顶部并列。

**功能、状态和边界：** 保留五类课程/考试/技术/生活/其他加全部、关键词Enter/清空、搜索复位页码、12条分页、useListState、加载/错误重试/无结果、详情路由、发布登录判断；标题和补充内容不能为了卡片高度隐藏成不可访问信息。

**可编辑的现有结构类：** `.load-error` L2；`.text-btn` L2；`.qa-list` L5；`.toolbar` L6；`.chips` L10；`.chip` L11；`.spacer` L14；`.q-list` L19；`.q-card` L20；`.q-card__top` L21；`.cat` L22；`.title` L23；`.solved` L24；`.pending` L25；`.content` L27；`.meta` L28。

**原样保留的模板契约：**

```vue
L2 <div> v-if="loadError" role="alert"
L2 <button> type="button" @click="load"
L7 <el-input> v-model="keyword" clearable @keyup.enter="search" @clear="search"
L8 <template> #append
L8 <el-button> @click="search"
L11 <span> :class="{ active: category === '' }" @click="selectCategory('')"
L12 <span> v-for="c in categories" :key="c" :class="{ active: category === c }" @click="selectCategory(c)"
L15 <el-button> @click="$router.push('/qa/my')"
L16 <el-button> type="primary" @click="goPublish"
L19 <div> v-loading="loading"
L20 <div> v-for="q in list" :key="q.id" @click="$router.push(`/qa/detail/${q.id}`)"
L24 <span> v-if="q.status === 1"
L25 <span> v-else
L27 <p> v-if="q.content"
L36 <EmptyBox> v-if="!loadError && !loading && !list.length"
L37 <el-pagination> v-model:current-page="pageNum" :total="total" :page-size="12" layout="prev, pager, next" @current-change="load"
```

**展示数据与动态文案（不得丢失）：**

```text
L2 loadError
L12 c
L22 q.category
L23 q.title
L27 q.content
L29 q.publisherNickname
L30 q.answerCount
L31 q.viewCount
L32 String(q.createTime).slice(0, 16)
```

**冻结的脚本处理器/生命周期锚点：**

```js
L69 function selectCategory(c) {
L74 function search() {
L79 async function load() {
L93 function goPublish() {
```

### 38. 我的问题

源文件：`web/frontend/student/src/views/qa/My.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/qa/My.vue:1) · 脚本 [L31](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/qa/My.vue:31) · 样式 [L56](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/qa/My.vue:56)。

**具体视觉重排：** `.q-list` 改全宽卡片列表，分类、标题、待答/已解决与时间/回答数一并保留；页头轻量，无侧栏。

**功能、状态和边界：** 保留myQuestion、12条分页、loading、空态以及每题到qa/detail的整卡点击。页面没有删除或编辑入口，不能凭原型补出无法接入的操作。

**可编辑的现有结构类：** `.qa-list` L4；`.q-list` L5；`.q-card` L6；`.q-card__top` L7；`.cat` L8；`.title` L9；`.solved` L10；`.pending` L11；`.meta` L13。

**原样保留的模板契约：**

```vue
L5 <div> v-loading="loading"
L6 <div> v-for="q in list" :key="q.id" @click="$router.push(`/qa/detail/${q.id}`)"
L10 <span> v-if="q.status === 1"
L11 <span> v-else
L20 <EmptyBox> v-if="!loading && !list.length"
L21 <el-pagination> v-model:current-page="pageNum" :total="total" :page-size="12" layout="prev, pager, next" @current-change="load"
```

**展示数据与动态文案（不得丢失）：**

```text
L8 q.category
L9 q.title
L14 q.answerCount
L15 q.viewCount
L16 String(q.createTime).slice(0, 16)
```

**冻结的脚本处理器/生命周期锚点：**

```js
L42 async function load() {
```

### 39. 发布问题

源文件：`web/frontend/student/src/views/qa/Publish.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/qa/Publish.vue:1) · 脚本 [L28](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/qa/Publish.vue:28) · 样式 [L56](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/qa/Publish.vue:56)。

**具体视觉重排：** `.publish` 单列白色表单卡，分类和标题作为首组，补充背景为大输入区，发布/取消在底部；使用淡青页背景与深绿主按钮。

**功能、状态和边界：** 保留form.category默认课程、五类选项、title64字、content、submitting、submit只校验标题、trim参数、成功到/qa、router.back。禁止移除补充内容或改成AI自动发布。

**可编辑的现有结构类：** `.publish` L4。

**原样保留的模板契约：**

```vue
L6 <template> #header
L7 <el-form> :model="form"
L8 <el-form-item> label="分类"
L9 <el-select> v-model="form.category"
L10 <el-option> v-for="c in categories" :key="c" :label="c" :value="c"
L13 <el-form-item> label="标题"
L14 <el-input> v-model="form.title" maxlength="64" show-word-limit
L16 <el-form-item> label="详细描述"
L17 <el-input> v-model="form.content" type="textarea" :rows="5"
L20 <el-button> type="primary" :loading="submitting" @click="submit"
L21 <el-button> @click="$router.back()"
```

**冻结的脚本处理器/生命周期锚点：**

```js
L40 async function submit() {
```

### 40. 跨模块搜索

源文件：`web/frontend/student/src/views/search/SearchResults.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/search/SearchResults.vue:1) · 脚本 [L40](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/search/SearchResults.vue:40) · 样式 [L111](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/search/SearchResults.vue:111), [L220](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/search/SearchResults.vue:220)。

**具体视觉重排：** `.chips` 放顶部横向筛选，`.result-sections` 改全宽纵向分组；每组白色圆角行卡，关键词高亮用淡黄，查看全部用深绿轻按钮。不能把四组结果移到侧栏。

**功能、状态和边界：** 保留 route.query.q 驱动及 immediate watch；activity、idle、lost、post 四组各取首页四条，activeType 本地过滤、totalCount 当前返回条数、结果跳转与 openSection 携带 q；这些不是后台总量或客户端分页。保留无关键词、加载、无结果、各组空态，以及 highlight 的 escHtml 与正则转义。动态结果必须继续去 `/social?post=...`。

**可编辑的现有结构类：** `.search-empty` L4；`.chips` L7；`.chip` L8；`.result-sections` L19；`.result-section` L20；`.result-list` L28。

**原样保留的模板契约：**

```vue
L2 <WtPageHeader> :subtitle="`关键词：${keyword || '未输入'}`"
L4 <div> v-if="!keyword"
L5 <div> v-else v-loading="loading"
L8 <span> :class="{ active: activeType === '' }" @click="activeType = ''"
L9 <span> v-for="sec in sections" :key="sec.type" :class="{ active: activeType === sec.type }" @click="activeType = sec.type"
L20 <section> v-for="section in visibleSections" :key="section.type"
L26 <button> type="button" @click="openSection(section)"
L28 <div> v-if="section.items.length"
L29 <button> v-for="item in section.items" :key="item.key" type="button" @click="router.push(item.to)"
L30 <strong> v-html="highlight(item.title)"
L31 <span> v-html="highlight(item.meta)"
L36 <EmptyBox> v-if="!loading && !totalCount"
```

**展示数据与动态文案（不得丢失）：**

```text
L8 totalCount
L15 sec.label
L15 sec.items.length
L23 section.label
L24 section.items.length ? `找到 ${section.items.length} 条相关内容` : '暂无相关内容'
```

**冻结的脚本处理器/生命周期锚点：**

```js
L65 function escHtml(str) {
L68 function highlight(text) {
L75 function rows(res) {
L79 function openSection(section) {
L83 async function load() {
L108 watch(keyword, load, { immediate: true })
```

### 41. 动态广场与分享落地

源文件：`web/frontend/student/src/views/social/PostSquare.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/social/PostSquare.vue:1) · 脚本 [L118](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/social/PostSquare.vue:118) · 样式 [L349](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/social/PostSquare.vue:349), [L557](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/social/PostSquare.vue:557)。

**具体视觉重排：** `.square` 改单列；`.square-rail` 的热门话题与热门动态迁移到列表上方两块横向内容区或列表下方，不能作为右侧栏。发帖框、分享目标卡、信息流纵向排列；图片网格、轻量互动按钮及评论展开区统一浅青/白色圆角视觉。

**功能、状态和边界：** 保留登录后发帖、AiAssistPanel(post)、内容2000字、9图、审核提示与发布清空；keyword/q和useListState、10条分页、loading/error重试。作者头像/昵称主页、非本人私信带post上下文、举报、赞/取消赞计数、评论展开及count-changed回写、收藏/取消、剪贴板分享及失败显示链接全部保留。route.query.post分享目标独立加载/错误与closeShare保留q；热门话题由当前list提取，热门动态由list计算，不换成假榜单。源码实际postImages只取imageList，图片失败处理与预览保持。

**可编辑的现有结构类：** `.load-error` L2；`.text-btn` L2；`.square` L5；`.square-main` L6；`.post-search` L7；`.publish-box` L14；`.publish-ops` L17；`.post-card` L24；`.share-target` L24；`.share-banner` L25；`.share-error` L30；`.post-head` L38；`.nick` L41；`.time` L42；`.post-head-actions` L44；`.post-content` L49；`.post-images` L50；`.post-img` L52；`.post-ops` L54；`.op` L55；`.comment-area` L65；`.square-rail` L76；`.rail-card` L77；`.card` L77；`.card-hover` L77；`.rail-title` L78；`.topic-list` L79；`.topic-row` L80；`.topic-rank` L81；`.topic-tag` L82；`.topic-count` L83；`.hot-list` L89；`.hot-row` L90；`.hot-main` L92；`.hot-text` L93；`.hot-meta` L94。

**原样保留的模板契约：**

```vue
L2 <div> v-if="loadError" role="alert"
L2 <button> type="button" @click="load"
L8 <el-input> v-model="keyword" clearable @keyup.enter="search" @clear="search"
L9 <template> #append
L9 <el-button> @click="search"
L14 <el-card> v-if="userStore.isLoggedIn"
L15 <AiAssistPanel> :type="'post'" @fill="applyAssist"
L16 <el-input> v-model="newPost" type="textarea" :rows="3" maxlength="2000"
L18 <UploadImg> v-model="newImages" :max="9"
L19 <el-button> type="primary" :loading="publishing" @click="publish"
L24 <el-card> v-if="targetPost"
L27 <button> type="button" @click="closeShare"
L30 <el-alert> v-else-if="targetError" type="error" :closable="false"
L31 <template> #title
L32 <button> type="button" @click="closeShare"
L36 <div> v-loading="loading"
L37 <el-card> v-for="p in displayed" :key="p.id"
L39 <el-avatar> :size="40" :src="p.avatar" @click="goUser(p.userId)"
L41 <div> @click="goUser(p.userId)"
L45 <el-button> v-if="Number(p.userId) !== Number(userStore.userInfo?.id)" type="primary" @click="contactAuthor(p)"
L46 <el-button> type="warning" @click="openReport(p)"
L50 <div> v-if="postImages(p).length"
L51 <el-image> v-for="img in postImages(p)" :key="img" :src="img" :preview-src-list="postImages(p)" lazy @error="onImgError($event)"
L55 <span> :class="{ liked: p.liked }" @click="toggleLike(p)"
L58 <span> @click="toggleComments(p)"
L59 <span> :class="{ liked: p.favorited }" @click="toggleFavorite(p)"
L62 <span> @click="sharePost(p)"
L65 <div> v-if="expandedPostId === p.id"
L66 <CommentList> :post-id="p.id" @count-changed="(t) => (p.commentCount = t)"
L69 <EmptyBox> v-if="!loadError && !loading && !list.length"
L71 <el-pagination> v-model:current-page="pageNum" :total="total" :page-size="10" layout="prev, pager, next" @current-change="load"
L77 <div> v-if="hotTopics.length"
L80 <button> v-for="(t, i) in hotTopics" :key="t.tag" type="button" @click="searchTopic(t.tag)"
L81 <span> :class="{ top: i < 3 }"
L87 <div> v-if="hotPosts.length"
L90 <button> v-for="p in hotPosts" :key="p.id" type="button" @click="openPost(p)"
L91 <el-avatar> :size="30" :src="p.avatar"
L102 <el-dialog> v-model="reportVisible"
L103 <el-select> v-model="reportReasonType"
L104 <el-option> label="违规内容" value="违规"
L105 <el-option> label="辱骂引战" value="辱骂"
L106 <el-option> label="广告骚扰" value="广告"
L107 <el-option> label="其他" value="其他"
L109 <el-input> v-model="reportReason" type="textarea" :rows="3" maxlength="500"
L110 <template> #footer
L111 <el-button> @click="reportVisible = false"
L112 <el-button> type="primary" @click="doReport"
```

**展示数据与动态文案（不得丢失）：**

```text
L2 loadError
L31 targetError
L39 p.nickname?.charAt(0)
L41 p.nickname
L42 fromNow(p.createTime)
L49 p.content
L56 p.liked ? '❤️' : '🤍'
L56 p.likeCount
L58 p.commentCount
L60 p.favorited ? '★' : '☆'
L81 i + 1
L82 t.tag
L83 t.count
```

**冻结的脚本处理器/生命周期锚点：**

```js
L159 function onImgError(event) {
L162 function postImages(post) {
L190 function searchTopic(tag) {
L195 function openPost(p) {
L199 async function sharePost(p) {
L209 function search() {
L214 async function load() {
L228 function applyAssist(data) {
L232 async function publish() {
L248 async function toggleFavorite(p) {
L268 async function toggleLike(p) {
L284 function goUser(id) {
L290 async function contactAuthor(p) {
L295 function openReport(p) {
L304 async function doReport() {
L311 watch(
L325 async function loadShareTarget() {
L341 function closeShare() {
```

### 42. 他人主页与内联内容组件

源文件：`web/frontend/student/src/views/user/UserHome.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/user/UserHome.vue:1) · 脚本 [L98](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/user/UserHome.vue:98), [L218](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/user/UserHome.vue:218) · 样式 [L265](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/views/user/UserHome.vue:265)。

**具体视觉重排：** `.home-banner` 全宽名片，`.stat-row` 四项统计横排，`.tab-card` 横向闲置/动态/评价/更多；评价列表头像、五星、物品标题、内容、时间有完整阅读空间。所有详情列表位于主流中。

**功能、状态和边界：** 保留isSelf对发私信/举报/编辑自己资料的分支、gender/bio/avgScore/加入日期、用户不存在或禁用空态；tab懒加载、uid变化回到idle并重载，更多组合活动与失物；sendMsg带profile上下文；举报类型必选、原因200字、reporting和成功/失败反馈。内联 ContentList 在同文件第二script L222，props items/type、emits open、onClick=()=>open(item)、图片/默认图标、标题/状态/extra/createTime均必须保留。其样式写在h()内联对象中：遵守脚本冻结，优先用`.uc-item`及子级CSS覆盖，不重写渲染逻辑。详情映射保留现有实际路径。

**可编辑的现有结构类：** `.user-home` L4；`.home-banner` L7；`.banner-avatar` L8；`.banner-info` L9；`.banner-sub` L14；`.banner-bio` L21；`.banner-time` L22；`.banner-ops` L24；`.stat-row` L53；`.stat-item` L54；`.tab-card` L61；`.review-list` L70；`.review-item` L71；`.review-main` L75；`.review-head` L76；`.review-name` L77；`.stars` L78；`.review-item-title` L79；`.review-content` L81；`.review-time` L82。

**原样保留的模板契约：**

```vue
L4 <div> v-loading="loading"
L5 <div> v-if="profile"
L8 <el-avatar> :size="88" :src="profile.avatar"
L12 <el-tag> v-if="isSelf" type="success"
L16 <template> v-if="profile.gender === 1"
L17 <template> v-else-if="profile.gender === 2"
L18 <span> v-if="profile.bio"
L19 <span> v-if="profile.avgScore"
L21 <p> v-if="profile.bio"
L25 <el-button> v-if="!isSelf" type="primary" @click="sendMsg"
L26 <el-button> v-if="!isSelf" type="danger" @click="reportVisible = true"
L27 <el-button> v-else @click="$router.push('/profile')"
L31 <el-dialog> v-model="reportVisible"
L33 <el-form-item> label="举报类型"
L34 <el-select> v-model="reportForm.reasonType"
L35 <el-option> label="言语辱骂/攻击" value="abuse"
L36 <el-option> label="发布违规内容" value="illegal"
L37 <el-option> label="骚扰/冒充" value="harass"
L38 <el-option> label="其他" value="other"
L41 <el-form-item> label="补充说明"
L42 <el-input> v-model="reportForm.reason" type="textarea" :rows="3" maxlength="200"
L45 <template> #footer
L46 <el-button> @click="reportVisible = false"
L47 <el-button> type="danger" :loading="reporting" @click="doReport"
L62 <el-tabs> v-model="tab"
L63 <el-tab-pane> label="TA 的闲置" name="idle"
L64 <ContentList> :items="idles" type="idle" @open="goDetail"
L66 <el-tab-pane> label="TA 的动态" name="post"
L67 <ContentList> :items="posts" type="post" @open="goDetail"
L69 <el-tab-pane> label="TA 的评价" name="review"
L70 <div> v-if="reviews.length"
L71 <div> v-for="r in reviews" :key="r.id"
L72 <el-avatar> :size="32" :src="r.fromAvatar" @click="goUser(r.fromUserId)"
L77 <span> @click="goUser(r.fromUserId)"
L86 <EmptyBox> v-else
L88 <el-tab-pane> label="更多发布" name="more"
L89 <ContentList> :items="more" type="more" @open="goDetail"
L94 <EmptyBox> v-else-if="!loading"
```

**展示数据与动态文案（不得丢失）：**

```text
L8 profile.nickname?.charAt(0)
L11 profile.nickname
L15 profile.grade || '同学'
L19 profile.avgScore
L21 profile.bio
L22 fmtTime(profile.createTime)
L54 profile.idleCount
L55 profile.postCount
L56 profile.reviewCount
L57 profile.avgScore ?? '—'
L73 r.fromNickname?.charAt(0)
L77 r.fromNickname
L78 '★'.repeat(r.score)
L78 '★'.repeat(5 - r.score)
L79 r.itemTitle || '闲置互换'
L81 r.content
L82 fmtTime(r.createTime)
```

**冻结的脚本处理器/生命周期锚点：**

```js
L127 async function loadProfile() {
L139 async function loadTab(name) {
L153 watch(tab, (v) => loadTab(v))
L155 onMounted(async () => {
L160 watch(uid, async () => {
L166 function goDetail(item) {
L176 function goUser(id) {
L181 async function sendMsg() {
L189 async function doReport() {
L213 function fmtTime(t) {
```

### 43. 通用AI辅助发布

源文件：`web/frontend/student/src/components/AiAssistPanel.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/AiAssistPanel.vue:1) · 脚本 [L72](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/AiAssistPanel.vue:72) · 样式 [L154](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/AiAssistPanel.vue:154)。

**具体视觉重排：** `.ai-assist` 改淡黄内嵌卡，compose/polish横向标签、输入区与结果预览上下排列，放弃/填入表单在结果底部。不得为助手单独建立右侧栏。

**功能、状态和边界：** 保留type/typeName props与fill事件；topic/extra/doCompose/composing/draft、标题内容tags及fillDraft/放弃；source/action的polish/expand/shorten、doPolish/polishing/polished、fillPolish/放弃。主题/源内容为空警告、空响应警告、错误反馈保留。填入只emit `{title,content,tags}`，润色title空/tags空，不能改为自动提交业务表单。

**可编辑的现有结构类：** `.ai-assist` L2；`.ai-assist-head` L3；`.ai-badge` L4；`.ai-sub` L5；`.ai-tabs` L8；`.ai-row` L11；`.ai-extra` L19；`.ai-result` L28；`.ai-result-title` L29；`.ai-result-content` L30；`.ai-tags` L31；`.ai-actions` L34。

**原样保留的模板契约：**

```vue
L8 <el-tabs> v-model="tab"
L10 <el-tab-pane> label="AI 生成草稿" name="compose"
L12 <el-input> v-model="topic" type="textarea" :rows="2"
L20 <el-input> v-model="extra" clearable
L25 <el-button> type="primary" :loading="composing" @click="doCompose"
L28 <div> v-if="draft"
L31 <div> v-if="draft.tags && draft.tags.length"
L32 <el-tag> v-for="t in draft.tags" :key="t"
L35 <el-button> type="success" @click="fillDraft"
L36 <el-button> @click="draft = null"
L42 <el-tab-pane> label="AI 润色 / 扩写 / 精简" name="polish"
L44 <el-input> v-model="source" type="textarea" :rows="3"
L52 <el-radio-group> v-model="action"
L53 <el-radio-button> value="polish"
L54 <el-radio-button> value="expand"
L55 <el-radio-button> value="shorten"
L57 <el-button> type="primary" :loading="polishing" @click="doPolish"
L60 <div> v-if="polished"
L63 <el-button> type="success" @click="fillPolish"
L64 <el-button> @click="polished = ''"
```

**展示数据与动态文案（不得丢失）：**

```text
L5 typeName
L29 draft.title || '（未生成标题）'
L30 draft.content
L32 t
L61 polished
```

**冻结的脚本处理器/生命周期锚点：**

```js
L93 async function doCompose() {
L115 function fillDraft() {
L125 async function doPolish() {
L147 function fillPolish() {
```

**组件公开接口原文：**

```js
L77 const props = defineProps({
L78   type: { type: String, required: true },
L79   typeName: { type: String, default: '' }
L80 })
L81 const emit = defineEmits(['fill'])
```

### 44. 登录注册共用壳

源文件：`web/frontend/student/src/components/auth/AuthCampusShell.vue` · 模板 [L7](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/auth/AuthCampusShell.vue:7) · 脚本 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/auth/AuthCampusShell.vue:1) · 样式 [L40](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/auth/AuthCampusShell.vue:40)。

**具体视觉重排：** `.auth-shell` 调为浅青背景+故事图与表单主卡的居中构图；宽屏视觉区与表单同级，小屏故事简化顶部横幅，不能保留窄而常驻的导航式侧栏。照片蒙层用深绿轻遮罩，表单白底、装饰淡黄。

**功能、状态和边界：** 保留compactText必填、story具名slot、默认表单slot、品牌/照片可用及移动端compact文案；此组件无认证逻辑，不能吞掉父表单校验与按键事件。

**可编辑的现有结构类：** `.auth-shell` L8；`.auth-visual` L9；`.auth-visual__photo` L10；`.auth-visual__wash` L11；`.auth-visual__content` L12；`.auth-brand` L13；`.auth-brand__symbol` L14；`.auth-brand__text` L22；`.auth-story-copy` L25；`.auth-story-compact` L28；`.auth-form-panel` L32；`.auth-form-content` L33。

**原样保留的模板契约：**

```vue
L9 <section> aria-label="梧桐校园"
L26 <slot> name="story"
```

**展示数据与动态文案（不得丢失）：**

```text
L28 compactText
```

**组件公开接口原文：**

```js
L2 defineProps({
L3   compactText: { type: String, required: true }
L4 })
```

### 45. 私信业务上下文

源文件：`web/frontend/student/src/components/chat/BizContextCard.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/chat/BizContextCard.vue:1) · 脚本 [L9](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/chat/BizContextCard.vue:9) · 样式 [L22](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/chat/BizContextCard.vue:22)。

**具体视觉重排：** `.context` 改消息标题下的全宽淡黄可点击摘要条，类型/标题/打开详情文字均可见。

**功能、状态和边界：** 保留conversation prop、contextType条件、openContext；idle/lostfound/activity/profile按contextId跳详情或主页，post去/social。没有context时不占装饰空卡，不增不存在的上下文类型。

**可编辑的现有结构类：** `.context` L2；`.kind` L3。

**原样保留的模板契约：**

```vue
L2 <button> v-if="conversation?.contextType" @click="openContext"
```

**展示数据与动态文案（不得丢失）：**

```text
L3 labels[conversation.contextType] || '校园内容'
L4 conversation.contextTitle || '查看关联内容'
```

**冻结的脚本处理器/生命周期锚点：**

```js
L15 function openContext() {
```

**组件公开接口原文：**

```js
L11 const props = defineProps({ conversation: Object })
```

### 46. 私信文本图片输入

源文件：`web/frontend/student/src/components/chat/ChatComposer.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/chat/ChatComposer.vue:1) · 脚本 [L11](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/chat/ChatComposer.vue:11) · 样式 [L38](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/chat/ChatComposer.vue:38)。

**具体视觉重排：** `.composer` 全宽放在聊天主容器底部，上传圆按钮、textarea、深绿发送按钮横排，窄屏可折行；留足底部Dock与安全区空间。

**功能、状态和边界：** 保留send事件：submit trim非空后emit('send','text',value)并清空；textarea max2000、minRows1/maxRows5、Enter exact prevent、Shift换行原行为；上传accept=image、http-request=upload、3MB限制（不同于UploadImg的5MB）、uploading禁用/转圈，成功emit('send','image',{url,resourceId})，不能丢resourceId或改事件参数。

**可编辑的现有结构类：** `.composer` L2。

**原样保留的模板契约：**

```vue
L3 <el-upload> :show-file-list="false" :http-request="upload" accept="image/*" :disabled="uploading"
L4 <el-button> :loading="uploading" aria-label="发送图片"
L6 <el-input> v-model="text" type="textarea" :autosize="{ minRows: 1, maxRows: 5 }" maxlength="2000" show-word-limit @keydown.enter.exact.prevent="submit"
L7 <el-button> type="primary" :disabled="!text.trim()" @click="submit"
```

**冻结的脚本处理器/生命周期锚点：**

```js
L20 function submit() {
L26 async function upload({ file }) {
```

**组件公开接口原文：**

```js
L17 const emit = defineEmits(['send'])
```

### 47. 私信气泡状态

源文件：`web/frontend/student/src/components/chat/MessageBubble.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/chat/MessageBubble.vue:1) · 脚本 [L19](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/chat/MessageBubble.vue:19) · 样式 [L32](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/chat/MessageBubble.vue:32)。

**具体视觉重排：** `.row.mine`对齐自己，`.bubble` 深绿/白色区分双方，`.meta` 发送反馈保持可读；图片气泡按contain与预览处理。

**功能、状态和边界：** 保留message必填/mine/peerName/peerAvatar、retry事件携完整message；image与text分支、sending/failed可点重试/已读readTime/已送达、MM-DD HH:mm时间、对方头像。失败不能仅用颜色提示，也不能把失败重试伪装成成功。

**可编辑的现有结构类：** `.row` L2；`.wrap` L4；`.bubble` L5；`.meta` L9。

**原样保留的模板契约：**

```vue
L2 <div> :class="{ mine }"
L3 <el-avatar> v-if="!mine" :size="34" :src="peerAvatar"
L5 <div> :class="[message.messageType, { failed: message.sendState === 'failed' }]"
L6 <el-image> v-if="message.messageType === 'image'" :src="message.content" :preview-src-list="[message.content]"
L7 <span> v-else
L11 <span> v-if="mine && message.sendState === 'sending'"
L12 <button> v-else-if="mine && message.sendState === 'failed'" @click="$emit('retry', message)"
L13 <span> v-else-if="mine"
```

**展示数据与动态文案（不得丢失）：**

```text
L3 peerName?.charAt(0)
L7 message.content
L10 formatTime(message.createTime)
L13 message.readTime ? '已读' : '已送达'
```

**组件公开接口原文：**

```js
L22 defineProps({
L23   message: { type: Object, required: true },
L24   mine: Boolean,
L25   peerName: String,
L26   peerAvatar: String
L27 })
L28 defineEmits(['retry'])
```

### 48. AI聊天气泡

源文件：`web/frontend/student/src/components/ChatBubble.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/ChatBubble.vue:1) · 脚本 [L17](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/ChatBubble.vue:17) · 样式 [L32](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/ChatBubble.vue:32)。

**具体视觉重排：** `.bubble-row` 继续区分mine，用户气泡改深绿柔和配色、AI气泡白色，Markdown块保持可读；头像与流式光标不删。

**功能、状态和边界：** 保留role/content/streaming/userAvatar/nickname props、AI renderMarkdown/html v-html、用户plain文本、streaming光标、用户头像及首字回退。不要把AI代码块/表格裁为不可访问短文本，不能改Markdown清洗链。

**可编辑的现有结构类：** `.bubble-row` L3；`.avatar` L4；`.ai-avatar` L4；`.bubble` L5；`.md-body` L7；`.plain` L8；`.cursor` L9；`.user-avatar` L11。

**原样保留的模板契约：**

```vue
L3 <div> :class="{ mine: role === 'user' }"
L4 <el-avatar> v-if="role !== 'user'" :size="34"
L5 <div> :class="role"
L7 <div> v-if="role !== 'user'" v-html="html"
L8 <span> v-else
L9 <span> v-if="streaming"
L11 <el-avatar> v-if="role === 'user'" :size="34" :src="userAvatar"
```

**展示数据与动态文案（不得丢失）：**

```text
L8 content
L12 nickname.charAt(0)
```

**组件公开接口原文：**

```js
L21 const props = defineProps({
L22   role: { type: String, default: 'user' }, // user / assistant
L23   content: { type: String, default: '' },
L24   streaming: { type: Boolean, default: false },
L25   userAvatar: { type: String, default: '' },
L26   nickname: { type: String, default: '我' }
L27 })
```

### 49. 动态评论分页

源文件：`web/frontend/student/src/components/CommentList.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/CommentList.vue:1) · 脚本 [L38](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/CommentList.vue:38) · 样式 [L118](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/CommentList.vue:118)。

**具体视觉重排：** `.comment-list` 变为信息流卡内浅青展开区，input-row置顶，comment-item头像与内容齐排，pager独立底部。

**功能、状态和边界：** 保留postId Number必填、count-changed、defineExpose.reload；content500字、Enter/发表submit、登录跳转、非空校验、submitting；每页10条、自身pageNum/total/load/onPageChange、postId变化立即load1、加载/失败清空/无评论，成功发布清空并load1及总数通知；头像/昵称goUser区分自己。

**可编辑的现有结构类：** `.comment-list` L3；`.input-row` L4；`.comment-body` L11；`.comment-item` L12；`.c-body` L14；`.c-head` L15；`.c-nick` L16；`.c-time` L17；`.c-content` L19；`.pager` L24。

**原样保留的模板契约：**

```vue
L5 <el-input> v-model="content" maxlength="500" @keyup.enter="submit"
L6 <template> #append
L7 <el-button> :loading="submitting" @click="submit"
L11 <div> v-loading="loading"
L12 <div> v-for="c in comments" :key="c.id"
L13 <el-avatar> :size="28" :src="c.avatar" @click="goUser(c.userId)"
L16 <span> @click="goUser(c.userId)"
L22 <el-empty> v-if="!loading && comments.length === 0" :image-size="60"
L24 <div> v-if="total > pageSize"
L25 <el-pagination> layout="prev, pager, next" :total="total" :page-size="pageSize" :current-page="pageNum" @current-change="onPageChange"
```

**展示数据与动态文案（不得丢失）：**

```text
L13 c.nickname?.charAt(0)
L16 c.nickname
L17 fromNow(c.createTime)
L19 c.content
```

**冻结的脚本处理器/生命周期锚点：**

```js
L61 watch(() => props.postId, () => load(1), { immediate: true })
L63 function goUser(id) {
L69 async function load(page) {
L86 function onPageChange(page) {
L91 function reload() {
L95 defineExpose({ reload })
L97 async function submit() {
```

**组件公开接口原文：**

```js
L46 const props = defineProps({
L47   postId: { type: Number, required: true }
L48 })
L49 const emit = defineEmits(['count-changed'])
L95 defineExpose({ reload })
```

### 50. 基础空态容器

源文件：`web/frontend/student/src/components/EmptyBox.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/EmptyBox.vue:1) · 脚本 [L8](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/EmptyBox.vue:8) · 样式 无独立样式。

**具体视觉重排：** 沿用el-empty主体，仅统一图形尺度、文字颜色和上下留白；没有业务动作时不额外添加假按钮。

**功能、状态和边界：** 保留description默认暂无数据、imageSize默认120、默认slot承载调用方真实操作；所有页面的空态出现条件仍由父页决定。

**可编辑的现有结构类：** 无稳定根class，优先给展示容器加局部样式类，保留原组件。。

**原样保留的模板契约：**

```vue
L3 <el-empty> :description="description" :image-size="imageSize"
```

**组件公开接口原文：**

```js
L9 defineProps({
L10   description: { type: String, default: '暂无数据' },
L11   imageSize: { type: Number, default: 120 }
L12 })
```

### 51. 闲置失物通用卡

源文件：`web/frontend/student/src/components/ItemCard.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/ItemCard.vue:1) · 脚本 [L26](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/ItemCard.vue:26) · 样式 [L60](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/ItemCard.vue:60)。

**具体视觉重排：** `.item-card`、`.cover`、`.body`改圆角白卡与浅青边，封面比例一致，footer信息可换行；badge在角落可见。

**功能、状态和边界：** 保留cover/title/desc/time/module/category props、click emit、badge/footer/default time插槽、fromNow；resolvedCover/displayCover watch、按模块分类fallback、防递归onError、isSchematic示意图、lazy、无图图标与两种分支下badge。不能删除真实图片、兜底语义或整卡点击。

**可编辑的现有结构类：** `.item-card` L4；`.cover` L5；`.cover-img` L6；`.schematic-tag` L7；`.cover-badge` L8；`.placeholder` L10；`.body` L14；`.title` L15；`.desc` L16；`.footer` L17；`.time` L19。

**原样保留的模板契约：**

```vue
L4 <el-card> @click="$emit('click')"
L5 <div> v-if="resolvedCover"
L6 <el-image> :src="resolvedCover" lazy @error="onError"
L7 <span> v-if="isSchematic"
L8 <span> v-if="$slots.badge"
L8 <slot> name="badge"
L10 <div> v-else
L11 <el-icon> :size="36"
L12 <span> v-if="$slots.badge"
L12 <slot> name="badge"
L18 <slot> name="footer"
```

**展示数据与动态文案（不得丢失）：**

```text
L15 title
L16 desc
L19 timeText
```

**冻结的脚本处理器/生命周期锚点：**

```js
L44 watch(() => props.cover, (v) => { displayCover.value = v || '' })
L49 function onError(event) {
```

**组件公开接口原文：**

```js
L32 const props = defineProps({
L33   cover: { type: String, default: '' },
L34   title: { type: String, default: '' },
L35   desc: { type: String, default: '' },
L36   time: { type: String, default: '' },
L37   module: { type: String, default: '' },
L38   category: { type: String, default: '' }
L39 })
L40 defineEmits(['click'])
```

### 52. 图片上传与头像更换

源文件：`web/frontend/student/src/components/UploadImg.vue` · 模板 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/UploadImg.vue:1) · 脚本 [L24](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/UploadImg.vue:24) · 样式 [L62](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/UploadImg.vue:62)。

**具体视觉重排：** `.upload-img` 改上传按钮与缩略图网格，移除按钮有明确点击区域，计数和上传中状态可见；小屏缩略图换行，预览层在Dock之上。

**功能、状态和边界：** 保留modelValue数组/max默认9、update:modelValue、http-request=doUpload、accept=image、uploading禁用、max>1达到上限禁用、max1更换头像语义；5MB限制、先uploadImage取url再emit、max1替换/多图追加、remove(i)复制数组后emit、预览src-list完整。不能从外观变成只本地预览不上传。

**可编辑的现有结构类：** `.upload-img` L3；`.preview-list` L15；`.preview-item` L16；`.preview-img` L17；`.remove` L18。

**原样保留的模板契约：**

```vue
L4 <el-upload> :show-file-list="false" :http-request="doUpload" accept="image/*" :disabled="uploading"
L10 <el-button> :loading="uploading" :disabled="uploading || (max > 1 && modelValue.length >= max)"
L16 <div> v-for="(url, i) in modelValue" :key="url"
L17 <el-image> :src="url" :preview-src-list="modelValue"
L18 <el-icon> @click="remove(i)"
```

**展示数据与动态文案（不得丢失）：**

```text
L12 max === 1 && modelValue.length ? '更换头像' : '上传图片'
L12 modelValue.length
L12 max
```

**冻结的脚本处理器/生命周期锚点：**

```js
L38 async function doUpload({ file }) {
L55 function remove(index) {
```

**组件公开接口原文：**

```js
L30 const props = defineProps({
L31   // 图片URL数组（v-model）
L32   modelValue: { type: Array, default: () => [] },
L33   max: { type: Number, default: 9 }
L34 })
L35 const emit = defineEmits(['update:modelValue'])
```

### 53. 品牌头像

源文件：`web/frontend/student/src/components/wt/WtAvatar.vue` · 模板 [L14](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtAvatar.vue:14) · 脚本 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtAvatar.vue:1) · 样式 [L26](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtAvatar.vue:26)。

**具体视觉重排：** `.wt-avatar` 改浅青底深绿字，边缘圆润；自定义数字size与sm/md/lg尺寸按当前px保留。

**功能、状态和边界：** 保留name/src/size props、末字initial回退、img存在条件、aria-label和动态尺寸，不用静态头像覆盖用户数据。

**可编辑的现有结构类：** `.wt-avatar` L16；`.wt-avatar__txt` L22。

**原样保留的模板契约：**

```vue
L15 <span> :style="{ width: px + 'px', height: px + 'px', fontSize: px * 0.4 + 'px' }" role="img" :aria-label="name || '头像'"
L21 <img> v-if="src" :src="src"
L22 <span> v-else
```

**展示数据与动态文案（不得丢失）：**

```text
L22 initial
```

**组件公开接口原文：**

```js
L4 const props = defineProps({
L5   name: { type: String, default: '' },
L6   src:  { type: String, default: '' },
L7   size: { type: [String, Number], default: 'md' }, // sm | md | lg | 数字(px)
L8 })
```

### 54. 品牌按钮

源文件：`web/frontend/student/src/components/wt/WtButton.vue` · 模板 [L13](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtButton.vue:13) · 脚本 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtButton.vue:1) · 样式 [L26](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtButton.vue:26)。

**具体视觉重排：** `.wt-btn` 的primary映射深绿、accent淡黄、soft浅青、ghost透明；md/sm、block和加载旋转保持尺寸稳定。

**功能、状态和边界：** 保留type/size/block/disabled/loading、click emit原Event参数、disabled||loading原生禁用、aria-busy和点击守卫；不得为视觉按钮移除原生button行为。

**可编辑的现有结构类：** `.wt-btn` L15；`.wt-spin` L21。

**原样保留的模板契约：**

```vue
L14 <button> :class="[`wt-btn--${type}`, `wt-btn--${size}`, { 'is-block': block, 'is-disabled': disabled || loading }]" :disabled="disabled || loading" :aria-busy="loading || undefined" @click="(e) => !disabled && !loading && emit('click', e)"
L21 <span> v-if="loading"
```

**组件公开接口原文：**

```js
L3 const props = defineProps({
L4   type:   { type: String, default: 'primary' }, // primary | accent | soft | ghost
L5   size:   { type: String, default: 'md' },       // md | sm
L6   block:  Boolean,
L7   disabled: Boolean,
L8   loading: Boolean,
L9 })
L10 const emit = defineEmits(['click'])
```

### 55. 品牌卡片

源文件：`web/frontend/student/src/components/wt/WtCard.vue` · 模板 [L10](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtCard.vue:10) · 脚本 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtCard.vue:1) · 样式 [L20](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtCard.vue:20)。

**具体视觉重排：** `.wt-card` 统一白/浅青面、细绿灰边和柔和阴影；hover轻微抬升，flush图文贴边仍支持，pad调用方优先。

**功能、状态和边界：** 保留hover/flush/pad props、动态class/style和默认slot，不把调用方内容裁掉。

**可编辑的现有结构类：** `.wt-card` L12。

**原样保留的模板契约：**

```vue
L11 <div> :class="{ 'wt-card--hover': hover, 'wt-card--flush': flush }" :style="pad ? { padding: pad } : null"
```

**组件公开接口原文：**

```js
L3 defineProps({
L4   hover:  { type: Boolean, default: true },
L5   flush: Boolean,
L6   pad:    { type: String, default: '' }, // 自定义内边距，如 'var(--s-4)'
L7 })
```

### 56. 空加载错误三态

源文件：`web/frontend/student/src/components/wt/WtEmptyState.vue` · 模板 [L15](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtEmptyState.vue:15) · 脚本 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtEmptyState.vue:1) · 样式 [L40](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtEmptyState.vue:40)。

**具体视觉重排：** `.wt-empty` 统一图形和留白，loading使用低对比骨架，error的文字和操作有足够对比。

**功能、状态和边界：** 保留type/title/description/actionLabel、action事件、icon/default回退、loading骨架、empty/error默认标题、aria-busy与条件按钮。不能将网络错误统一显示暂无内容。

**可编辑的现有结构类：** `.wt-empty` L16；`.wt-skel` L18；`.wt-skel__thumb` L19；`.wt-skel__line` L20；`.w1` L20；`.w2` L21；`.w3` L22；`.wt-empty__icon` L26；`.wt-empty__title` L33；`.wt-empty__desc` L34。

**原样保留的模板契约：**

```vue
L16 <div> :class="`is-${type}`" :aria-busy="type === 'loading' || undefined"
L17 <template> v-if="type === 'loading'"
L25 <template> v-else
L27 <slot> name="icon"
L34 <p> v-if="description"
L35 <WtButton> v-if="actionLabel" type="soft" @click="emit('action')"
```

**展示数据与动态文案（不得丢失）：**

```text
L33 title || (type === 'error' ? '出错了' : '暂无内容')
L34 description
L35 actionLabel
```

**组件公开接口原文：**

```js
L6 const props = defineProps({
L7   type:         { type: String, default: 'empty' }, // empty | loading | error
L8   title:        String,
L9   description:  String,
L10   actionLabel:  String,
L11 })
L12 const emit = defineEmits(['action'])
```

### 57. 活动封面生成图

源文件：`web/frontend/student/src/components/wt/WtEventArt.vue` · 模板 [L64](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtEventArt.vue:64) · 脚本 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtEventArt.vue:1) · 样式 [L75](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtEventArt.vue:75)。

**具体视觉重排：** `.event-art` 保留music/sport/volunteer/reading/running/ideas六种视觉区分，调整容器圆角和文字层级匹配新主题；不强制把所有海报涂成同色。

**功能、状态和边界：** 保留item必填/large、category关键词映射、真实title/category/startTime优先、无数据preset兜底、wordHtml和GRAPHICS渲染。只改模板/样式视觉，不改script中的分类规则和预设常量；封面不提供不存在的详情操作。

**可编辑的现有结构类：** `.event-art` L65；`.event-art-copy` L66；`.event-graphic` L71。

**原样保留的模板契约：**

```vue
L65 <div> :class="[v.cls, { large }]"
L68 <strong> v-html="wordHtml"
L71 <svg> v-html="GRAPHICS[v.cls]"
```

**展示数据与动态文案（不得丢失）：**

```text
L67 v.note
L69 v.small
```

**冻结的脚本处理器/生命周期锚点：**

```js
L13 function clsByCategory(cat = '') {
```

**组件公开接口原文：**

```js
L7 const props = defineProps({
L8   item:  { type: Object, required: true }, // 活动对象：{ id, category, title, ... }
L9   large: { type: Boolean, default: false },
L10 })
```

### 58. 通用信息流卡

源文件：`web/frontend/student/src/components/wt/WtFeedCard.vue` · 模板 [L17](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtFeedCard.vue:17) · 脚本 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtFeedCard.vue:1) · 样式 [L39](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtFeedCard.vue:39)。

**具体视觉重排：** `.wt-feed-card` 采用横向缩略图+文本+动作布局，compact继续更紧凑，价格/标签/元信息不丢；窄屏可让动作换到下行。

**功能、状态和边界：** 保留compact/title/meta/tag/price/image/actionLabel、action emit、有图img/无图thumb插槽、tag.type、meta遍历、actionLabel条件按钮。

**可编辑的现有结构类：** `.wt-feed-card` L18；`.wt-feed-card__thumb` L19；`.wt-feed-card__body` L23；`.wt-feed-card__head` L24；`.wt-feed-card__price` L26；`.wt-feed-card__title` L28；`.wt-feed-card__meta` L29；`.wt-feed-card__action` L33。

**原样保留的模板契约：**

```vue
L18 <div> :class="{ 'wt-feed-card--compact': compact }"
L20 <img> v-if="image" :src="image"
L21 <slot> v-else name="thumb"
L25 <WtTag> v-if="tag" :type="tag.type"
L26 <span> v-if="price"
L29 <div> v-if="meta.length"
L30 <span> v-for="(m, i) in meta" :key="i"
L33 <button> v-if="actionLabel" type="button" @click="$emit('action')"
```

**展示数据与动态文案（不得丢失）：**

```text
L25 tag.label
L26 price
L28 title
L30 m
L34 actionLabel
```

**组件公开接口原文：**

```js
L4 defineProps({
L5   compact: Boolean,
L6   title: { type: String, default: '' },
L7   meta: { type: Array, default: () => [] },
L8   tag: { type: Object, default: null },
L9   price: { type: String, default: '' },
L10   image: { type: String, default: '' },
L11   actionLabel: { type: String, default: '' },
L12 })
L14 defineEmits(['action'])
```

### 59. 门户Hero

源文件：`web/frontend/student/src/components/wt/WtHero.vue` · 模板 [L27](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtHero.vue:27) · 脚本 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtHero.vue:1) · 样式 [L75](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtHero.vue:75)。

**具体视觉重排：** `.campus-hero` 改原型浅青大圆角Hero，`.hero-copy`深绿标题。按主文档在现有模板内增加静态校园地图装饰及用既有 go(to) 跳到真实服务路径的地图入口；不增加script导入或业务状态，不注入虚构用户、AI内容、计时器或统计。`.hero-photo` 与原photo/photo-note传参、`.hero-event`及所有原节点继续保留，作为地图旁/下方的摄影与活动明信片，淡黄强调；小屏顺序堆叠，不能变成导航侧栏。

**功能、状态和边界：** 保留hello/greet兼容、title/description的v-html及subtitle回退、photo/photoNote、primary/secondary的go(to)、event日期标题副文案与点击/Enter、avatarStack/personal，空数据条件全部保留。不替换成失去真实event路由的静态装饰。

**可编辑的现有结构类：** `.campus-hero` L28；`.hero-copy` L29；`.hello-line` L30；`.hello-dot` L31；`.hero-description` L34；`.hero-actions` L36；`.btn` L37；`.primary` L37；`.soft` L41；`.hero-personal` L46；`.avatar-stack` L47；`.hero-photo` L54；`.photo-note` L56；`.hero-event` L57；`.hero-event-date` L58；`.hero-event-label` L63；`.round-arrow` L67。

**原样保留的模板契约：**

```vue
L30 <p> v-if="hello || greet"
L33 <h1> v-html="title"
L34 <p> v-if="description" v-html="description"
L35 <p> v-else-if="subtitle"
L36 <div> v-if="primary || secondary"
L37 <button> v-if="primary" type="button" @click="go(primary.to)"
L41 <button> v-if="secondary" type="button" @click="go(secondary.to)"
L46 <div> v-if="avatarStack.length"
L48 <span> v-for="(a, i) in avatarStack" :key="i"
L54 <div> v-if="photo"
L55 <img> :src="photo" loading="eager"
L56 <span> v-if="photoNote"
L57 <a> v-if="event" role="link" tabindex="0" @click="go(event.to)" @keydown.enter="go(event.to)"
```

**展示数据与动态文案（不得丢失）：**

```text
L31 hello || greet
L35 subtitle
L38 primary.label
L43 secondary.label
L48 a
L50 personal
L56 photoNote
L59 event.month
L60 event.day
L63 event.label
L64 event.title
L65 event.sub
```

**冻结的脚本处理器/生命周期锚点：**

```js
L22 function go(to) {
```

**组件公开接口原文：**

```js
L6 const props = defineProps({
L7   hello:      { type: String, default: '' },        // 问候行
L8   title:      { type: String, default: '' },        // 主标题（可用 <br>）
L9   description:{ type: String, default: '' },        // 副文案（可用 <br>）
L10   photo:      { type: String, default: '' },        // 校园摄影图
L11   photoNote:  { type: String, default: '秋日校园 · 2026' },
L12   primary:    { type: Object, default: null },      // { label, to }
L13   secondary:  { type: Object, default: null },      // { label, to }
L14   event:      { type: Object, default: null },      // { day, month, label, title, sub, to }
L15   avatarStack:{ type: Array, default: () => ['林', '陈', '周'] },
L16   personal:   { type: String, default: '从一个兴趣开始，找到你的校园同伴' },
L17   // 兼容旧调用：greet/title/subtitle 文本渲染（不换行）
L18   greet:      { type: String, default: '' },
L19   subtitle:   { type: String, default: '' },
L20 })
```

### 60. 品牌输入框

源文件：`web/frontend/student/src/components/wt/WtInput.vue` · 模板 [L17](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtInput.vue:17) · 脚本 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtInput.vue:1) · 样式 [L35](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtInput.vue:35)。

**具体视觉重排：** `.wt-field` 保持上标签下错误，输入圆角白底细边，focus深绿，错误仍明确标红；md/sm及disabled可辨。

**功能、状态和边界：** 保留modelValue/label/placeholder/type/error/disabled/size/id、update:modelValue原字符串事件、label for/id、aria-invalid、错误role=alert；不改自动id或输入类型转换逻辑。

**可编辑的现有结构类：** `.wt-field` L18；`.wt-label` L19；`.wt-input` L22；`.wt-err` L31。

**原样保留的模板契约：**

```vue
L18 <div> :class="`wt-field--${size}`"
L19 <label> v-if="label" :for="id"
L20 <input> :id="id" :class="{ 'has-error': !!error }" :type="type" :placeholder="placeholder" :disabled="disabled" :value="modelValue" :aria-invalid="!!error" @input="emit('update:modelValue', $event.target.value)"
L31 <p> v-if="error" role="alert"
```

**展示数据与动态文案（不得丢失）：**

```text
L19 label
L31 error
```

**组件公开接口原文：**

```js
L4 const props = defineProps({
L5   modelValue: { type: [String, Number], default: '' },
L6   label:      String,
L7   placeholder: String,
L8   type:       { type: String, default: 'text' },
L9   error:      String,
L10   disabled:   Boolean,
L11   size:       { type: String, default: 'md' }, // md | sm
L12   id:         { type: String, default: () => 'wt-in-' + Math.random().toString(36).slice(2, 8) },
L13 })
L14 const emit = defineEmits(['update:modelValue'])
```

### 61. 统一页头

源文件：`web/frontend/student/src/components/wt/WtPageHeader.vue` · 模板 [L13](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtPageHeader.vue:13) · 脚本 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtPageHeader.vue:1) · 样式 [L26](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtPageHeader.vue:26)。

**具体视觉重排：** `.wt-page-header` 改全宽标题条，eyebrow淡黄小标签、主标题深绿、subtitle弱化、actions横向右对齐；小屏动作折到下行，无左侧导航。

**功能、状态和边界：** 保留title必填/subtitle/eyebrow条件与默认slot；各页面传入的真实标题和按钮不能被固定文案覆盖。

**可编辑的现有结构类：** `.wt-page-header` L14；`.wt-ph-text` L15；`.wt-ph-eyebrow` L16；`.wt-ph-title` L17；`.wt-ph-sub` L18；`.wt-ph-actions` L20。

**原样保留的模板契约：**

```vue
L16 <span> v-if="eyebrow"
L18 <p> v-if="subtitle"
```

**展示数据与动态文案（不得丢失）：**

```text
L16 eyebrow
L17 title
L18 subtitle
```

**组件公开接口原文：**

```js
L6 defineProps({
L7   title:    { type: String, required: true },
L8   subtitle: { type: String, default: '' },
L9   eyebrow:  { type: String, default: '' }, // 标题上方的小标签，如「校园服务」
L10 })
```

### 62. 首页服务快捷入口

源文件：`web/frontend/student/src/components/wt/WtQuickEntry.vue` · 模板 [L18](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtQuickEntry.vue:18) · 脚本 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtQuickEntry.vue:1) · 样式 [L29](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtQuickEntry.vue:29)。

**具体视觉重排：** `.quick-service` 统一横向服务卡/横向服务条中的单项，图标浅青/淡黄面，标题深绿，箭头与整块点击区域明确。

**功能、状态和边界：** 保留title/desc/variant/color、COLOR_MAP兼容及computed colorCls、icon slot、click emit。四个首页入口和其他调用方不因缩小图标而失去点击面积。

**可编辑的现有结构类：** `.quick-service` L19；`.service-icon` L20；`.quick-service__text` L21；`.quick-service__arrow` L25。

**原样保留的模板契约：**

```vue
L19 <button> type="button" @click="emit('click')"
L20 <span> :class="colorCls"
L20 <slot> name="icon"
```

**展示数据与动态文案（不得丢失）：**

```text
L22 title
L23 desc
```

**组件公开接口原文：**

```js
L6 const props = defineProps({
L7   title:   String,
L8   desc:    String,
L9   variant: { type: Number, default: 1 }, // 1..6 兼容旧调用
L10   color:   { type: String, default: '' }, // blue | peach | sage | lavender
L11 })
L12 const emit = defineEmits(['click'])
```

### 63. 横向标签选择

源文件：`web/frontend/student/src/components/wt/WtTabs.vue` · 模板 [L15](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtTabs.vue:15) · 脚本 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtTabs.vue:1) · 样式 [L29](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtTabs.vue:29)。

**具体视觉重排：** `.wt-tabs` 保持横向胶囊，active深绿、未选浅青，窄屏允许横滚或换行，不转成左侧菜单。

**功能、状态和边界：** 保留modelValue String/Number、options及value稳定key，pick同时emit update:modelValue与change，role tablist/tab、aria-selected和active判定；不能仅改选中视觉而不发事件。

**可编辑的现有结构类：** `.wt-tabs` L16；`.wt-tab` L22。

**原样保留的模板契约：**

```vue
L16 <div> role="tablist"
L17 <button> v-for="o in options" :key="o.value" role="tab" :aria-selected="modelValue === o.value" :class="{ active: modelValue === o.value }" @click="pick(o)"
```

**展示数据与动态文案（不得丢失）：**

```text
L25 o.label
```

**冻结的脚本处理器/生命周期锚点：**

```js
L9 function pick(o) {
```

**组件公开接口原文：**

```js
L4 defineProps({
L5   modelValue: { type: [String, Number], default: '' },
L6   options:    { type: Array, default: () => [] },
L7 })
L8 const emit = defineEmits(['update:modelValue', 'change'])
```

### 64. 状态标签

源文件：`web/frontend/student/src/components/wt/WtTag.vue` · 模板 [L9](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtTag.vue:9) · 脚本 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtTag.vue:1) · 样式 [L16](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtTag.vue:16)。

**具体视觉重排：** `.wt-tag` 统一圆角胶囊，brand深绿/浅绿，accent淡黄，success/warning/neutral仍能分辨，dot保留。

**功能、状态和边界：** 保留type/dot、动态类型class和默认slot；业务页面文字是状态真值，不能为配色合并警告与成功。

**可编辑的现有结构类：** `.wt-tag` L10；`.wt-dot` L11。

**原样保留的模板契约：**

```vue
L10 <span> :class="`wt-tag--${type}`"
L11 <span> v-if="dot"
```

**组件公开接口原文：**

```js
L3 defineProps({
L4   type: { type: String, default: 'brand' }, // brand | accent | success | warning | neutral
L5   dot:  Boolean,
L6 })
```

### 65. 明暗主题切换

源文件：`web/frontend/student/src/components/wt/WtThemeToggle.vue` · 模板 [L25](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtThemeToggle.vue:25) · 脚本 [L1](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtThemeToggle.vue:1) · 样式 [L36](E:/work/毕业设计UI原型/Ai-campus/.worktrees/tongpin-ui-redesign/web/frontend/student/src/components/wt/WtThemeToggle.vue:36)。

**具体视觉重排：** `.wt-theme` 作为顶部/底部操作区的小型按钮，浅色视觉对齐深绿；暗色仍需保留可读配色和焦点态，不能只隐藏切换按钮来完成浅色原型。

**功能、状态和边界：** 保留toggle/apply、data-theme写入、localStorage wutong-theme读取/持久化、change emit、启动恢复、light/dark图标条件和动态aria-label。主题功能保持原有调用关系。

**可编辑的现有结构类：** `.wt-theme` L26。

**原样保留的模板契约：**

```vue
L26 <button> @click="toggle" :aria-label="theme === 'dark' ? '切换为浅色' : '切换为深色'"
L27 <svg> v-if="theme === 'dark'"
L30 <svg> v-else
```

**冻结的脚本处理器/生命周期锚点：**

```js
L7 function apply(t) {
L13 onMounted(() => {
L22 function toggle() { apply(theme.value === 'dark' ? 'light' : 'dark') }
```

**组件公开接口原文：**

```js
L5 const emit = defineEmits(['change'])
```

## 完成判定

逐节将源码绑定清单与最终模板对照；65个文件中的现有控件、状态和数据仍可访问，常驻侧栏为零，主要路由与3D嵌入路由共用同一业务组件。对交互复杂页面至少覆盖正常、空、加载、失败、禁用和权限分支；没有对应实际状态数据时明确记录未验证，不用静态截图宣称全功能通过。UI实现前后所有script块、API/store/router/utils/features应保持一致；本附录本身不宣称这些业务流程已实测。
