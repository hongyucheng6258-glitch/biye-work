# 浏览器验收八项缺陷修复计划

**Goal:** 修复完整浏览器报告 B01–B08，保留所有功能、接口和权限规则。
**Architecture:** 在原组件中修正初始化、事件参数、响应读取和取消状态；管理员复用服务层已实现的空密码更新语义；聊天使用受视口约束的主区和内部滚动，保留横向导航与全部功能入口。
**Tech Stack:** Vue 3 / Element Plus / Node test runner / Spring Boot Validation / JUnit / Playwright。

用户“帮我修复”已授权报告中八项修复。此前禁止修改业务代码的改版约束仍约束无关改动；本次允许为已确认缺陷进行最小功能修正，不做功能删减或规则扩展。已有隔离分支继续使用。

- [x] B01 `student/src/views/profile/Profile.vue`：初始收藏标签调用 `loadFavorites()`；用实际编译的组件挂载回调验证初始深链和切换标签。
- [x] B02 `student/src/views/social/PostSquare.vue`：定义模板已绑定的 `toggleComments(p)`，重复点击折叠，热门入口仍使用 `openPost`；验证真实模板点击及浏览器评论发表/刷新。
- [x] B03 `student/src/views/activity/Detail.vue`：按钮改为 `@click="loadMembers()"`，分页仍显式传数字；执行编译模板的 PointerEvent 点击并检查 API 页码。
- [x] B04 `backend/.../admin/dto/AdminSaveDTO.java`：移除共用 DTO 密码非空约束，保留用户名/角色校验以及 `createAdmin` 的初始密码非空校验；验证编辑空密码保留 hash、新增拒绝空密码及显式密码更新。
- [x] B05 `admin/src/views/user/UserList.vue`：读取并监听 `route.query.q`，初始加载和同页面后续全局搜索均重置页码并搜索；不覆盖手动输入。
- [x] B06 `student/src/views/ai/components/WrongOutlineDialog.vue`：读取字符串或对象 `answer`；验证真实响应输出及既有错误/重试路径。
- [x] B07 `student/src/views/ai/ChatView.vue`：取消后立即清空 `asking`，保留请求序号隔离；验证新请求可发、旧回调不污染新消息、新请求仍受重复发送保护。
- [x] B08 `student/src/layout/MainLayout.vue`、`views/ai/ChatView.vue`、`views/chat/ChatRoom.vue`：聊天路由外壳占可用动态视口；保留顶部控件，移动端横向导航及折叠会话列表减少首屏高度；消息主区 `min-height:0` 内滚动，输入区不收缩，底部导航留足安全间距。3D 嵌入页不依赖外壳仍可用。

先运行新增行为测试观察 B01–B07 预期失败以及布局的旧版浏览器证据，再逐项改动并转绿。最后运行两端完整单元测试、后端完整 Maven 测试、两端构建、真实页面八项复测与关键关联流程。旧 UI 冻结审核必须仍报告已授权功能修正；新增明确允许范围的审核，不能改写冻结基线或掩盖额外变更。

- [x] 独立审查发现的 B07 历史加载竞态：新增两项先失败的 SFC 回归测试，暂停加载期间发送，以现有请求序号隔离过期历史及 PDF 文档；复审通过。
- [x] B08 关联的 320×720 已上传 PDF 状态：先记录消息区只有 37px 的失败测量，将文件栏改为可横向滚动的单行，复测消息区约 70px、输入和发送按钮不遮挡；文件信息可完整滚动查看。
- [x] 补查 3D 内嵌桌面/手机聊天、有头 Chrome 原生窗口、私信多行输入、主题切换、全部功能面板与三种 AI 场景往返；证据见修复报告。

交付：更新后的程序、可运行回归测试、修复复测记录和截图，提交到 `feat/tongpin-ui-redesign`；不合并、不推送。
