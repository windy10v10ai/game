# 本机专用服启动器

玩家双击运行的 Windows 小程序 `Windy10v10AI.exe`：在本机单独开一个专用服再连进去，服务器和客户端分到不同核心，缓解后期卡顿。只支持单人。

## 做了什么

1. 找到 Steam 里的 Dota 2 和已订阅的地图，检查地图是否最新。
2. 在后台启动专用服，等地图加载完成。
3. 启动 Dota 2 并自动连进去；游戏退出后关闭专用服。

每次打开时查一次有没有新版本，有就在提示条上给出「更新」按钮，点击后下载、替换自己并重启。

## 自我更新

- **版本信息与下载都走 API**：国内代理只转发 `/api/`，大陆玩家先直连、失败再走代理，和地图检测同一套路线。
- **只校验 sha256，不做代码签名**：发版只有维护者本人能部署，哈希用来挡下载不完整或被代理损坏；以后要加签名，旧版会先自动更新到带公钥的版本，不需要玩家手动下载。
- **只升不降**：线上版本比自己新才提示，本地开发时把版本号定得比线上高，不会被换回旧版。
- 封闭测试版（`build.cmd beta`）不检查更新。

## 编译

```bat
launcher\build.cmd
```

产物在 `launcher/dist/Windy10v10AI.exe`。只依赖 Windows 自带的 .NET Framework 4 编译器，源码只能用 C# 5 语法。

## 发布

exe 放在官网 `/launch` 下载页，代码在 [windy10v10ai/firebase](https://github.com/windy10v10ai/firebase) 的 `web/`：

1. 本仓库：改 `src/Launcher.cs` 的 `Version` 与 `AssemblyVersion`，编译，随代码改动开 PR。
2. firebase 仓库，同一个 PR 里：
   - 把 exe 复制为 `web/public/downloads/Windy10v10AI-<version>.exe`，删掉旧版。
   - 改 `web/app/launch/launcher.ts` 的 `LAUNCHER_VERSION`。
   - 改 `api/src/launcher/launcher-release.service.ts` 的版本号与 sha256（PowerShell `(Get-FileHash <exe>).Hash.ToLower()`）。抄错时 api 单测会失败。
3. 合并 firebase 的 Release PR 前，确认 `web/public/downloads/` 里只有自己这次的改动：exe 在 diff 里只显示为二进制变更，线上玩家会自动更新到它。
