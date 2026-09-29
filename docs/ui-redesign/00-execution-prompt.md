# 基于「同频」原型改造 AI 校园双端 UI：完整执行提示词

> 交付性质：这是供后续开发执行的改版提示词、源码修改说明和验收契约。本次整理没有把下面的样式改动应用到正式业务代码。不能把提示词中的「要求」写成已经实现的事实。
>
> 适用仓库：`E:\work\毕业设计UI原型\Ai-campus`；执行工作区：`E:\work\毕业设计UI原型\Ai-campus\.worktrees\tongpin-ui-redesign`；唯一工作分支：`feat/tongpin-ui-redesign`。
>
> 源码定位基准：Git 提交 `91214e0`。文档中的旧代码行号用于定位；插入代码后以文件路径、组件名、函数名及模板锚点为准。

## 1. 可以直接交给开发代理的总指令

你是一名负责生产系统 UI 改造的 Vue 3 前端工程师。请在已经创建好的 `feat/tongpin-ui-redesign` 分支中，把本项目的学生端和管理后台统一改为 `ui-prototype/tongpin-campus.html` 的视觉风格，完成两个前端的所有页面、弹窗、抽屉、表单、列表、详情和异常状态。只改变展示层，不改变现有功能行为。

第一优先级是完整保留原功能，第二优先级是消除传统常驻侧边栏并统一为同频风格，第三优先级是动效和装饰。不得为了视觉还原而减少字段、删除入口、隐藏按钮、简化流程或改写业务。不要只改首页、只改背景颜色或只交付静态演示。

先完整阅读本文件及后面的两端逐页契约和验证说明，然后实施。不需要重新设计业务、升级依赖或另起前端项目。以实际源码为事实依据；README 和原型若与源码不同，以源码为准。遇到文档未列出的真实功能，补进功能矩阵并保留，而不是忽略。

实施完成前，你必须证明：所有原页面仍可达；所有原操作在原来的角色和状态下仍可见且可执行；所有 API、状态管理、认证、WebSocket、AI 流式响应、上传、OCR、分页和数据结构未变；两端均没有常驻左侧应用导航；明暗主题和移动端可用。

这里的「所有功能都显示」指：对具有原权限的用户，每个原功能有明确、可见、可点击的入口，并在满足原条件的页面或弹层中完整呈现。并非把所有表单同时堆在首页，也不是向无权限用户展示管理员专属操作。不能用「页面地址还存在」「可以搜索到」「按钮还留在 DOM」代替可见入口。

请一直执行到全部范围完成并验收。没有真实运行证据时，不得声称「完美适配」「全功能通过」；必须列出待验证项及具体阻塞。禁止通过删除断言、改返回数据、模拟成功或隐藏错误来通过验收。

## 2. 分支、工作区与原文件保护

已经有独立分支和工作区，不要再创建同名分支，也不要在原目录切换分支：

```powershell
Set-Location -LiteralPath 'E:\work\毕业设计UI原型\Ai-campus\.worktrees\tongpin-ui-redesign'
git branch --show-current
git status --short
git log -1 --oneline
```

第一条输出必须为 `feat/tongpin-ui-redesign`。后续所有应用修改、图片、文档、检查报告和提交都放在此工作区，提交在此分支。不要合并、推送、部署，也不要移动或覆盖原工作区的未提交文件。

原目录存在用户尚未提交的 `application.yml` 修改、文档删除及未跟踪文件。本分支从 `91214e0` 的已提交代码建立，不包含这些未提交变化；它们保留在原目录。这不授权你复制环境文件、数据库备份或私密凭据。

参考文件已经放入本分支：

- `ui-prototype/tongpin-campus.html`：独立、可离线打开的完整视觉原型。
- `ui-prototype/tongpin-assets/campus-map.svg`：可复用的校园地图插画源文件。
- `ui-prototype/tongpin-assets/preview-desktop.png`、`preview-mobile.png`：已检查的视觉截图。
- `scripts/ui-contract-audit.mjs`：保护原有代码和模板绑定的审计工具。
- `docs/ui-redesign/ui-contract-baseline.json`：原始提交的功能契约快照。

`docs/` 被本仓库 `.gitignore` 忽略。提交本任务文档时只能对明确文件使用 `git add -f`；不要强制添加整个被忽略目录或整个工作区。

## 3. 严格的修改边界

### 3.1 允许改动

1. 两端 `src/styles/tokens.css`、`base.css`、`element-theme.css` 中的展示样式。
2. 现有 `.vue` 的 `<style>`；现有 `<template>` 的静态展示文案、装饰、class、静态 style、结构容器及模块摆放位置。
3. 在模板中新增指向**已有路径**的 `<router-link>`；新增调用**现有导航方法**的展示入口。不得带入新的权限或业务分支。
4. 两端 `public/images/` 下新增本次插画等静态资源。保留现有图片回退逻辑、真实用户图片、头像和上传内容。
5. 新增文档、截图和独立审计工具。新 UI 入口有任何计算逻辑时先寻找已有绑定，优先纯模板实现；本方案不需要修改现有脚本来注册新组件。

### 3.2 冻结内容

- `web/backend/**`、数据库、Docker、部署、环境与配置文件。
- 两端 `src/api/**`、`src/store/**`、`src/router/**`、`src/utils/**`、`src/features/**` 的现有代码。
- 两端所有现有 `.vue` 的 `<script>` / `<script setup>` 内容及脚本属性；除 CRLF/LF 差异外逐字保持。即便某常量看起来只是图标或导航，也不要在本任务顺手改写。
- `main.js`、`App.vue` 的逻辑、`package.json`、lockfile、Vite 配置、已有测试及测试断言。
- 路由 path/name/meta/props/redirect、query 参数、列表返回状态、鉴权守卫、角色判定、Token 键、请求参数、响应处理、轮询时间、WebSocket 生命周期、AI/OCR/PDF/编辑器/二维码逻辑。
- 原模板的事件表达式、修饰符、`v-model`、条件、循环和 key、ref、业务 props、组件事件、slot、字段映射、validator、分页参数、原始插值及状态说明。
- 表达业务状态的动态 `:style` / `:class` 语义，例如 3D 移动进度、画布尺寸、审核风险色、状态高亮。审计会放行 class/style 的展示改动，这不代表允许删掉业务绑定。

不允许把 `<el-table>` 换成只显示部分信息的静态卡片；不允许把 `<el-upload>` 换成普通按钮；不允许把 Monaco、Canvas、二维码、富文本、Markdown、PDF 等换成截图。

移动一个已有控件时，应移动完整的原始节点或完整逻辑块，保留它的父级条件和作用域。尤其不能把 `scope.row` 的按钮移出它的插槽，不能拆开 `v-if/v-else-if/v-else` 链，不能让重复挂载的组件产生第二次 API 请求或第二条 WebSocket 连接。

若确实只有修改逻辑才能解决发现的问题，先记录为原有缺陷，继续其余展示工作；单独列出所需逻辑改动和理由，等待另行授权。本任务不能顺手修复或重构业务。

### 3.3 明确禁止迁移的原型内容

不得复制原型的 `initialItems`、虚构用户、演示天气、128 人在线、假报名、模拟 AI、localStorage 业务数据、固定课表、25 分钟计时器或发布实现到真实系统。原型的本地功能是交互展示，不是本项目的业务实现。

真实系统已有功能全部保留；原型有而项目没有的功能不新增。例如没有真实专注计时逻辑时，不在正式学习页面放置假计时按钮。允许把已有错题复习计划、AI 入口或学习搭子排成类似便笺的视觉。

保持真实站点名称及已有账号信息，不把真实「梧桐校园」强行写死成演示品牌「同频」，不更改后台站点配置。这里的「同频」指视觉方案。

## 4. 目标界面与全功能信息架构

### 4.1 学生端

```text
品牌 / 原搜索范围+关键词+按钮 / 主题 / 未读通知 / 发布 / 用户
现有 desktopNav 的横向校园服务带 / 全部功能按钮
面包屑与公告、私信、错题、个人主页原快捷入口
┌─────────────────────────────┬──────────────┐
│ 同频插画校园 + 原 Hero 文案   │ AI 学习便笺   │
│ 地图入口 + 原活动预告        │ 原日程/错题数 │
└─────────────────────────────┴──────────────┘
原四个快捷服务 / 活动与失物筛选 / 闲置 / 动态 / 公告
所有原页面内容经 router-view 按原路由显示
          悬浮 Dock：发现 / 活动 / 学习 / 生活 / 我的 / 全部
```

应用侧边栏取消；完整导航改为居中的「全部功能」面板；首页内容可以有非对称双栏，双栏中的业务内容不属于侧边导航。聊天会话、AI 历史、编辑器工作区属于业务内容，不能直接删掉，按照后续页面契约改为顶部切换或内容面板。

常驻 Dock 是主要入口，不是全部功能清单。用服务带、页面内功能工具条、完整功能面板补足全部模块。不能把 3D、问答、搭子、游戏、公告和消息挤成无文字的小图标。

| 分组 | 必须可见的原功能入口 | 既有路由 / 页面内入口 |
|---|---|---|
| 发现 | 综合门户、全局搜索、3D 校园、公告 | `/`、`/search`、`/campus-3d`、`/notice` |
| 活动 | 活动列表、详情、发布、我的报名、签到及运营操作 | `/activity`、`/activity/detail/:id`、`/activity/publish`、`/activity/my-signup`，详情页原控件 |
| 学习 | AI 答疑、PDF、代码纠错、错题全套流程、学习搭子、互助问答 | `/ai/chat` 内原 PDF 流程、`/ai/code`、`/ai/wrong`、`/partner`、`/partner/publish`、`/qa`、`/qa/my`、`/qa/publish`、`/qa/detail/:id` |
| 生活 | 闲置、预约管理、失物、动态、游戏 | `/idle`、`/idle/appointments`、`/idle/publish`、`/idle/detail/:id`、`/lostfound`、`/lostfound/publish`、`/lostfound/detail/:id`、`/social`、`/draw-guess`、`/draw-guess/room/:roomId` |
| 我的 | 个人资料及所有原 Tabs、通知、私信、他人主页、退出 | `/profile`、`/message`、`/chat`、`/chat/:conversationId`、`/user/:id`、原用户菜单 |
| 账户/系统 | 登录、注册、人机验证、维护页 | `/login`、`/register`、`/maintenance` |

不要新增 `/study` 或 `/life` 路由来替换现有页面。Dock 的学习进入 `/ai/chat`，生活进入 `/idle`；相关模块通过清晰的二级导航分别进入原路由。所有原 URL 直接访问、刷新、返回、带 query 访问继续有效。

### 4.2 管理端

```text
品牌 / 面包屑 / 原全局搜索 / 主题 / 待办与重试 / 退出 / 当前管理员
概览 | 内容审核 | 内容管理 | 用户与社区 | 系统      ← 五组横向按钮
选中组的原功能叶子与原待办数字                   ← 第二行工具带
全宽原业务页：筛选 / 统计 / 完整表格 / 操作 / 分页 / 弹窗
```

后台不照抄学生的校园插画大首页，不在密集表格页面塞大图和装饰。统一颜色、圆角、字体及留白，保持运营效率。以原 `visibleGroups` 权限过滤结果渲染导航；不能为了「所有功能显示」让审核员看到 `superOnly` 入口。

十五个导航叶子必须全部保留：数据看板，活动/闲置/失物/动态/搭子五类审核，AI 内容审核，内容管理，用户管理，举报处理，系统公告，AI 配置，调用日志，系统配置，管理员账号。其中最后两项只向超级管理员显示。公告新增/编辑继续走 `/notice/edit/:id?`。

后台内部路径不要手工加 `/admin`；`createWebHistory('/admin/')` 已处理基路径。原布局中的搜索实际上导航到 `/user?q=...`，不能借 UI 改版把它擅自扩展为新的搜索服务。

## 5. 可直接使用的视觉参数与基础样式

### 5.1 两端 tokens.css

修改两个文件：

- `web/frontend/student/src/styles/tokens.css`，原 `:root` 和 `:root[data-theme="dark"]`。
- `web/frontend/admin/src/styles/tokens.css`，同名段；管理端已有 `--side-*` 不删除，在新横向导航中映射为浅色表面。

用以下值逐项替换已有同名变量，新增 `--atlas-*`。保留本段未列出的全部 token；不要删除语义色、字体、间距变量。一个主题内每个变量只保留一个最终定义：

```css
:root {
  --paper: #f4f6f5;
  --surface: #ffffff;
  --surface-2: #edf2ee;
  --surface-3: #e5ebe6;
  --ink: #243c36;
  --ink-2: #4d6258;
  --ink-3: #627568;
  --line: #dde5df;
  --line-strong: #b9c9bf;
  --brand: #244f46;
  --brand-strong: #193d35;
  --brand-deep: #12332c;
  --brand-ink: #ffffff;
  --brand-soft: #e5eee8;
  --brand-line: #bdcfc3;
  --accent: #e9efb0;
  --accent-strong: #d9e58b;
  --accent-ink: #3f512b;
  --accent-soft: #f4f7dc;
  --accent-line: #d6dfad;
  --peach: #f4d7ca;
  --sage: #dce7d9;
  --atlas-sky: #e1edf1;
  --atlas-lilac: #dfe2f2;
  --atlas-lime: #e9efb0;
  --atlas-coral: #efb8aa;
  --success: #327449;
  --success-soft: #e7f2e9;
  --warning: #936511;
  --warning-soft: #fbf1d9;
  --error: #b53f3f;
  --error-soft: #fbe9e7;
  --info: #346d8a;
  --info-soft: #e8f1f5;
  --r-xs: 6px;
  --r-sm: 10px;
  --r-md: 14px;
  --r-lg: 20px;
  --r-xl: 26px;
  --r-pill: 999px;
  --font-sans: "Microsoft YaHei", "PingFang SC", "Segoe UI", system-ui, sans-serif;
  --font-display: "Microsoft YaHei", "PingFang SC", "Segoe UI", system-ui, sans-serif;
  --fs-display: 2.5rem;
  --fs-h1: 1.875rem;
  --fs-h2: 1.375rem;
  --fs-h3: 1.125rem;
  --fs-body: 1rem;
  --fs-sm: .875rem;
  --fs-xs: .75rem;
  --fs-cap: .75rem;
  --shadow-sm: 0 2px 8px rgb(36 79 70 / 4%);
  --shadow-md: 0 8px 24px rgb(36 79 70 / 8%);
  --shadow-lg: 0 20px 60px rgb(36 79 70 / 14%);
}
:root[data-theme="dark"] {
  --paper: #14231f;
  --surface: #1d3029;
  --surface-2: #273d33;
  --surface-3: #31483b;
  --ink: #edf3eb;
  --ink-2: #c4d3c5;
  --ink-3: #a0b3a3;
  --line: #385245;
  --line-strong: #66806d;
  --brand: #b7ce9b;
  --brand-strong: #c9ddaf;
  --brand-deep: #99ba7c;
  --brand-ink: #172a20;
  --brand-soft: #2f4934;
  --brand-line: #4c6b4f;
  --accent: #d3df94;
  --accent-strong: #e6edb3;
  --accent-ink: #293720;
  --accent-soft: #3b452b;
  --accent-line: #627142;
  --peach: #49372d;
  --sage: #304b36;
  --atlas-sky: #283e43;
  --atlas-lilac: #383b53;
  --atlas-lime: #3d482b;
  --atlas-coral: #523930;
  --success: #9bc79d;
  --success-soft: #294733;
  --warning: #e9c574;
  --warning-soft: #4b4029;
  --error: #f1a3a1;
  --error-soft: #513332;
  --info: #a0cddd;
  --info-soft: #2b444e;
}
```

原暗色主题开关、保存键、事件全部保持。不要移除深色主题以简化工作。英文装饰可在少量静态短句使用 Georgia，中文正文、表单、表格不能改为花体或原型里过小的 9px 字号。正文 14–16px，辅助信息至少 12px，交互文字不小于 12px。

### 5.2 base.css

在两端已有基础样式中合并以下规则，不增加第二套全局 reset，不用 `body { overflow:hidden }` 掩盖溢出：

```css
html { scroll-padding-block: 96px 120px; }
body { overflow-wrap: break-word; }
button, input, textarea, select { font: inherit; }
button, a, input, textarea, select { -webkit-tap-highlight-color: transparent; }
button, [role="button"], .el-button { touch-action: manipulation; }
button:focus-visible, a:focus-visible, input:focus-visible,
textarea:focus-visible, select:focus-visible, [tabindex]:focus-visible {
  outline: 3px solid var(--brand);
  outline-offset: 3px;
}
.btn.primary { color: var(--brand-ink); }
.tp-page-panel {
  min-width: 0;
  padding: clamp(16px, 2vw, 28px);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-xl);
}
.tp-page-tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.tp-page-tools > * { min-width: 0; }
.tp-local-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-block: 8px 20px;
}
.tp-local-nav a {
  display: inline-flex;
  align-items: center;
  min-height: 42px;
  padding: 8px 16px;
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  background: var(--surface);
}
.tp-local-nav a.router-link-exact-active {
  color: var(--brand-ink);
  background: var(--brand);
  border-color: var(--brand);
}
.tp-user-text { min-width: 0; overflow-wrap: anywhere; }
.tp-table-scroll { max-width: 100%; min-width: 0; overflow-x: auto; }
@media (max-width: 600px) {
  .tp-page-tools > .el-input, .tp-page-tools > .el-select { width: 100%; }
  .el-input__inner, .el-textarea__inner { font-size: 16px; }
  .el-pagination { max-width: 100%; flex-wrap: wrap; row-gap: 10px; }
}
```

新 class 加到原容器上，不能为加 class 而替换表单/表格组件。聊天代码块、Markdown 表格允许在局部容器滚动；长标题、普通消息和发布内容必须自然换行。Canvas 和游戏区域保留原手势与尺寸规则，不对所有元素统一强制 `touch-action` 或缩放。

### 5.3 element-theme.css

保留两端现有主题映射，在明暗两段把硬编码的蓝色 primary 派生色改成基于现有 token 的值：

```css
:root {
  --el-color-primary: var(--brand);
  --el-color-primary-light-3: color-mix(in srgb, var(--brand) 70%, var(--surface));
  --el-color-primary-light-5: color-mix(in srgb, var(--brand) 50%, var(--surface));
  --el-color-primary-light-7: color-mix(in srgb, var(--brand) 30%, var(--surface));
  --el-color-primary-light-8: color-mix(in srgb, var(--brand) 20%, var(--surface));
  --el-color-primary-light-9: var(--brand-soft);
  --el-color-primary-dark-2: var(--brand-strong);
  --el-border-radius-base: 12px;
  --el-border-radius-small: 8px;
}
.el-card { border-radius: var(--r-xl); box-shadow: none; }
.el-dialog { border-radius: var(--r-xl); max-width: calc(100vw - 32px); }
.el-dialog__body { min-width: 0; overflow-wrap: anywhere; }
.el-drawer { max-width: 100vw; }
.el-table { --el-table-header-bg-color: var(--surface-2); }
.el-table th.el-table__cell { color: var(--ink-2); font-weight: 600; }
.el-button--primary { --el-button-text-color: var(--brand-ink); }
.el-button--danger { --el-button-text-color: #fff; }
```

同样修正原 `:root[data-theme="dark"]` 中的 primary 派生项，避免它覆盖上面的新值。成功/警告/危险按钮保持语义色，不能全部变成绿色。Dialog/Drawer 是业务内容容器，可以保留；用户不要的是应用导航侧栏，不是取消全部详情抽屉。

不要把所有弹窗统一改为固定高度或删除原宽度。大表单、PDF、错题详情、成员名单要使用视口内滚动；确认框不得被 Dock 覆盖。原 Element Plus popper Teleport 到 body，主题 token 必须在 `:root` 生效。

## 6. 学生 MainLayout.vue：精确改法

文件：`web/frontend/student/src/layout/MainLayout.vue`。基线 `<template>` 为 1–166 行；`<script setup>` 168–368 行；`<style scoped>` 从 370 行开始。整个脚本原样保留。

### 6.1 先确认必须保留的原节点

- `navGroups` 的全部循环、`item.to`、`isActive(item.to)`、`ICONS[item.icon]`。
- `desktopNav` 的八项链接，不把数组缩减为 Dock 五项。
- `@submit.prevent="onSearch"`、`v-model="searchType"`、`v-model="keyword"`、`searchPlaceholder`、五个 option 和 `search-submit` class。
- `WtThemeToggle`、`WtAvatar`，登录/未登录两个分支。
- `.bell-wrap` class 和 `messageStore.unread + chatStore.unreadTotal` 及 hidden 条件。脚本使用 `.bell-wrap` 做事件委托，不能改名。
- 两个 `el-dropdown` 的 `@command="onPublishCommand"` / `@command="onCommand"`，五个发布 command、profile/wrong/logout command。
- `utility-path`、`pageTitle`、公告/私信/错题/个人主页快捷链接。
- 唯一的 `<router-view />`；不能多挂一份路由页面用于手机布局。
- 原 footer、维护/帮助链接及原 `drawerOpen` 开关事件。

### 6.2 把抽屉变成居中的完整功能面板

将原 `aside.sidebar.student-drawer` **完整移动**到 `el-dialog` 内。原 `:class="{ open: drawerOpen }"`、循环、链接、avatar 和事件全部保留。`aside` 标签作为语义容器可以保留，但样式不得再定位为左侧栏。

用下面的完整块替换模板最上方的原 aside 和其后的 drawer-scrim 按钮；内容已按基线原样展开：

```vue
<el-dialog
  v-model="drawerOpen"
  title="全部校园功能"
  class="tp-services-dialog"
  width="min(960px, calc(100vw - 32px))"
  append-to-body
>
    <aside class="sidebar student-drawer" :class="{ open: drawerOpen }" aria-hidden="!drawerOpen">
      <div class="drawer-brand">
        <a class="brand" @click="go('/')">
          <span class="brand-symbol" v-html="BRAND_MARK"></span>
          <span><b>梧桐校园</b></span>
        </a>
        <button class="icon-btn mobile-menu" aria-label="关闭导航" @click="drawerOpen = false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <nav class="side-scroll" aria-label="全部功能">
        <template v-for="group in navGroups" :key="group.label">
          <div class="nav-group">{{ group.label }}</div>
          <router-link
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="nav-link"
            :class="{ active: isActive(item.to) }"
            @click="drawerOpen = false"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="ICONS[item.icon]"></svg>
            {{ item.label }}
          </router-link>
        </template>
      </nav>
      <div class="sidebar-bottom">
        <router-link class="user-chip" :to="userStore.isLoggedIn ? '/profile' : '/login'">
          <WtAvatar :name="userStore.userInfo?.nickname || '梧'" :src="userStore.userInfo?.avatar" size="sm" />
          <span>
            <b>{{ userStore.isLoggedIn ? (userStore.userInfo?.nickname || '校园用户') : '未登录' }}</b>
            <small>{{ userStore.isLoggedIn ? '个人中心' : '点击登录' }}</small>
          </span>
        </router-link>
      </div>
    </aside>
  <template #footer>
    <button v-if="drawerOpen" class="drawer-scrim" aria-label="收起导航" @click="drawerOpen = false">收起全部功能</button>
  </template>
</el-dialog>
```

上面已经包含完整原节点，不要另保留一套重复抽屉。原 `.drawer-scrim` 不再是额外遮罩；Element Plus 提供遮罩和焦点约束。把 `.drawer-scrim` 样式重置为普通底部关闭按钮。原 `.mobile-menu` 打开按钮在桌面也显示，将可见文字改为「全部功能」，保留 `@click="drawerOpen = true"`。

对应样式替换原 `.student-drawer` 及相关的侧滑/固定定位规则：

```css
.student-drawer {
  position: static;
  inset: auto;
  width: auto;
  height: auto;
  min-height: 0;
  max-height: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  transform: none;
  visibility: visible;
  opacity: 1;
  overflow: visible;
  background: var(--surface);
  color: var(--ink);
  box-shadow: none;
}
.student-drawer.open { transform: none; }
.student-drawer .side-scroll {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  overflow: visible;
}
.student-drawer .nav-group {
  grid-column: 1 / -1;
  padding: 16px 4px 6px;
  color: var(--ink-2);
  font-weight: 600;
}
.student-drawer .nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--surface-2);
  color: var(--ink);
}
.student-drawer .nav-link.active { background: var(--brand); color: var(--brand-ink); }
.student-drawer .sidebar-bottom { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--line); }
.drawer-scrim {
  position: static;
  inset: auto;
  width: auto;
  height: auto;
  min-height: 44px;
  padding: 10px 20px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface-2);
  color: var(--ink);
  opacity: 1;
}
.mobile-menu { display: inline-flex; align-items: center; gap: 8px; }
@media (max-width: 600px) {
  .student-drawer .side-scroll { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
```

检查旧媒体查询是否再次设置 `.student-drawer` 为固定侧栏或隐藏 `.mobile-menu`，删除这些互相冲突的展示声明。不要在主区留 232px/256px 的侧栏占位。

### 6.3 顶栏、搜索与服务带

保留 header 内品牌与 `.top-actions` 原完整节点。将 `nav.desktop-nav` 完整移到 header 后的全宽服务带；仍渲染 `desktopNav`，不改任何 link 的动态绑定。大屏单行或换行，小屏两行换行，显示全部八项名称，不能 `display:none`。

```css
.campus-header { height: auto; min-height: 84px; background: var(--paper); border-bottom: 0; }
.header-inner {
  min-height: 84px;
  width: 100%;
  max-width: 1440px;
  margin: auto;
  padding: 16px 32px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.top-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; min-width: 0; }
.desktop-nav {
  width: min(100% - 64px, 1376px);
  height: auto;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 0 16px;
}
.desktop-link { height: auto; min-height: 40px; padding: 8px 14px; border-radius: 24px; font-size: 13px; }
.desktop-link.active { background: var(--brand-soft); color: var(--brand); }
.desktop-link.active::after { display: none; }
.utility-bar { max-width: 1376px; width: calc(100% - 64px); margin: auto; padding: 12px 0; flex-wrap: wrap; gap: 12px; }
.utility-links { flex-wrap: wrap; gap: 16px; }
.content { width: 100%; max-width: 1440px; margin: auto; padding: 24px 32px 120px; }
.footer { padding-bottom: calc(100px + env(safe-area-inset-bottom)); }
@media (max-width: 760px) {
  .header-inner { padding: 16px; gap: 12px; }
  .top-actions { width: 100%; margin-left: 0; }
  .header-search {
    display: grid;
    order: 10;
    width: 100%;
    height: 44px;
    grid-template-columns: 76px minmax(0, 1fr) 58px;
  }
  .header-search input { min-width: 0; height: 42px; }
  .desktop-nav, .utility-bar { width: calc(100% - 32px); }
  .content { padding: 20px 16px 112px; }
  .header-publish, .header-login, .search-link { display: inline-flex; }
}
```

原窄屏隐藏搜索表单的规则必须被替换。范围 select、输入框、明确提交按钮在手机上也同时可见。只保留放大镜并跳到另一页不符合原测试和本需求。

### 6.4 增加底部 Dock（模板代码）

在 `.main` 末尾、footer 后添加以下导航。不改 `desktopNav` / `navGroups` / `PAGE_TITLES`；直接使用已有 `isActive` 和 `drawerOpen`。这些只连接原页面，不创建新业务：

```vue
<nav class="tp-dock" aria-label="校园主要导航">
  <router-link to="/" :class="{ active: isActive('/') }" :aria-current="isActive('/') ? 'page' : undefined">发现</router-link>
  <router-link to="/activity" :class="{ active: isActive('/activity') }" :aria-current="isActive('/activity') ? 'page' : undefined">活动</router-link>
  <router-link to="/ai/chat" :class="{ active: isActive('/ai') || isActive('/partner') || isActive('/qa') }" :aria-current="isActive('/ai') || isActive('/partner') || isActive('/qa') ? 'page' : undefined">学习</router-link>
  <router-link to="/idle" :class="{ active: isActive('/idle') || isActive('/lostfound') || isActive('/social') || isActive('/draw-guess') }" :aria-current="isActive('/idle') || isActive('/lostfound') || isActive('/social') || isActive('/draw-guess') ? 'page' : undefined">生活</router-link>
  <router-link to="/profile" :class="{ active: isActive('/profile') || isActive('/user') || isActive('/message') || isActive('/chat') }" :aria-current="isActive('/profile') || isActive('/user') || isActive('/message') || isActive('/chat') ? 'page' : undefined">我的</router-link>
  <button type="button" class="tp-dock-all" :aria-expanded="drawerOpen" @click="drawerOpen = true">全部</button>
</nav>
```

```css
.tp-dock {
  position: fixed;
  left: 50%;
  bottom: calc(20px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 80;
  display: flex;
  gap: 6px;
  width: min(560px, calc(100vw - 24px));
  padding: 8px;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: color-mix(in srgb, var(--surface) 94%, transparent);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(16px);
}
.tp-dock > a, .tp-dock > button {
  flex: 1;
  min-width: 0;
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  border: 0;
  border-radius: 16px;
  background: transparent;
  color: var(--ink-2);
  font-size: 13px;
  cursor: pointer;
}
.tp-dock > a.active { background: var(--brand); color: var(--brand-ink); }
.tp-dock > .tp-dock-all { background: var(--accent); color: var(--accent-ink); }
@media (max-width: 600px) {
  .tp-dock { bottom: calc(12px + env(safe-area-inset-bottom)); gap: 3px; padding: 6px; }
  .tp-dock > a, .tp-dock > button { font-size: 12px; min-height: 46px; padding: 8px 4px; }
}
```

添加图标可以用模板内静态 SVG，但每项始终有文字。若与聊天发送栏、游戏工具栏、Drawer 底部重叠，优先增加页面底部安全空间；原生弹窗层级高于 Dock。不能为了避免覆盖直接隐藏发送或提交按钮。

### 6.5 让次级功能直接可发现

在 `main.content` 的 `<router-view />` **之前**插入以下上下文导航；已有页面内重复入口可以保留，但不得删除原绑定：

```vue
<nav v-if="isActive('/ai') || isActive('/partner') || isActive('/qa')" class="tp-local-nav" aria-label="学习功能">
  <router-link to="/ai/chat">AI 答疑与 PDF</router-link>
  <router-link to="/ai/code">代码纠错</router-link>
  <router-link to="/ai/wrong">错题本</router-link>
  <router-link to="/partner">学习搭子</router-link>
  <router-link to="/qa">互助问答</router-link>
  <router-link to="/qa/my">我的问答</router-link>
</nav>
<nav v-if="isActive('/idle') || isActive('/lostfound') || isActive('/social') || isActive('/draw-guess')" class="tp-local-nav" aria-label="校园生活功能">
  <router-link to="/idle">闲置互换</router-link>
  <router-link to="/idle/appointments">我的预约</router-link>
  <router-link to="/lostfound">失物招领</router-link>
  <router-link to="/social">动态广场</router-link>
  <router-link to="/draw-guess">你画我猜</router-link>
</nav>
<nav v-if="isActive('/activity')" class="tp-local-nav" aria-label="活动功能">
  <router-link to="/activity">发现活动</router-link>
  <router-link to="/activity/my-signup">我的报名</router-link>
  <router-link to="/activity/publish">发布活动</router-link>
</nav>
```

所有链接仍经过原路由守卫。对按钮原本存在的 `needLogin` 或角色条件不得绕过；这些新入口不调用写入接口。

## 7. 首页与校园插画：改组件外观，保留聚合数据

### 7.1 资源放置

```powershell
Copy-Item -LiteralPath 'ui-prototype\tongpin-assets\campus-map.svg' -Destination 'web\frontend\student\public\images\tongpin-campus-map.svg'
```

不得把原型整页嵌入 iframe 当作真实首页。原型的 CSS 不能整份全局粘贴，会污染真实组件和管理后台。

### 7.2 WtHero.vue

文件：`web/frontend/student/src/components/wt/WtHero.vue`。保留全部 props、`go`、原有模板条件、照片 `:src="photo"`、活动 `@click="go(event.to)"` / `@keydown.enter="go(event.to)"` 及全部 event 字段。`Home.vue` 的 `<WtHero>` 调用及 `photo="/images/campus-v2.webp"` 等原属性不变。

在原 `.hero-copy` 后、`.hero-photo` 前添加插画区域，用现有 `go` 跳转：

```vue
<div class="tp-hero-campus" aria-label="探索校园服务">
  <img class="tp-hero-map" src="/images/tongpin-campus-map.svg" alt="图书馆、运动场与校园广场组成的插画校园" />
  <button type="button" class="tp-map-link tp-map-library" @click="go('/ai/chat')">学习空间</button>
  <button type="button" class="tp-map-link tp-map-field" @click="go('/activity')">校园活动</button>
  <button type="button" class="tp-map-link tp-map-square" @click="go('/social')">动态广场</button>
  <button type="button" class="tp-map-link tp-map-3d" @click="go('/campus-3d')">走进 3D 校园</button>
</div>
```

原 `.hero-photo` 保留为整个 Hero 下方的横向「校园照片 + 真实活动预告」带，不能为了画面干净删去 `event` 或把它换成示例音乐会。主图区由原文案和插画组成：

```css
.campus-hero {
  display: grid;
  grid-template-columns: minmax(240px, .8fr) minmax(0, 1.2fr);
  grid-template-areas: "copy map" "photo photo";
  gap: 0;
  padding: 28px;
  border-radius: 26px;
  background: var(--atlas-sky);
  overflow: hidden;
}
.hero-copy { grid-area: copy; position: relative; z-index: 1; padding: 8px 0; }
.hero-copy h1 { font-size: clamp(28px, 2.7vw, 42px); line-height: 1.4; letter-spacing: -1px; }
.hero-description { color: var(--ink-2); font-size: 14px; }
.hero-actions { flex-wrap: wrap; }
.hero-actions .btn { border-radius: 999px; }
.hero-actions .btn.primary { color: var(--brand-ink); }
.hero-personal { display: flex; flex-wrap: wrap; font-size: 12px; }
.tp-hero-campus { grid-area: map; position: relative; min-width: 0; min-height: 330px; }
.tp-hero-map { width: 100%; height: 100%; min-height: 330px; object-fit: contain; }
.tp-map-link {
  position: absolute; z-index: 2; min-height: 40px; padding: 8px 12px;
  border: 1px solid var(--line); border-radius: 12px;
  color: var(--ink); background: var(--surface); box-shadow: var(--shadow-sm);
  font-size: 12px; cursor: pointer;
}
.tp-map-library { left: 40%; top: 37%; }
.tp-map-field { left: 7%; top: 58%; }
.tp-map-square { right: 3%; bottom: 18%; }
.tp-map-3d { right: 0; top: 12%; }
.hero-photo {
  grid-area: photo; position: relative; display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  align-items: center; gap: 16px; width: 100%; height: auto;
  margin-top: 24px; padding: 12px; border-radius: 18px;
  background: var(--surface);
}
.hero-photo > img { width: 160px; height: 110px; border-radius: 12px; object-fit: cover; }
.hero-event { position: static; min-width: 0; margin: 0; padding: 10px; box-shadow: none; background: transparent; }
.hero-event strong { overflow-wrap: anywhere; font-size: 15px; }
.hero-event small:not(.hero-event-date small) { font-size: 12px; }
.photo-note { top: 20px; left: 20px; right: auto; max-width: 144px; padding: 3px 6px; font-size: 10px; }
@media (max-width: 760px) {
  .campus-hero { grid-template-columns: minmax(0, 1fr); grid-template-areas: "copy" "map" "photo"; padding: 20px; }
  .tp-hero-campus, .tp-hero-map { min-height: 270px; }
  .hero-photo { grid-template-columns: minmax(0, 1fr); }
  .hero-photo > img { width: 100%; height: 130px; }
  .hero-event { padding: 6px 0; }
  .hero-personal { display: flex; }
}
```

本方案在原型风格上保留更多真实信息，不要求为像素级一致删除原活动预告和照片。`Home.test.mjs` 对 `WtHero`、照片 props、快捷条、活动图片回退和错题入口的原断言继续保留。

### 7.3 Home.vue

文件：`web/frontend/student/src/views/home/Home.vue`。模板 1–224 行；脚本从 226 行到 style 前全部冻结。特别保留 `homeAggregate`、`listNotice`、`listPost`、`listMessage`、`wrongStats`、`feedList`、`tab`、`data.idleItems.slice(0,3)`、`notices`、`wrongCount`、`heroEvent`、`helloLine`、`firstContentImage` 及 `go`。

具体结构操作：

1. 将原 `<WtHero ... />` 完整移动到新增 `.tp-home-top` 的第一列。
2. 将原 `.study-note`（164–181 行）和 `.calendar-panel`（197–213 行）完整移动到 `.tp-home-top` 第二列 `.tp-home-notes`。原 `<aside class="home-aside">` 仍保留为后续公告/消息内容区，不保留空白占位。
3. 原 `button.campus3d-entry` 完整保留，可移动到 `quick-strip` 前作为与地图一致的完整 3D 入口；`@click="go({ to: '/campus-3d' })"` 不变。
4. 原 `.quick-strip` 的四个 `WtQuickEntry`、`v-for="e in entries"`、`@click="go(e)"` 不变；改为四项横向服务条，手机 2×2，不丢入口。
5. 原 `.home-columns` 左侧活动/闲置/动态全部保留，右侧 `.home-aside` 保留公告和私信入口；所有模板插值原样。活动区原 tabs 还是 `activity/idle/lost`，不替换为原型的假「为你/学习」筛选。
6. 原活动 `loading` 骨架、`feedList.length` 内容、空态三分支连在一起。真实图片优先，`WtEventArt` 仍是 `v-else` 回退；不能统一换成插画。
7. 不伪造今日安排。如果原日程只有日期格与「查看我的报名」，仍显示该内容，把它做成时间便笺样式即可。

以下为重组后的完整顶部块。用它替换原 WtHero 节点，并从原 home-aside 中移除同一份 study-note 与 calendar-panel，确保没有重复挂载和重复显示；其余原块不变：

```vue
<div class="tp-home-top">
    <WtHero
      :hello="helloLine"
      title="课表之外，<br>还有整个校园。"
      description="找一场喜欢的活动，遇见同频的朋友。<br>学习和生活，在这里都有回应。"
      photo="/images/campus-v2.webp"
      photo-note="秋日校园 · 2026"
      :primary="{ label: '发现校园活动', to: '/activity' }"
      :secondary="{ label: '找 AI 帮忙', to: '/ai/chat' }"
      :event="heroEvent"
    />
  <div class="tp-home-notes">
        <section class="study-note">
          <div class="study-note-top">
            <span class="service-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/><circle cx="12" cy="12" r="3"/></svg>
            </span>
            <span>一点点进步，也值得</span>
          </div>
          <h3>今天的难题，<br>我们一起解。</h3>
          <p>从一个问题开始，让思路慢慢清晰。</p>
          <button type="button" class="btn primary" @click="go({ to: '/ai/chat', needLogin: true })">
            开始学习 <span aria-hidden="true">→</span>
          </button>
          <div class="study-todo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM17 3v16"/></svg>
            <span>你有 <b>{{ wrongCount }}</b> 道错题待复习</span>
            <a class="text-btn" @click="go({ to: '/ai/wrong', needLogin: true })">去复习</a>
          </div>
        </section>
        <section class="calendar-panel">
          <div class="section-title">
            <h3>我的校园日程</h3>
            <span class="muted">{{ monthLabel }}</span>
          </div>
          <div class="weekly">
            <span v-for="(d, i) in weekDays" :key="i">
              <span>{{ d.week }}</span>
              <b :class="{ today: i === todayIdx }">{{ d.day }}</b>
            </span>
          </div>
          <div class="calendar-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>
            <p>把下一次期待，安排进日程</p>
            <a class="text-btn" @click="go({ to: '/activity/my-signup', needLogin: true })">查看我的报名 <span aria-hidden="true">→</span></a>
          </div>
        </section>
  </div>
</div>
```

对应样式：

```css
.tp-home-top { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 24px; align-items: start; }
.tp-home-notes { display: grid; gap: 20px; min-width: 0; }
.study-note { padding: 26px; border: 0; border-radius: 26px; background: var(--atlas-lime); }
.study-note h3 { font-size: 28px; line-height: 1.45; }
.study-todo { flex-wrap: wrap; font-size: 13px; }
.calendar-panel, .bulletin { padding: 24px; border-radius: 24px; background: var(--surface); border: 1px solid var(--line); }
.quick-strip { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-block: 24px; }
.home-columns { grid-template-columns: minmax(0, 1fr) 320px; gap: 24px; }
.home-aside { position: static; width: auto; display: flex; flex-direction: column; gap: 20px; }
.event-card, .object-card { border-radius: 22px; overflow: hidden; background: var(--surface); }
.home-cards { gap: 20px; }
.event-cover-img { aspect-ratio: 16 / 10; object-fit: cover; }
.community-banner { background: var(--atlas-lilac); border-radius: 24px; }
.message-entry { min-height: 70px; padding: 18px; border-radius: 18px; background: var(--surface); }
@media (max-width: 1100px) {
  .tp-home-top, .home-columns { grid-template-columns: minmax(0, 1fr); }
  .tp-home-notes { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .home-aside { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 600px) {
  .quick-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .tp-home-notes, .home-aside { grid-template-columns: minmax(0, 1fr); }
  .study-note, .calendar-panel, .bulletin { padding: 20px; }
}
```

现有 `.home-columns`、`.home-aside` 命名不是必须有「侧栏」的理由；它们是内容布局钩子，可保留命名并改视觉。不要为让测试匹配而在注释中塞旧类名，实际内容块必须存在。

## 8. 所有学生业务页的共同改版规则

以下不是替代后面逐页契约，而是每页共同要求：

| 页面类型 | 展示修改 | 必须保持 |
|---|---|---|
| 列表 | 标题+说明；完整筛选工具带；卡片或原表格；分页独立底栏 | 分类、关键词、重置、AI推荐、加载/错误/重试、总数、页码、返回恢复 |
| 详情 | 内容主区+动作区；窄屏动作区落到正文后 | 所有状态标签、作者跳转、联系、收藏、举报、评论、报名/认领/交易条件 |
| 发布 | 浅色页头+分段表单+明确提交区 | 原 form/ref/rules/model/prop、所有字段、AI辅助、上传、编辑回填、校验、取消 |
| 个人 | 资料卡+全部原Tabs；各Tab完整显示其业务操作 | 头像修改、资料提交、统计、所有发布/报名/预约/认领/收藏/问答等实际项目 |
| AI | 静态便笺式入口和轻边框工作台 | 历史、场景、PDF、上传、模型/参数若已有、流式输出、停止/重试/错误、复制 |
| 聊天 | 顶部对象信息、可滚动记录、完整发送器；底部安全间距 | 实时消息、未读、业务上下文、上传、发送失败、频控、拉黑、举报、返回 |
| 游戏 | 大画布+紧凑横向工具条+玩家/猜词/聊天区 | 原全部画笔工具、坐标、消息、得分、房间、计时、作品/画廊与生命周期 |
| 3D | 调整外层按钮、面板、字体、颜色和边距 | WebGL、容器ref、门/房间、Workspace、返回、全屏、画质、舒适模式及失败态 |
| 登录注册 | 同色系插画或原图+表单卡；窄屏表单优先 | 所有验证码、人机验证、字段、记住/跳转、错误/加载、登录后原目标路由 |

任何「更多」折叠项都必须有文字标识、状态反馈和键盘入口；不得把核心操作全部藏进悬停才出现的菜单。按钮 disabled 要保持原因或相邻状态文字。删除、下架、拒绝、拉黑保留危险语义及确认过程。

## 9. 管理端具体实施顺序

管理端详细源码契约在后文；先按下列顺序改，避免内容页先做完又被全局样式破坏：

1. 改管理端三个样式文件并确认明暗主题。
2. 改 `layout/AdminLayout.vue` 模板位置和 scoped CSS：原 `.admin-shell` 由 `232px 1fr` 改为单列；原 aside 的分组导航重排为顶部横向组+第二行内容。只移动原完整节点，不复制另一套角色数据。
3. 原 `.nav-group-toggle` 继续 `@click="toggleGroup(group.label)"`；`.nav-group-items.is-collapsed` 继续反映 `expandedGroup`，保持 `aria-expanded` / `aria-controls` / id 对应关系。
4. 原导航 count、AI gold 标记、`countError`、重试 `loadCounts`、`totalPending`、30 秒轮询及清理全部保留。禁止用写死数字装饰新导航。
5. 按后文 13 个视图逐一改版。表格操作列不能被固定窄宽截断；在 390px 下允许表格局部横滑并有提示，不允许删除列。
6. 保留 `src/utils/chartTheme.js` 和 Dashboard 脚本中的图表数据/系列色计算；它们在禁止改逻辑的范围内。Canvas 系列色可能继续使用原蓝/杏色，这属于明确的视觉边界。可以通过容器、背景、标题和留白融入同频风格，不改图表计算或用滤镜伪装颜色。
7. `NoticeEdit.vue` 使用当前真实编辑方式和预览；不要因依赖里装了 WangEditor 就替换现有 Markdown 编辑器。
8. 所有原权限、只读/编辑状态、批量操作、导出和二次确认保持。超级管理员与审核员分别验收。

## 10. 覆盖清单和分阶段完成标准

开发开始先建立 `docs/ui-redesign/implementation-checklist.md`，每个实际路由、Vue 文件和弹层一行。列固定为：端、路由、文件、角色、入口、原字段/动作、目标布局、是否改模板、是否改样式、审计结果、浏览器证据、待办。不得只按业务模块勾一个总框。

阶段顺序：

- [ ] 核对分支，读取源码契约，执行改动前审计和已有测试。
- [ ] 保存改版前两端主要页面及高风险流程的截图；记录真实环境可用性。
- [ ] 两端 tokens/base/Element Plus 主题；先看登录页、列表、详情及弹窗是否受污染。
- [ ] 学生壳层/全部功能面板/Dock/局部导航；验证所有原路由入口。
- [ ] WtHero 和 Home 全量内容布局；真实图片和加载/空态不变。
- [ ] 学生账户、活动、闲置、失物、搭子、问答、动态、公告、个人、消息/聊天。
- [ ] AI/PDF/代码/错题及全部子组件；游戏及 3D/Workspace。
- [ ] 管理壳层和五组导航；13 个视图及所有表单、详情、批量操作。
- [ ] 完成两端明/暗、360/390/768/1024/1440/1920px、200%缩放、长文本和密集数据检查。
- [ ] 重跑审计、原测试、构建、真实业务回归；修复此次改版引入的展示错误。
- [ ] 提交到既定分支，交付完整功能矩阵、证据、限制和运行方法。

每完成一组页面就审计，出现旧节点减少或脚本变化先撤销本次导致问题的最小差异；不要更新基线以消除错误。用原有测试确认行为，而不是编写只验证自己新 class 的测试。

## 11. 浏览器验收必须检查的状态

至少检查以下实际状态，后面的逐页契约补充每页细项：

1. 未登录、学生本人、其他学生、超级管理员、审核员。
2. 初始加载、加载成功、空列表、接口失败可重试、无权限、登录过期、长文本、多页数据。
3. 活动报名/取消/审批/签到/名单/导出；闲置预约/处理/完成/评价；失物发布/认领/确认；搭子匹配与状态；问答发布/回答/采纳；动态发布/评论/点赞/举报。
4. 登录的图形与算术验证码两种路径、注册人机验证、用户退出后的清理与返回登录。
5. AI 开始/流式/中止或重试等源码已有操作；PDF 上传成功/失败；代码编辑器输入；错题 OCR/整理/讲解/计划/练习/复习等全部入口。
6. 双账号私信，未读同步、发送、失败提示、频率限制、业务上下文、拉黑/举报。
7. 你画我猜公开/私密房、加入/退出、画笔/猜词、回合/计时/得分、作品/画廊、断线/重连等现有状态。
8. 3D 场景、房间打开真实服务、返回房间、列表翻页返回保持、弹窗滚动、取消移动、全屏、画质、失败与重试。
9. 后台五类内容审核、AI审核恢复/维持、五类内容管理（活动/闲置/失物/搭子/问答，源码没有动态管理 tab）、用户状态、举报处置、公告、AI配置和日志、系统/子管理员配置。
10. 键盘 Tab/Shift+Tab/Enter/Escape；弹窗焦点进出；减少动画偏好；触摸工具操作；发送区和操作栏不被 Dock/软键盘遮挡。

危险的业务操作只能在本地测试账号和测试数据中验收。不要把验收当成向真实用户发消息、删除真实数据或发布生产公告的授权。没有测试环境就明确列为待验证，不得伪造通过。

## 12. 最终交付内容与停止条件

最终报告必须包含：

- 分支名、工作区、提交哈希；本次改动文件清单。
- 学生端全部路由/页内操作和管理端全部导航/页内操作的覆盖矩阵。
- 业务冻结审计原始输出、原测试和构建结果、真实 E2E 证据；基线已有失败和本次新增失败分开记录。
- 首屏、完整页面、列表、详情、发布/编辑、AI、游戏、3D、后台表格/审核弹窗、明暗与手机截图。
- 说明哪些视觉细节受「不改功能代码」限制而保留；不能静默删功能换取原型一致。

合格标准不是「看起来像原型」，而是「同频视觉已覆盖两端全部真实页面，并有证据表明原功能在原条件下完整保留」。有一项真实功能缺入口、字段被截断、弹层不可操作、权限错误、业务脚本被改、真实逻辑被演示替代，就不能标记完成。

后面的学生端逐页契约、管理端逐页契约、验证命令是本提示词不可分割的部分，必须全部执行。
