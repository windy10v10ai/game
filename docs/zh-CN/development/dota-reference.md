# Dota 原版参考文件

修改技能/物品 KV、本地化或 AI 时，可能需要 `docs/reference/<version>/` 下的数据快照。
此目录为可选项，被 Git 忽略，不包含在仓库克隆中。

使用 [Source 2 Viewer](https://valveresourceformat.github.io/) 打开
`dota 2 beta/game/dota/pak01_dir.vpk`，将 `scripts/npc/` 及
`abilities_english.txt`、`abilities_schinese.txt` 提取到版本目录。

NPC 文件应直接位于 `docs/reference/<version>/`，不要额外嵌套 `scripts/npc/`。
确认本地化文件和 `heroes/` 目录存在。版本名称应与提取的游戏数据一致。
这些文件用于参考，不是地图的可编辑源文件。
