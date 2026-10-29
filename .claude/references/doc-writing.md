# 文档写法

写模块 `README.md`、设计 spec、issue 时读这份。各类文档放哪见根 `.claude/CLAUDE.md`「文档分工」。

## 设计 spec

- 讨论阶段用 Claude artifact（`Artifact` 工具发布 HTML 页面，边谈边改）
- 用户定稿后挂到 issue 上（命令见下文「issue artifact」）：同一份 HTML 挂成名为「设计」的 HTML artifact，再挂一个指向 Claude artifact 的链接 artifact 作备用。没有 issue 的先开一个。不写本地文件
- 内容讲设计思路和数据流：背景/目标、设计决策与理由、数据流（谁读谁写、字段名、经过哪些层）、修改文件列表（每个文件一行说改什么）、验证方式。函数签名、代码块、参数列表留给实现阶段
- spec 跟着 issue 走，issue 关闭后很少再看。留得住的设计思路另写进版本控制：模块级的进该模块 `README.md`，只影响一两处实现的写成代码注释

## issue

issue 管整体目标、统一规范、进度与验证结论。具体文件、key 清单、实施步骤、设计细节放进 issue artifact 或就近文档，issue 正文用链接指过去。「规划 issue」只授权讨论方案和更新 issue，实现要等用户另行开口。

## issue artifact

GitHub issue 的附件（预览功能），三种：Markdown 文档（`generic`）、HTML 文档（`embedded_html`）、链接（`link`）。用 `gh issue artifact` 操作，按扩展名定类型：

```bash
gh issue artifact create <n> -R windy10v10ai/game '<文件>.html#设计' '<claude.ai artifact URL>'
gh issue artifact create <n> -R windy10v10ai/game '<文件>.md#<名称>'
gh issue artifact list <n> -R windy10v10ai/game
gh issue artifact view <n> <编号> -R windy10v10ai/game
gh issue artifact edit <n> <编号> -R windy10v10ai/game --body-file <文件>
```

- **HTML**：定稿的设计、给人看的说明页（流程图、进度、方案对比）。claude.ai 页面在 GitHub 上不能内嵌，挂 HTML 文件本身。页面自包含（内联 CSS，不引外部资源），用 `prefers-color-scheme` 适配深色模式
- **链接**：指回讨论用的 Claude artifact，只对有权限的人可见，作备用；HTML 才是定稿
- **Markdown**：测量报告、多个子 issue 共用的规约
- agent 用 `gh issue artifact view` 读内容，HTML 读的是源码
- 定稿后再改：HTML 用 `edit` 覆盖（保留版本历史，不删了重建），Claude artifact 同步改。名称不能含括号等字符
- issue 正文引用时写名称加 URL（`https://github.com/windy10v10ai/game/issues/<n>/artifacts/<编号>`）
- 预览功能，命令失败时把内容写进 issue 正文或评论兜底

## 模块 README

框架性文档：系统现在长什么样、为什么这样搭、放弃了什么，长期维护。

- **按读者写，越短越好**。面向玩家或外部读者的目录只写做什么、怎么用、怎么编译发布
- **只记用户拍板的关键决定**。AI 实现时自行选定、以后可能调整的细节（超时、重试间隔、文案位置等）留在代码里
- **按现状组织，不按阶段**。逐段问「这段会不会因为某个阶段做完就失效？」——会失效的（阶段划分、进度、本阶段改了哪些文件、排查过程与证据、实测数字）进 issue、PR 或本地 spec
- **只写代码里读不出来的**：约束、决定和它的理由。调用链、常量名与取值、函数行为、字段拼法以代码为准（口径同「注释规约」）
- **每个决定一句理由**。没选的方案值得提时，在理由里带半句「没选 X，因为 Y」；方案比较表、试算过程留在 PR
- **随决策变更同步更新**。一次改动新增或推翻了长期决定，就在同一个 PR 里改 README；只是按既有决定多接了一处，README 不动
