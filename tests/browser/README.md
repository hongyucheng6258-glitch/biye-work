# 系统浏览器回归

需要 Playwright 和 Chrome，以及运行在 5173 / 5174 的学生端与管理端开发服务。
浏览器请求中的 `/api/` 全部由测试拦截，写操作不会进入真实数据库。测试图片写入系统临时目录 `campus-browser-checks`，可通过 `CAMPUS_TEST_OUTPUT` 修改。

从仓库根目录运行：

```powershell
# Playwright 已安装时可通过环境变量指定它的模块目录
$env:PLAYWRIGHT_PATH = 'E:/work/毕业设计UI原型/.local-browser/node_modules/playwright'
node tests/browser/system-interactions.cjs
node tests/browser/system-all-rooms.cjs
node tests/browser/system-auth.cjs
node tests/browser/system-admin.cjs
```

- interactions：真实场景进门、活动报名输入与单次提交、筛选返回、私信、返回同一房间、全屏弹窗、Esc、390px 窄屏。
- all-rooms：其余十个服务房间的原组件加载，问答和消息类型筛选参数。
- auth：403 保持登录、失败重试、401 在房间中显示登录页。
- admin：失败不能伪装为空待办、重试恢复数据、图表适应窄屏。

这些检查验证前端交互与请求约定，不替代真实数据库、文件上传、AI 服务、WebSocket 收发及审批并发的联调。
