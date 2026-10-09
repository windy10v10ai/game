# 文档

- [架构：数据流](architecture/README.md)
- [项目配置与开发](../../README.md)

翻译使用 `docs/<语言>/` 下相同的相对路径，例如
`docs/en/architecture/README.md` 和 `docs/ru/architecture/README.md`。
语言代码使用 `en`、`ru`、`zh-CN`；新增语言时创建对应目录。
共用图表和附件放在 `docs/shared/`，不要为每种语言重复复制。
`docs/reference/` 用于本地 Dota 原版数据快照，不纳入 Git。

美术源文件位于 `assets/sources/`，保留的编译资源位于 `assets/compiled/`，
物品工作笔记位于 `notes/items/`，资源编译脚本位于 `scripts/compile-resources.bat`。
游戏运行资源仍位于 `content/` 和 `game/`。
