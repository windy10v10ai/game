# 用户在场时逐条询问

自动模式（默认）不询问，存疑技能记入待确认、整块保持原样。只有用户在场并明确要求逐条核对时，才按本文用 `AskUserQuestion` 询问。

## 何时问

- 「待确认」命中的技能、顺带发现的旧偏差：每项一道题，选项为保留补注释 / 同步官方 / 本批不动
- 按注释规则重算后结果与现有 value 不符，且旧版参考不存在、无法确认规则是否变更
- 本图自加的 `LinkedAbility` / `AbilityDraftPreAbility` / 自定义天赋键缺 `// 原版不存在，手动修改`：问是否有意添加，确认有意则补标记保留，否则删除

选项显而易见只有一种合理处理（删除同值、删除无注释的不合规值、P1 禁止项）时直接处理，不问。

## 怎么问

必须用 `AskUserQuestion` 选项菜单，不得用文字列出 A/B/C/D，不得自行假设。

- 每个待决策键单独一道题，最多 4 题一批，超过分批
- `header` 填系统键名（截短到 12 字符内）
- `question` 用中文，开头必须写技能中文名：`「{技能中文名}」{中文属性名}（{系统键名}）：当前官方值 {参考值}，现有 override 值 {当前值}，原注释 {注释}。如何处理？`
- `options` 按实际情况选取：
  - `× N 重算`：description 写候选倍数和结果（如 ×2 → 结果值）。倍数不确定时先让用户选 Other 填写，再单独一题确认
  - `+ N 重算`：description 写候选差值和结果
  - `纯等级扩展`：description 写按差值延伸的结果
  - `保留现有 value`：description 写修正后的注释
- 用户选了「×N」但未指定 N 时，第二轮列出常见倍数选项
- 技能中文名：取 override 里该技能块上方的注释（如 `// 诅咒`），没有再查 `docs/reference/{version}/abilities_schinese.txt` 的 `DOTA_Tooltip_ability_{ability_name}`
- 属性中文名：查 `abilities_schinese.txt` 的 `DOTA_Tooltip_ability_{ability_name}_{key_name}`（去掉末尾冒号），查不到用系统键名
- 用户选择后按其指示重算并更新 value 与注释
