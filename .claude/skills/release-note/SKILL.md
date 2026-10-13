---
name: release-note
description: 生成 Steam Workshop 中英文更新日志（Release Note），可写回 PR。
---

# Release Note

为 Steam Workshop 生成中英文更新日志。纯内部改动不写，判定见 `create-pr` skill「Release Note 三选一」。

参数三种：

- `#1234`、纯数字或含 `/pull/` 的 URL → PR：读标题、描述、commits
- 含 `/issues/` 的 URL → Issue：按 `references/from-issue.md`
- 其他 → 按用户列的点写

## 1. 定版本号

版本号是具体的 `v…` 字符串：主版本 `v5.00` / `v5.10`，补丁 `v5.00a` / `v5.00b`。按下列优先级，命中即用：

1. **用户指定**：参数里有 `v5.xxa` / `5.xx` 等，规范为 `v…` 采用
2. **口令 `版本号+1`**：Steam 最新去掉字母后缀 +0.01（`v5.19b` → `v5.20`）。与 open release PR 版本一致就采用，不一致问用户
3. **open release PR 大版本高于 Steam**：每次都重新 WebFetch [Steam Changelog](https://steamcommunity.com/sharedfiles/filedetails/changelog/2307479570) 第 1 页首条作为 Steam 最新版，再查 `gh pr list --repo windy10v10ai/game --state open --label release --json number,title,url`：
   - release PR 大版本严格高于 Steam（Steam `v5.45b`、PR `v5.46`）→ 用 `AskUserQuestion` 二选一：大版本 `v5.46`（推荐）/ 小版本补丁 `v5.45c`。调用方已注明轨道时直接取对应那条。release PR 是任意 PR 合入 `develop` 后自动创建的（最新 tag 大版本 +1），它的存在不代表本次要发大版本
   - Steam 已发布同大版本 → 第 4 条
   - 多条 release PR → 问用户用哪条
4. **默认**：Steam 同大版本递增补丁字母（`v5.19b` → `v5.19c`，`v5.20` → `v5.20a`），无法解析时问用户

**同步 `GAME_VERSION`**（`src/vscripts/modules/GameConfig.ts`，不含 a/b/c 后缀）：本次所选版本的大版本与它不同时立即修改；选了小版本补丁、大版本未变就不改（即使存在更高大版本的 release PR）。

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
- 中文全角标点，英文半角。直接陈述：英文写 `Fixed X`（不写 `Fixed an issue where`），中文去掉「由于」「本次」
- 用玩家熟悉的简称与主动句式（「魔免」「不再触发 X」）
- 玩家视角：写加强、削弱、修正了谁、哪类玩法变了。数值改动用定性表述（用户指定或玩家需要理解的档位除外）。KV、override、AbilityValues、注释、文件路径这类维护用语不出现
- **bot 行为改动只写行为方向**：「电脑现在会主动使用 XX」「电脑不再误用 XX」/ `Bot now actively uses XX`、`Bot no longer misuses XX`
- 觉醒限时免费清单（`FREE_TRIAL_HEROES`）的增减、注释同步、KV 对照、纯文档变更不写
- **名词以本地化文件为准**：英雄、物品、技能及其效果名 grep `game/resource/addon_schinese.txt` / `addon_english.txt` 核实（英雄键 `npc_dota_hero_<id>`）；项目里没有时查 `docs/reference/<version>/abilities_*.txt` 的 `npc_dota_hero_<id>:n`
- **多英雄并列**：同一条 bullet 列出全部英雄，中文用全角逗号分隔，英文用 `, `。PR 用 `gh pr diff <N>` 提取实际改动的技能前缀，只列本 PR 涉及的英雄
- 从 PR 提取：优先用描述里的更新列表，没有就从 commits 推断 3–5 条

常用术语：同步Dota更新 Sync Dota update / 修正 Fixed / 新增 Added / 调整 Adjusted / 技能抽选池 Ability draft pool / 金钱经验倍率 Gold/XP multiplier / 中立物品 Neutral items / 勇士积分 Battle point / 电脑 Bot。

完成：中英文两版条目一一对应、标题含具体版本号；每个效果名词都已 grep 核实。

## 3. 写回 PR

用选项菜单让用户选：写入功能 PR 并合并进聚合 release PR / 仅写入功能 PR / 仅提交改动 / 跳过。

编辑流程：`gh pr view <N> --repo windy10v10ai/game --json body -q .body` 取 body → 改 → 写临时文件（UTF-8 无 BOM）→ `gh pr edit <N> --body-file <文件>`。

**功能 PR**：`gh pr list --repo windy10v10ai/game --head $(git branch --show-current) --state open --json number,url`，一条就用它，多条让用户选，没有就只输出文案。保留 `## Release Note` 之上的内容，替换该标题到文末为 `## Release Note` + 中文围栏块 + 英文围栏块。

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

- **小版本补丁**：只动 `---` 之下。该补丁版本已有围栏块就把中英文条目分别追加到末尾；新补丁版本在文末新起 `---` + 中英文围栏块
- **大版本**：替换 `## Release Note` 与首个 `---` 之间的围栏块，`---` 之下的补丁块全部保留（各自在 Steam 发过，留档）
- 大版本块里不重复已在保留的小版本块或已发布版本中出现过的改动

完成：条目已进入用户所选的 PR，release PR 里其他版本块原样未动。
