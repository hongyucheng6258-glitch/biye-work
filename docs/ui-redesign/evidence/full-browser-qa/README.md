# 本次浏览器验收证据

主报告：`../../full-browser-qa-report.md`。

- `results.json`：最终分类、192 个命名场景、8 项缺陷、尺寸测量与未覆盖项。
- `raw-attempts.json`：最后暗色复核前的 320 次中间操作记录，包含尚未纠正的脚本误判；不能直接按其中 FAIL 计产品缺陷。
- `inventory.json`：78 项功能/组件与测试场景映射，84 个 Vue 的静态事件盘点。静态绑定不是独立通过用例。
- `01-*.cjs` 至 `24-*.cjs`：持续会话里实际使用的检查片段，包括修正前后的检查。它们依赖共享 Playwright 页面、正常 UI 登录、辅助函数与测试数据，**不是可以独立一键重跑且保证全绿的测试套件**。报告保留了定位、等待和预期错误的复核说明。
- `persistent-browser-runtime.cjs`：技能内核启动失败后使用的持续 Node 会话传输层。没有保存登录凭据或浏览器 storageState。
- `visual-*`、`breakpoint-*`、`dark-*`、`native-*`：路由、响应式、主题与原生窗口截图。`contact-0..8.png` 为初次 90 张路由截图的概览，详情补拍和暗色稳定复核以主报告所链接文件为准。
- `bug-*`、主报告列出的 `failure-*`：确认缺陷的证据。其他 `failure-*` 含脚本误判或环境中断，必须对照最终 `results.json` 解释。
- 其他 PNG：真实交互后状态、OCR 图片、游戏画廊、模型结果和弹窗等。
- `student-unit.log`、`admin-unit.log`、`compatibility.log`：本次重新运行的单元检查和业务代码保护结果。
- `legacy-results.json`、`legacy-test.log`、`legacy-exit.txt`、`legacy-shots/`：既有 API/浏览器混合回归，不能当作本次正常 UI 测试。
- PDF 与 CSV：隔离测试生成/下载的文档和报表。

测试数据只在隔离 Docker 项目中保留。系统参数、密码和账号禁用状态已经在测试后恢复；测试新建账号、审核员、停用提示词及带 UIQA 前缀的数据保留供复现。没有修改业务实现来使断言通过。
