# B01–B08 修复与复测记录

八项缺陷已修复，八个功能复测检查与十二个聊天布局检查通过。学生端 89 项、管理端 16 项、后端 283 项自动测试通过。此结论限于本次修复及关联检查，未将修复前 192 个浏览器场景重新全部执行。

工作区：`E:\work\毕业设计UI原型\Ai-campus\.worktrees\tongpin-ui-redesign`；分支：`feat/tongpin-ui-redesign`；本次修改以 `7723374` 为起点。用户“帮我修复”授权修复完整模块测试中的 B01–B08；此前功能保护约束继续适用于无关代码。

## 修改及真实页面复测

| 缺陷 | 最小修正 | 页面验收与证据 |
|---|---|---|
| B01 收藏深链空列表 | `Profile.vue` 初次挂载时，如果标签为 `favorite`，调用既有收藏加载方法 | 闲置详情收藏 → 直接打开收藏深链 → 刷新 → 普通标签切换 → 取消本次新增收藏；[截图](evidence/qa-fixes-20260929/B01-favorite-deep-link.png) |
| B02 动态评论点击失败 | `PostSquare.vue` 补齐模板已绑定的 `toggleComments(p)`，保留热门入口 `openPost` | 点击展开、发表实际评论、刷新持久化、再次点击折叠；[截图](evidence/qa-fixes-20260929/B02-comment-persisted.png) |
| B03 报名名单传入事件对象 | `activity/Detail.vue` 按钮显式调用 `loadMembers()` | 详情入口请求 `pageNum=1` 且返回真实名单；“我的发布”原入口仍可打开；[截图](evidence/qa-fixes-20260929/B03-members-detail.png) |
| B04 编辑管理员留空密码失败 | `AdminSaveDTO.java` 移除共用 DTO 密码非空约束；新增密码非空、编辑空密码保留 hash 均复用原服务逻辑 | 新增空密码被拒绝；有效密码新增成功；空密码改昵称保存；原密码可登录；审核员访问超级管理员页面仍被拦截；[保存截图](evidence/qa-fixes-20260929/B04-admin-empty-password.png)、[权限截图](evidence/qa-fixes-20260929/B04-reviewer-permissions.png) |
| B05 后台全局搜索忽略关键词 | `UserList.vue` 初始化读取并监听 `route.query.q`，复用原 `search()` | Ctrl+K 搜索后按学号筛选；同页第二次搜索换关键词；列表手动搜索仍有效；[截图](evidence/qa-fixes-20260929/B05-global-search.png) |
| B06 提纲成功却不显示 | `WrongOutlineDialog.vue` 兼容字符串与对象 `answer` | 使用真实模型生成报告，接口成功字符串在 Markdown 区显示；重新选择后三种生成方式保留；[截图](evidence/qa-fixes-20260929/B06-real-outline.png) |
| B07 请求取消锁死发送 | `ChatView.vue` 取消时重置发送锁；历史加载使用独立加载标记和既有请求序号 | 长问题发起后切向导，实际向导问题成功返回；随后 PDF 与答疑可继续输入发送；[截图](evidence/qa-fixes-20260929/B07-scene-switch-guide.png) |
| B08 聊天输入离开首屏或被导航遮挡 | `MainLayout.vue` 只为聊天路由约束动态视口；`ChatView.vue`、`ChatRoom.vue` 消息区内部滚动，输入区保留可见高度；移动端导航横向排列 | AI/私信 × 六种尺寸，共 12 检查通过。页面无需先滚动，输入区处于底部导航之上，发送按钮通过 `elementFromPoint` 遮挡检查；[测量](evidence/qa-fixes-20260929/layout-results.json) |

复测使用持久 Chrome 会话和正常页面控件；测试登录、发布评论、收藏、管理员新增/编辑均通过实际 UI，未用接口写入或注入组件状态代替功能验收。监听真实网络响应只用于观察请求参数和返回结果。真实模型配置来自隔离数据库，未模拟 AI 成功结果。请求拦截仅原样继续请求以绕过旧浏览器缓存。

浏览器技能 `playwright-interactive` 已读取并应用其清单、持续会话、真实交互和独立视觉核验流程；当前会话没有可调用的 `js_repl`，使用持久 Node Playwright 运行时作为替代，没有宣称完成了原技能的 `js_repl` 启动步骤。

补充视觉和关联检查：

- 3D 校园通过导览进入真实 AI 服务，桌面和 390×844 内嵌聊天均可操作，发送按钮无遮挡，Esc 返回房间；[桌面测量](evidence/qa-fixes-20260929/3d-ai-layout.json)、[手机测量](evidence/qa-fixes-20260929/3d-ai-mobile-layout.json)、[手机截图](evidence/qa-fixes-20260929/3d-ai-chat-mobile.png)。
- 真正有头 Chrome 使用 `viewport:null`，未手工调整窗口，实际视口约 1037×754；AI 与私信输入在导航之上且按钮命中检查通过；[记录](evidence/qa-fixes-20260929/native-results.json)。第一次私信测量发生在加载层仍显示时，等待加载结束后通过；[首次记录](evidence/qa-fixes-20260929/native-attempt-1.json) 保留，不能据加载态宣称稳定页面遮挡。
- 320×720 已上传 PDF 的文件栏换行使消息区仅 37px，补充检查先失败；改为单行横向滚动后消息区约 70px，上传按钮和完整文件名/页数仍可操作查看，输入区始终在导航上方；[修复前测量](evidence/qa-fixes-20260929/pdf-small-before-fix.json)、[修复后测量](evidence/qa-fixes-20260929/pdf-small-layout.json)、[截图](evidence/qa-fixes-20260929/pdf-320-720.png)。
- 完成两段合计约 34 秒的正常交互探索，覆盖私信五行输入、键盘换行/焦点、消息内部滚动、明暗往返、15 个功能入口与 Esc、AI 三种场景往返，以及 PDF 文件信息横向滚动和文档恢复；[记录](evidence/qa-fixes-20260929/exploratory-results.json)、[多行截图](evidence/qa-fixes-20260929/private-multiline-mobile.png)。

独立查看截图时，当前持续无头会话的暗色私信出现局部黑块，等待主题稳定后截图仍存在；对应 DOM 计算色值与可见文本正常。另启动实际有头 Chrome、重新正常登录并使用同一页面控件切为深色，截图显示正常的关联内容、消息与输入区，因此推断黑块与当前无头图形会话有关。暗色视觉复核以 [有头截图](evidence/qa-fixes-20260929/chat-dark-mobile-headed.png) 为准；[无头异常截图](evidence/qa-fixes-20260929/chat-dark-mobile-final.png) 保留，没有根据该截图改变功能代码，也未声称所有图形后端都已排除问题。

补充脚本中还曾使用错误的导览服务空格匹配、功能链接类名及 PDF 上传组件嵌套按钮定位；读取实际 DOM 后修正定位并完成同场景复核。这些不计作产品缺陷。

## 会话切换竞态的补充修复

独立审查发现，只重置发送锁会允许在历史加载期间发送，新问题随后可能被晚到的历史列表覆盖。新增两项实际 SFC 测试先复现失败，再修正：加载期间按钮及 `send()` 暂停发送；切换会话/场景后，过期历史和 PDF 文档响应按已有 `requestSeq` 丢弃，旧请求也不能释放新会话的加载锁。两项测试与原取消隔离测试均通过。复审另验证连续切换 PDF 会话的过期文档响应，未发现重要问题。

## 自动验证及重跑方法

| 检查 | 结果 | 证据 |
|---|---|---|
| 学生端目录 `npm test` | 89 PASS，0 FAIL | [日志](evidence/qa-fixes-20260929/student-test-final.log) |
| 管理端目录 `npm test` | 16 PASS，0 FAIL | [日志](evidence/qa-fixes-20260929/admin-test.log) |
| 后端目录 `mvn -B test package` | 283 PASS，0 FAIL/ERROR/SKIP；打包成功 | [日志](evidence/qa-fixes-20260929/backend-test-package.log) |
| 两端 `npm run build` | 构建成功；保留现有大包体积警告 | [学生端](evidence/qa-fixes-20260929/student-build-final.log)、[管理端](evidence/qa-fixes-20260929/admin-build.log) |
| 实际页面功能复测 | 8/8 PASS | [结果](evidence/qa-fixes-20260929/functional-results.json) |
| AI/私信六种尺寸 | 12/12 PASS | [结果](evidence/qa-fixes-20260929/layout-results.json) |
| 限定修改范围审核 | PASS；保留原冻结审核的 17 项明确允许错误 | [日志](evidence/qa-fixes-20260929/compatibility.log) |
| 隔离 Docker 三个应用镜像构建 | 学生端、管理端、后端均 exit 0 | [学生端](evidence/qa-fixes-20260929/image-student.log)、[管理端](evidence/qa-fixes-20260929/image-admin.log)、[后端](evidence/qa-fixes-20260929/image-backend.log) |

新增回归测试执行实际编译的 Vue SFC，覆盖挂载、真实模板点击事件、路由响应、字符串/对象结果及异步取消/历史覆盖，不复制业务实现作为被测替身。后端四项测试覆盖 DTO 约束、真实服务新增空密码拒绝、空密码编辑保留原 hash、显式新密码更新。

根目录执行 `node scripts/verify-qa-fixes-compatibility.mjs`，它严格比对 `7723374` 的已授权代码片段，并运行保留的 `91214e0` 冻结审核。17 项错误包含此前授权的改动和本次八项修复/测试；新增的发送加载判断明确列入，不以更新基线掩盖。API、store、路由、权限、服务逻辑与本次起点保持一致；管理密码修复仅调整 DTO 校验。

浏览器回归入口为 `tests/browser/ui-qa-fix-regression.cjs` 和 `tests/browser/ui-fix-layout.cjs`，接受已真实登录的持久 Playwright 页面。前者会在隔离库产生明确测试前缀的评论与审核员账号；后者不写业务数据。

首次功能脚本中有三种定位错误：评论目标卡与列表卡选择歧义、重复分享目标内容、嵌套表单字段定位。修正定位后重跑通过；原尝试记录保留 [attempt 1](evidence/qa-fixes-20260929/functional-attempt-1.json)、[attempt 2](evidence/qa-fixes-20260929/functional-attempt-2.json)，不将脚本错误计作产品缺陷。后端修复前红灯证据见 [日志](evidence/qa-fixes-20260929/backend-regression-red.log)，原聊天布局失败测量见 [记录](evidence/qa-fixes-20260929/layout-red.txt)。

归档日志仅清除行尾空格以通过 `git diff --check`；原始日志保留在工作区之外的本地浏览器工具目录。未删除失败信息或改写测试统计。

## 预览、保留数据和验证边界

隔离 Docker 项目 `tongpin-ui-e2e-20260929032639` 保留运行，已更新运行中的前端静态资源和后端包，并构建对应的新镜像。学生端 [http://127.0.0.1:15173](http://127.0.0.1:15173)，后台 [http://127.0.0.1:15174/admin](http://127.0.0.1:15174/admin)，后端 `18080`。原项目的 5173/5174/8080 服务未修改。本次源码修改集中于 9 个既有生产文件；没有功能删减、接口变更或数据库结构变更。

本次新增的 `[UIQA-FIX]` 评论和审核员保留在隔离库便于复核。密码、模型密钥、登录凭据没有复制进分支或证据。测试浏览器在完成后关闭，Docker 预览保留。

仍未覆盖真实手机软键盘、扫码/摄像头、全部分页边界、全部 AI 额度/供应商故障、所有对象和权限状态组合，以及全部设备/GPU。模拟手机视口不等于实体手机验证；12 个布局检查也不等于全站逐页重验。修复前完整测试记录及其未覆盖项保留，不声称“所有功能完美通过”。
