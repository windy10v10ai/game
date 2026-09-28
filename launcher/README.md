# 本机专用服启动器

玩家双击运行的 Windows 小程序 `Windy10v10AI.exe`：在本机单独开一个专用服再连进去，服务器和客户端分到不同核心，缓解后期卡顿。只支持单人。

## 做了什么

1. 找到 Steam 里的 Dota 2 和已订阅的地图，检查地图是否最新。
2. 在后台启动专用服，等地图加载完成。
3. 启动 Dota 2 并自动连进去；游戏退出后关闭专用服。

## 编译

```bat
launcher\build.cmd
```

产物在 `launcher/dist/Windy10v10AI.exe`。只依赖 Windows 自带的 .NET Framework 4 编译器，源码只能用 C# 5 语法。

## 发布

exe 放在官网 `/launch` 下载页，代码在 [windy10v10ai/firebase](https://github.com/windy10v10ai/firebase) 的 `web/`：

1. 本仓库：改 `src/Launcher.cs` 的 `Version` 与 `AssemblyVersion`，编译，随代码改动开 PR。
2. firebase 仓库：把 exe 复制为 `web/public/downloads/Windy10v10AI-<version>.exe`，删掉旧版，改 `web/app/launch/launcher.ts` 的 `LAUNCHER_VERSION`，开 PR。
