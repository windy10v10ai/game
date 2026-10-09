# 图片与资源

游戏使用的 PNG 放在 [`content/panorama/images/`](../../../content/panorama/images/)。
Workshop Tools 会编译布局 XML 引用的图片。
单独的图片应在
[`content/panorama/layout/custom_game/images.xml`](../../../content/panorama/layout/custom_game/images.xml)
添加引用，然后使用[开发流程](workflow.md)。
在 Tools 中确认编译资源加载成功且图片显示正常。

可编辑美术源文件放在 `assets/sources/`；此目录不会自动部署到地图。
保留的 `assets/compiled/gamemode.vxml_c` 与源文件分开存放。

旧版[资源编译脚本](../../../scripts/compile-resources.bat)处理物品、界面、英雄图片和声音事件。
它包含 Steam 绝对路径及地图名称 `Windy10v10AI`；使用前与实际安装路径及包名
`windy10v10ai` 对照。PNG 优先使用上面的 XML 引用方式。
