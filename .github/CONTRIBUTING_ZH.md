[English](CONTRIBUTING.md) | 简体中文

# 参与开发 Windy10v10AI

感谢您参与 Windy10v10AI 的开发！

## 欢迎的贡献

- **报告 BUG 和提出建议**：创建一个 [Issue](https://github.com/windy10v10ai/game/issues/new/choose)。
- **小修复**：错别字、文档、翻译、明显的小 BUG，可以直接提交 PR。
- **新功能和玩法改动**：请先开 Issue 讨论。功能类改动原则上由维护者自己实现，没有事先达成一致就提交的功能 PR 可能会被关闭，免得你白做。

玩法改动包括新英雄、技能、物品、游戏模式，以及任何平衡性和数值调整。

## 提交 PR 之前

1. 先搜索[已有的 Issue](https://github.com/windy10v10ai/game/issues)。
2. 功能或玩法改动：开一个 Issue，说明遇到的问题和你的想法，等维护者同意后再动手。
3. 小修复不需要 Issue，在 PR 里说明改了什么、为什么改。

## 沟通

- 加入[QQ群](https://qm.qq.com/q/BPUhaLiec2)或 [Discord](https://discord.com/invite/MfawtDpxks)
- 还不够成为 Issue 的问题和想法：[GitHub Discussions](https://github.com/windy10v10ai/game/discussions)

## 提交代码

有两种方式参与开发：

- 向 windy 申请成为项目成员，在这个项目中创建一个分支，然后提交 PR。
- [Fork 这个项目，然后提交 PR](https://docs.github.com/zh/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork)

从最新的 `develop` 切分支。分支命名规则：

- 为某个 Issue 开发：`feature/{issue 编号}-{简短英文描述}`
- 没有 Issue 的小修复：`fix/{简短英文描述}`、`docs/{简短英文描述}`、`chore/{简短英文描述}`

### Pull Requests

- 创建 PR，从你的分支到 `develop` 分支，并按模板填写。
- 用 `Fixes #{issue 编号}` 关联 Issue。
- 改了界面，请附截图。
- 写明测试了什么、没测什么。没勾选的项没关系，没验证却声称通过不行。
- 推送前运行 `npm run lint`、`npm run test`、`npm run prettier-check`。

### 不要提交密钥

不要提交 API Key、Token、密码或个人信息，也不要贴在 Issue 或 PR 里。发现安全问题请在 Discord 或 QQ 群私下联系维护者，不要公开提 Issue。

## 关于贡献的授权

本项目采用 **GNU GPL version 3** 协议（附带 Steam/创意工坊分发例外，详见
[`LICENSE.EXCEPTIONS.md`](../LICENSE.EXCEPTIONS.md)）。

当你提交贡献（pull request、补丁或任何代码）时，即表示你同意：

- 你的贡献以 GPLv3 协议授权给本项目及其用户；并且
- 你授予项目维护者（windy）**永久、不可撤销、非独占的、以任意协议重新授权你这份贡献的权利**，
  包括改用 MIT 等更宽松的协议。

你确认自己有权作出上述授权（贡献为你本人原创，或你已获得提交授权）。这样未来若要更换协议，
无需再逐一征求每位贡献者同意。
