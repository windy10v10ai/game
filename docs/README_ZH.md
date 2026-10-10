# Windy10v10AI

[English](../README.md) | 简体中文

这是一个 PVE Dota2 自定义游戏项目。<br>
游戏发布在 Steam 创意工坊：[10v10 AI custom by windy](https://steamcommunity.com/sharedfiles/filedetails/?id=2307479570)

## 📊 项目状态

[![Build Status](https://github.com/windy10v10ai/game/actions/workflows/test.yml/badge.svg)](https://github.com/windy10v10ai/game/actions/workflows/test.yml)
[![](https://img.shields.io/github/release/windy10v10ai/game)](https://github.com/windy10v10ai/game/releases)
[![License: GPL v3](https://img.shields.io/badge/license-GPLv3-blue.svg)](../LICENSE)
[![CodeFactor](https://www.codefactor.io/repository/github/windy10v10ai/game/badge)](https://www.codefactor.io/repository/github/windy10v10ai/game)

[![Last Commit](https://img.shields.io/github/last-commit/windybirth/windy10v10ai)](https://github.com/windybirth/windy10v10ai/commits)
[![Commit Activity](https://img.shields.io/github/commit-activity/m/windybirth/windy10v10ai)](https://github.com/windybirth/windy10v10ai/graphs/commit-activity)
[![GitHub issues](https://img.shields.io/github/issues/windy10v10ai/game.svg)](https://github.com/windy10v10ai/game/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/windy10v10ai/game.svg)](https://github.com/windy10v10ai/game/pulls)

[![GitHub contributors](https://img.shields.io/github/contributors/windy10v10ai/game.svg)](https://github.com/windy10v10ai/game/graphs/contributors)
[![GitHub stars](https://img.shields.io/github/stars/windy10v10ai/game.svg)](https://github.com/windy10v10ai/game/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/windy10v10ai/game.svg)](https://github.com/windy10v10ai/game/network)

## 许可证

本项目采用 **GNU GPL v3** 协议（见 [`LICENSE`](../LICENSE)），并附带 Steam/创意工坊
分发例外，相关说明及此前 MIT 版本的处理见 [`LICENSE.EXCEPTIONS.md`](../LICENSE.EXCEPTIONS.md)。

## 贡献者

[![Contributors](https://contrib.rocks/image?repo=windy10v10ai/game)](https://github.com/windy10v10ai/game)

### 参与开发

如果你想参与 Windy10v10AI 的开发，请参考我们的[参与指南](../.github/CONTRIBUTING_ZH.md)。

## 开始

### 系统要求

`Windows 10/11`

### 开发工具

- [Github Desktop](https://desktop.github.com/)
- [VS Code](https://code.visualstudio.com/)
- [Source 2 Viewer](https://valveresourceformat.github.io/)

### 环境配置

1. 安装 Dota2 和 [Dota 2 Workshop Tools](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Installing_and_Launching_Tools)。
2. 安装 [node.js](https://nodejs.org/)。所需版本固定在 [`.nvmrc`](../.nvmrc)（`v24`）中。
   推荐使用 [nvm](https://github.com/coreybutler/nvm-windows/releases) 安装 node。

   在仓库根目录的 PowerShell 中运行。`nvm-windows` 不会直接读取 `.nvmrc`，
   需要通过 `$(Get-Content .nvmrc)` 传入内容：

```powershell
# 安装/更新 node 版本
nvm install $(Get-Content .nvmrc)
nvm use $(Get-Content .nvmrc)
```

3. 将本仓库 clone 到本地。**仓库必须和 Dota2 在同一块硬盘分区上。**
4. 在仓库根目录运行 `npm install`。content 和 game 目录会被链接到 dota2 的 dota_addons 目录。

```bash
npm install
```

### Claude Code（可选）

本项目自带 Claude Code 配置（`.claude/`）用于 AI 辅助开发，有两种使用方式：

1. **官网订阅** — 安装 [Claude Code](https://claude.com/claude-code) 并登录。
2. **第三方 API** — 安装 [Claude Code VS Code 插件](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code)，在 `.claude/settings.local.json`（已被 git 忽略）中配置 API 地址与密钥：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://your-api-endpoint",
    "ANTHROPIC_AUTH_TOKEN": "your-api-key"
  }
}
```

建议安装 [GitHub CLI](https://cli.github.com/) 并运行 `gh auth login`，以便 Claude Code 帮你创建 PR、管理 issue。

### Dota2 原版参考文件（可选）

部分开发任务（编辑技能/物品 KV、本地化、AI 调参）需要参考 `docs/reference/<版本>/` 下的原版 Dota2 文件。该目录已被 git 忽略，需用 [Source 2 Viewer](https://valveresourceformat.github.io/) 自行解压：打开 `dota 2 beta/game/dota/pak01_dir.vpk`，将 `scripts/npc/` 目录以及 `abilities_english.txt`、`abilities_schinese.txt` 两个本地化文件解压到 `docs/reference/<版本>/` 下。

## 开发

### 启动 Dota2 开发工具并构建项目

> 在 Windows PowerShell/cmd 中运行

```bash
npm run start
```

### VConsole 命令

> 在 Dota2 VConsole 中运行

```bash
# 启动/重新启动自定义游戏
dota_launch_custom_game windy10v10ai dota
dota_launch_custom_game windy10v10ai custom
# 显示游戏结束面板
dota_custom_ui_debug_panel 7
# 重新加载 lua
script_reload
# 加速游戏到指定倍速
host_timescale <float>
```

### 如何编译图片 png 为 vtex_c

如果 png 在 xml 中被引用了，则会自动编译。对于独立的 png 文件，采用以下方式编译。

1. 将 png 文件放到 [`content/panorama/images`](../content/panorama/images) 目录。
2. 在 [`content/panorama/layout/custom_game/images.xml`](../content/panorama/layout/custom_game/images.xml) 中添加该图片。

运行 `npm run start` 时，png 会被自动编译为 vtex_c。

## 常见问题

### 构建或启动出错

代码需要和 dota2 在同一块硬盘分区上。
重新安装可以解决大部分问题。

```bash
rm -r ./node_modules
npm install
```

### 技能特效消失

console 中出现如下报错时，技能特效会消失。删除报错中对应的文件，然后重新启动 Dota2 即可。

```
Failed loading resource "particles/units/heroes/hero_skywrath_mage/skywrath_mage_mystic_flare_ambient.vpcf_c" (ERROR_BADREQUEST: Code error - bad request)
```

## 文件夹内容说明

| 目录 | 内容 |
|---|---|
| `src/vscripts/` | 用 TypeScript 编写的游戏逻辑，编译为 Lua 输出到 `game/scripts/vscripts/`（不要手改输出）。包含技能、物品、modifier、模块、AI 和 API 调用 |
| `src/panorama/` | 用 React + TypeScript 编写的 UI，由 webpack 构建到 `content/panorama/scripts/custom_game/` |
| `src/common/` | VScripts 与 Panorama 共用的类型声明（net tables、自定义事件、DTO） |
| `src/scripts/` | `npm run` 命令背后的 node 辅助脚本（启动、安装、检查、bot 分析等） |
| `game/` | 与 `dota 2 beta/game/dota_addons/<addon>` 同步：NPC KV 文件（`game/scripts/npc/`）、本地化文案（`game/resource/`）和编译后的 Lua |
| `content/` | 与 `dota 2 beta/content/dota_addons/<addon>` 同步：脚本以外的 Panorama 源文件（xml、less、图片）、地图、特效和音效 |
| `assets/` | 可编辑的美术源文件（psd、sai2），仅作留存 |
| `docs/` | 文档：各语言 README、数据流图（`drawio/`），以及需要自行解压的 Dota 2 原版参考文件（`reference/`，已被 git 忽略） |
| `.claude/` | Claude Code 配置与项目 skill（见 [Claude Code](#claude-code可选)） |

`src/vscripts/`、`src/panorama/`、`game/scripts/npc/`、`game/resource/` 下各有一个 `CLAUDE.md`，写明该层的规则。

### 数据流

![Data Flow](drawio/dataflow.png)

## 参考资料

本项目基于 ModDota 模板和 x-template。

- [ModDota TypeScriptAddonTemplate](https://github.com/ModDota/TypeScriptAddonTemplate)（示例 modifier 和技能：[src/vscripts](https://github.com/ModDota/TypeScriptAddonTemplate/tree/master/src/vscripts)）
- [X-Template](https://github.com/XavierCHN/x-template)
- [TypeScript for VScripts](https://typescripttolua.github.io/) 和 [TypeScript 入门](https://moddota.com/scripting/Typescript/typescript-introduction/)
- [TypeScript for Panorama](https://moddota.com/panorama/introduction-to-panorama-ui-with-typescript)
- [React in Panorama 教程](https://moddota.com/panorama/react)

## 项目活动

![Alt](https://repobeats.axiom.co/api/embed/9528af5cb8e8d8b5f560ac532a775439dcf11b57.svg "Repobeats analytics image")

[![Star History Chart](https://api.star-history.com/svg?repos=windybirth/windy10v10ai&type=Date)](https://star-history.com/#windybirth/windy10v10ai&Date)

![](https://api.moedog.org/count/@windybirth.readme)
