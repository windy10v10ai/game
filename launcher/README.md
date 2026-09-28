# 本机专用服启动器

玩家双击运行的 Windows 小程序 `Windy10v10AI.exe`：在本机开一个专用服并自动连进去，用来缓解后期卡顿。

## 目标

后期 10v10 的卡顿主要来自本地主机：服务器逻辑和客户端渲染挤在同一个进程里互相拖慢。在本机单独开一个专用服再连进去，两者分到不同核心，本机实测后期客户端平均 FPS 从 7 提升到约 65。

启动器让不懂命令行的玩家也能用上这个办法：双击打开，点一个难度就开始。

## 范围

- 只支持单人本机：服务器只监听 `127.0.0.1`，不碰防火墙和端口转发。联机需要先验证多人数据加载，另立需求。
- 界面只显示正式服；右下角不起眼的「开发选项」可切到测试服，供开发者验证未发布的改动。
- 三个按钮（简单 / 困难 / 自定义）对应游廊的 `dota` / `hard` / `custom` 三张图，与官网启动页一致；难度照常在准备阶段投票。

## 流程

1. Dota 在运行时弹窗确认后关闭再启动。专用服和客户端都是 `dota2.exe`，已有客户端时新开的客户端会被拒绝；打完一局想再开也走这条路。
2. 从注册表和 `libraryfolders.vdf` 找 Dota 所在的 Steam 库。
3. 确认工坊地图已下载且是最新。已装版本读 Steam 的 `appworkshop_570.acf`；最新版本在后台调 Steam 公开 Web API `ISteamRemoteStorage/GetPublishedFileDetails`（无需 key）取已发布的 manifest 来比对，因为 acf 里的 `latest_timeupdated` 靠客户端同步，实测发布后可以长期不更新。大陆部分网络直连不了 Steam，直连失败时经游戏同一个国内代理（腾讯云 SCF 广州）请求后端的 `GET /api/launcher/workshop/:id`，由后端代为查询。两路都失败时显示「无法确认地图是否最新」，1 分钟后重试；acf 只用来证明「有新版」，不用来证明「已是最新」。检测中和无法确认都不拦启动；没下载时给「订阅地图」按钮，在 Steam 客户端里打开创意工坊页；过旧只提示，不代玩家更新（Steam 没有开放触发下载的接口）。引擎只从 `game/dota_addons/<id>/` 挂载地图，所以每次启动都把工坊 VPK 硬链接到 `pak01_dir.vpk`（跨盘时复制），工坊更新后下次启动自动生效。
4. 隐藏窗口启动专用服，轮询 `dedicated.log` 直到地图加载完成。服务器不报告加载进度，界面只显示等待动画，不给百分比；超过 1 分钟改为「比平时慢」，3 分钟判定失败并关掉服务器。
5. 直接启动客户端并 `+connect`。不走 `steam://run`，它带参数时会弹 Steam 确认框。
6. 客户端退出后关闭专用服，玩家不用自己找后台进程。

## 决定

- **C# WinForms，用系统自带的 .NET Framework 编译器（`csc.exe`）编成单个 exe。** 玩家零依赖、免安装、体积约 200 KB（大部分是图标）。没选 PowerShell 界面，因为会闪控制台、易被杀毒拦、受执行策略限制；没选 Electron/Tauri，体积和构建成本与一个选择框加按钮不相称。
- **源码公开在本仓库。** 新发布的 exe 没有下载量积累，浏览器和 Windows 会提示可疑；公开源码让玩家可以自己核对启动器做了什么。
- **不签名。** 首次运行会出现 SmartScreen 提示，由下载页说明「更多信息 → 仍要运行」。签名证书的成本等用户量证明值得再说。
- **发布放官网下载页，不挂 GitHub Release。** 大量国内玩家打不开 GitHub。
- **界面文案按系统语言显示中文、俄文或英文。** 配色取图标 Dota logo 的火焰橙配暖黑底，与横幅和图标一致。
- **出错时在按钮下方的状态区显示提示条，不弹框，窗口结构不随状态变化。** 服务器相关的失败附「打开日志」，定位到日志文件方便玩家发给我们。

## 编译

```bat
launcher\build.cmd
```

产物在 `launcher/dist/Windy10v10AI.exe`（已 gitignore）。`launcher\build.cmd beta` 编出内测版到 `dist/beta/`：默认显示开发选项并勾选测试服，给内测玩家直接用测试地图。只依赖 Windows 自带的 .NET Framework 4 编译器，所以源码只能用 C# 5 语法（没有 `$""` 字符串插值、`?.` 等）。

改了 `launcher/` 的 PR 会由 `.github/workflows/launcher.yml` 在 Windows 上编译一次。

## 发布

exe 只放官网 `/launch` 下载页。官网代码在 [windy10v10ai/firebase](https://github.com/windy10v10ai/firebase) 的 `web/`，每次改启动器都要同步发布：

1. 本仓库：改 `src/Launcher.cs` 的 `Version` 与 `AssemblyVersion`，运行 `launcher\build.cmd`，随代码改动一起开 PR。修 bug 升第三位，新增玩家可见功能升第二位。
2. firebase 仓库：从 `develop` 拉分支，把 `dist/Windy10v10AI.exe` 复制为 `web/public/downloads/Windy10v10AI-<version>.exe`，删掉旧版 exe，改 `web/app/launch/launcher.ts` 的 `LAUNCHER_VERSION`，开 PR 进 `develop`。

内测版 `dist/beta/` 不上官网，直接发给内测玩家。

## 素材

`assets/` 的横幅裁自游戏加载图 `content/panorama/images/custom_game/gamemode.png`，图标取自 `docs/resource/images/Title.jpg`（去掉外圈黑底和底部文字）。
