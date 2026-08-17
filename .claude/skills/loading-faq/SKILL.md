---
name: loading-faq
description: >-
  维护 Dota 10v10 AI 自定义加载界面的 FAQ。用户提供原始问题、答案或要求新增/优化加载提示时，
  自动将其精简为面向玩家的问答，判断常见/冷门分类，写入传统 Panorama 加载屏及中英俄本地化。
  适用于“加一个加载 FAQ”“优化加载页文案”“加载提示加 XX”等请求。
---

# 维护加载屏 FAQ

在自定义加载屏顶部中偏右显示一条随机 FAQ。用户给出原始文本即视为文案与实现授权，直接优化并完成写入；仅当机制事实无法从代码确认，或分类会明显改变用户意图时才询问。

## 固定结构

- 布局：[content/panorama/layout/custom_game/custom_loading_screen.xml](content/panorama/layout/custom_game/custom_loading_screen.xml)
  - 保持 `LoadingFaqPanel` 下的 `LoadingFaqQuestion` 与 `LoadingFaqAnswer` 两个 Label。
  - 不新增 FAQ 标题，不把问答合并为单个 Label。
- 样式：[content/panorama/styles/custom_game/custom_loading_screen.css](content/panorama/styles/custom_game/custom_loading_screen.css)
  - FAQ 是无边框、无背景的嵌入式文字，不做浮窗卡片。
  - 保持上方中偏右位置，避开左侧游戏选项、右侧队伍面板和中央 Dota 标志。
  - 问题使用暖色、较大且粗体，答案使用较小的浅色正文。
- 随机逻辑：[content/panorama/scripts/custom_game/game_mode.js](content/panorama/scripts/custom_game/game_mode.js)
  - `LOADING_FAQ_GROUPS` 的常见组权重为 `8`，冷门组权重为 `2`，先按组加权，再在组内等概率抽取。
  - 每条 entry 仅写 key 前缀 `loading_faq_<topic>`，脚本读取 `<prefix>_question` 和 `<prefix>_answer`。

## 文案与分类

1. 先在现有本地化中查术语，再写文案。沿用已存在的名称，例如“藏宝箱”“物品抽奖”“肉山”“多重施法（觉醒）”。
2. 问题面向新玩家，直接描述玩家看见的现象，避免内部术语和实现细节。
3. 答案优先 1–2 句，先给结论，再给必要条件或操作。不要使用分号。
4. 不用 `<br>`、HTML 或文本换行分隔问答，两个 Label 自然换行。
5. 核心、新玩家高频或全局机制归入常见。仅特定英雄、多人场景、背包边界或高级规则归入冷门。
6. 涉及实际奖励、奖池、叠加或掉落规则时，先读对应代码验证；不要把“概率更高”写成“奖励档位更高”，或反过来。

## 写入本地化

同时修改以下三个文件：

- `game/resource/addon_schinese.txt`
- `game/resource/addon_english.txt`
- `game/resource/addon_russian.txt`

在 `loading_status_*` 段落之后保留一个空行，以 `// FAQ` 开始 FAQ 段。每条 FAQ 必须在三语文件中使用相同的两条 key：

```text
loading_faq_<topic>_question
loading_faq_<topic>_answer
```

保持两个 tab 缩进、三语 key 完整对应和相同段落结构。UI 文本必须同步俄文。

## 工作流

1. 读取 `.claude/CLAUDE.md` 与 `localization-format-guide` skill，查看现有 FAQ 和相关机制代码。
2. 将用户原始文本优化为中文问答，并依照现有术语翻译为英文和俄文。
3. 选择常见或冷门组，在 `LOADING_FAQ_GROUPS` 加入对应前缀，并在三语 `// FAQ` 段增加问答 key。
4. 若修改问答结构或展示样式，同时检查 XML、脚本和 CSS 仍使用两个 Label 的无边框嵌入式设计。
5. 验证：运行 `git diff --check`、`node --check content/panorama/scripts/custom_game/game_mode.js`，检查每个新增 key 在三语文件中各出现一次，并确认 entry 已注册到脚本。
6. 提示用户在 Dota Tools 实测 16:9 与窄屏下的位置、换行和随机结果。
