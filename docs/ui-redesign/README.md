# 改版提示词使用入口

本目录交付的是完整的双端 UI 改版提示词，不是已完成的正式 UI 改版。正式业务代码保持不变。

## 直接交给开发执行

复制下面这段话给能访问本项目代码的开发代理即可：

```text
请在 E:\work\毕业设计UI原型\Ai-campus\.worktrees\tongpin-ui-redesign 工作区的 feat/tongpin-ui-redesign 分支执行 AI 校园双端 UI 改版。

先读取 docs/ui-redesign/00-execution-prompt.md；按任务读取 student-page-contracts.md、admin-page-contracts.md 和 verification-contracts.md。完整合并版在 docs/ui-redesign/完整改版提示词.md，内容一致。

视觉参考 ui-prototype/tongpin-campus.html，覆盖学生端和管理后台所有原页面和操作。消除传统常驻导航侧栏，完整保留原功能、原字段、原条件、原权限、原路由、原事件和原脚本；不要迁移原型中的模拟业务。

请按文档中的确切文件、源码锚点、代码片段、功能契约和验收步骤直接实施，不能只改首页或只给计划。先运行 node scripts/ui-contract-audit.mjs check --rev 91214e0，后续每组页面完成后重复检查。不得修改基线、业务代码或原测试来消除失败。

所有应用修改和提交留在现有 feat/tongpin-ui-redesign 分支；不动原工作区，不合并、不推送、不部署。完成后提供两端全功能覆盖表、实际测试/构建/浏览器结果和截图；未验证项必须明确列出，不能声称已经完美适配。
```

## 文件分工

| 文件 | 内容 |
|---|---|
| `完整改版提示词.md` | 主指令和三个附录的完整合并版，可整体保存或交给执行者 |
| `00-execution-prompt.md` | 分支、修改边界、视觉参数、MainLayout/首页的具体模板及 CSS、跨屏验收 |
| `student-page-contracts.md` | 学生端 65 个页面/组件的逐控件清单；1,246 条模板契约 |
| `admin-page-contracts.md` | 后台 13 个视图、布局及展示组件；15 个导航入口和各页完整操作 |
| `verification-contracts.md` | 审计/测试/构建/浏览器和真实业务验证方法及实际基线结果 |
| `ui-contract-baseline.json` | 506 个受保护文件和 83 个 Vue 的固定快照；不得手工修改 |
| `delivery-verification.md` | 本次提示词交付的最终核验记录 |

完整合并版由前四份源文档顺序合并。后续若修订提示词，应同时更新合并版，避免两份要求不一致。

本分支已包含原型 HTML、SVG 和桌面/手机截图。Git 工作区为独立目录，原目录的未提交修改未搬入或覆盖。原业务代码从 `91214e0` 继承到新分支。

原型中的「同频」作为视觉参考；正式产品保留既有「梧桐校园」站点名称及真实数据。
