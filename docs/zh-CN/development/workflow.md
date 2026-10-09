# 开发流程

完成[环境配置](setup.md)，然后在仓库根目录的 PowerShell 中执行：

```powershell
npm run start
```

此命令以 Tools 模式启动 Dota，并启动 Panorama 与 VScripts 文件监听。
确认编译没有错误且地图已启动。
Dota 已经运行时，启动器不会重新启动它；需要时先重新以 Tools 模式启动游戏。

提交修改前执行：

```powershell
npm run lint
npm test
npm run build
```

`npm run build` 构建两个层。单独构建可使用 `npm run build:panorama`
或 `npm run build:vscripts`。`npm run lint:fix` 应用 ESLint 自动修复。
构建和自动测试不能替代在 Tools 中验证玩法或界面。

## VConsole

在 Dota 的 VConsole 中执行以下命令，不要在 PowerShell 中执行：

```text
dota_launch_custom_game windy10v10ai dota
dota_launch_custom_game windy10v10ai custom
dota_custom_ui_debug_panel 7
script_reload
host_timescale <float>
```

前两条命令分别在 `dota` 或 `custom` 地图启动地图。
后续命令显示结算面板、重新加载 Lua。将 `<float>` 替换为速度倍率；
`host_timescale 1` 恢复正常速度。

## 源文件布局

- [`src/common/`](../../../src/common/)：共享类型。
- [`src/vscripts/`](../../../src/vscripts/)：TypeScript 游戏逻辑，编译到 `game/scripts/vscripts/`。
- [`src/panorama/`](../../../src/panorama/)：TypeScript/React 界面；当前 Webpack 输出到 `content/panorama/layout/custom_game/react/`。
- [`src/scripts/`](../../../src/scripts/)：开发工具。
- [`game/`](../../../game/) 和 [`content/`](../../../content/)：地图运行资源。

修改 TypeScript 源文件，不要修改生成的 Lua。参考[数据流](../architecture/README.md)
和[贡献指南](../../../.github/CONTRIBUTING.md)；PR 的目标分支为 `develop`。
