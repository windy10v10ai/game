---
name: release-note
description: 生成 Steam Workshop 中英文更新日志（Release Note），可写回 PR。
context: fork
model: sonnet
background: false
---

# Release Note

为 Steam Workshop 生成中英文更新日志。纯内部改动不写，判定见 `create-pr` skill「Release Note 写不写」。

本 skill 在 SubAgent 里运行，看不到调用方的对话，也不能向用户提问。需要用户决定、参数又没给出时，停下并在回报里列出待选项，由调用方问用户后带着答案重新调用。

参数包含三项：

- **来源**（缺失时停下回报，不从当前分支猜）：`#1234`、纯数字或含 `/pull/` 的 URL → PR：读标题、描述、commits；含 `/issues/` 的 URL → Issue：按 `references/from-issue.md`；其他 → 按调用方列的点写
- **目标版本**：具体版本号，缺失时按第 1 步算
- **写回**：写入功能 PR 并合并进聚合 release PR / 仅写入功能 PR / 仅写入聚合 release PR / 仅提交改动 / 跳过

## 1. 定版本号

参数给了目标版本就直接用，没给就按 `.claude/references/release-version.md` 算。带字母后缀（`v5.65a`）的是补丁版本，不带的是大版本。

**同步 `GAME_VERSION`**（`src/vscripts/modules/GameConfig.ts`，不含 a/b/c 后缀）：目标版本去掉字母后缀后与它不同时改成该值。

完成：版本号是具体字符串，`GAME_VERSION` 已按上条处理。

## 2. 写条目

```
[b]游戏性更新 v5.20[/b]

- 更新内容
```

```
[b]Gameplay update v5.20[/b]

- Update content
```

- 通常 1–6 条，重要的在前。靠合并压条数：同一英雄/物品/系统的多个改动点用逗号串成一句（如「重做无限手套：更改配方和属性，新增主动技能「灭世响指」，有50%概率直接湮灭敌方英雄」）；不相关的短小修正也可逗号并列；琐碎且多时概括为「修正一些 bug 和平衡性改动」
- 每条一行一句：去掉括号补充、强化名、spell amp 这类次要限定，只留玩家可感知的核心变化
- **调整与修正只写结果，不写怎么做到的**：冒号后的触发条件、机制、实现方式整段删掉。新功能例外，冒号后可用半句说在哪、是什么。用户改稿的典型删法：
  - 「后期藏宝箱更容易找到：减少偏远点位，后期也会刷在空旷处」→「后期藏宝箱更容易找到」
  - 「延缓电脑推进速度：电脑占优时每推掉一座外塔，会先在附近刷野施压一阵再推下一座」→「略微延缓电脑推进的速度」
  - 「用启动器联机开房时，选队界面会显示房间人数和正在连接的玩家，所有人进来后会提示」→「优化启动器联机时，正在连接的玩家的显示」
- 程度往轻了写（「略微」「更」），不夸大；不写对比口径、统计范围这类容易写错的细节
- 单个英雄、技能、物品的数值细调不写（如「削弱术士致命连接：连接目标数与持续时间降低」整条删掉），除非影响面大到所有玩家都会感知
- 一个 PR 只写它的主线改动；顺带的文案、推广语、PR 里其他小调整不单列；拿不准要不要写的列在回报里，由调用方问用户
- 中文全角标点，英文半角。直接陈述：英文写 `Fixed X`（不写 `Fixed an issue where`），中文去掉「由于」「本次」
- 用玩家熟悉的简称与主动句式（「魔免」「不再触发 X」）
- 玩家视角：写加强、削弱、修正了谁、哪类玩法变了。数值改动用定性表述（用户指定或玩家需要理解的档位除外）。KV、override、AbilityValues、注释、文件路径这类维护用语不出现
- **bot 行为改动只写行为方向**：「电脑现在会主动使用 XX」「电脑不再误用 XX」/ `Bot now actively uses XX`、`Bot no longer misuses XX`
- 觉醒限时免费清单（`FREE_TRIAL_HEROES`）的增减、注释同步、KV 对照、纯文档变更不写
- **名词以本地化文件为准**：英雄、物品、技能及其效果名 grep `game/resource/addon_schinese.txt` / `addon_english.txt` 核实（英雄键 `npc_dota_hero_<id>`）；项目里没有时查 `docs/reference/<version>/abilities_*.txt` 的 `npc_dota_hero_<id>:n`
- **多英雄并列**：同一条 bullet 列出全部英雄，中文用全角逗号分隔，英文用 `, `。PR 先用 `gh pr diff <N> --name-only` 看改了哪些文件，要技能前缀时把 `gh pr diff <N>` 管道给 grep 只取改动行的键名，不整份读入，只列本 PR 涉及的英雄
- 从 PR 提取：优先用描述里的更新列表，没有就从 commits 推断 3–5 条

常用术语：同步Dota更新 Sync Dota update / 修正 Fixed / 新增 Added / 调整 Adjusted / 技能抽选池 Ability draft pool / 金钱经验倍率 Gold/XP multiplier / 中立物品 Neutral items / 勇士积分 Battle point / 电脑 Bot。

完成：中英文两版条目一一对应、标题含具体版本号；每个效果名词都已 grep 核实。

## 3. 写回 PR

按参数的写回方式执行，参数没给就停下回报五个选项。

编辑流程：`gh pr view <N> --repo windy10v10ai/game --json body -q .body` 取 body → 改 → 写临时文件（UTF-8 无 BOM）→ `gh pr edit <N> --body-file <文件>`。

**功能 PR**：`gh pr list --repo windy10v10ai/game --head $(git branch --show-current) --state open --json number,url`，一条就用它，多条停下回报候选，没有就只输出文案。保留 `## Release Note` 之上的内容，替换该标题到文末为 `## Release Note` + 中文围栏块 + 英文围栏块。

**聚合 release PR**（标签 `release`，`develop → main`，标题即大版本号）收集本轮所有条目，布局参考 [#2253](https://github.com/windy10v10ai/game/pull/2253)：

```
## Checklist

- [ ] 更新游戏版本号

## Release Note

<大版本 中文围栏块>
<大版本 英文围栏块>

---

<该补丁版本的关联 PR 链接等 checklist 行，用户手动维护>

<补丁版本 中文围栏块>
<补丁版本 英文围栏块>
```

- **补丁版本**：只动 `---` 之下。该补丁版本已有围栏块就把中英文条目分别追加到末尾；新补丁版本在文末新起 `---` + 中英文围栏块
- **大版本**：把中英文条目分别追加进 `## Release Note` 与首个 `---` 之间的围栏块，已有条目原样保留，「修正一些bug和平衡性改动」这类兜底行留在末尾；`---` 之下的补丁块全部保留（各自在 Steam 发过，留档）
- 大版本块里不重复已在保留的小版本块或已发布版本中出现过的改动

完成：条目已进入用户所选的 PR，release PR 里其他版本块原样未动。

## 4. 回报

版本号、中英文条目全文、写回了哪个 PR、`GAME_VERSION` 是否改动；停下时写明卡在哪一步和待选项。

参数：$ARGUMENTS
