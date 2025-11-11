# Windy10v10AI

This is a PVE Dota2 custom game project.<br>
Game is published on Steam workshop: [10v10 AI custom by windy](https://steamcommunity.com/sharedfiles/filedetails/?id=2307479570)

## 📊 Project Status

[![Build Status](https://github.com/windy10v10ai/game/actions/workflows/test.yml/badge.svg)](https://github.com/windy10v10ai/game/actions/workflows/test.yml)
[![](https://img.shields.io/github/release/windy10v10ai/game)](https://github.com/windy10v10ai/game/releases)
[![License: MIT](https://img.shields.io/github/license/windy10v10ai/game.svg)](LICENSE)
[![CodeFactor](https://www.codefactor.io/repository/github/windy10v10ai/game/badge)](https://www.codefactor.io/repository/github/windy10v10ai/game)

[![Last Commit](https://img.shields.io/github/last-commit/windybirth/windy10v10ai)](https://github.com/windybirth/windy10v10ai/commits)
[![Commit Activity](https://img.shields.io/github/commit-activity/m/windybirth/windy10v10ai)](https://github.com/windybirth/windy10v10ai/graphs/commit-activity)
[![GitHub issues](https://img.shields.io/github/issues/windy10v10ai/game.svg)](https://github.com/windy10v10ai/game/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/windy10v10ai/game.svg)](https://github.com/windy10v10ai/game/pulls)

[![GitHub contributors](https://img.shields.io/github/contributors/windy10v10ai/game.svg)](https://github.com/windy10v10ai/game/graphs/contributors)
[![GitHub stars](https://img.shields.io/github/stars/windy10v10ai/game.svg)](https://github.com/windy10v10ai/game/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/windy10v10ai/game.svg)](https://github.com/windy10v10ai/game/network)

## Contributors

[![Contributors](https://contrib.rocks/image?repo=windy10v10ai/game)](https://github.com/windy10v10ai/game)

### Join us

If you would like to contribute to Windy10v10AI, please see our [contributing guidelines](.github/CONTRIBUTING.md).
<br>
如果你想参与Windy10v10AI的开发，请参考我们的[参与指南](.github/CONTRIBUTING.md#参与开发-windy10v10ai)。

# Get Start

## OS Requirement

`Windows 10/11`

## Develop Tool

- [Github Desktop](https://desktop.github.com/)
- [VS Code](https://code.visualstudio.com/)
- [Source 2 Viewer](https://valveresourceformat.github.io/)

## Setup

1. Install Dota2 and [Dota 2 Workshop Tools](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Installing_and_Launching_Tools).
2. Install [node.js](https://nodejs.org/). `v22`
   Recommend install node use [nvm](https://github.com/coreybutler/nvm-windows/releases)

```bash
# set/update node version
nvm install $(Get-Content .nvmrc)
nvm use $(Get-Content .nvmrc)
```

3. Clone this repository to local. Run `npm install` in the repository root directory. Content and game folder will be linked to dota2 dota_addons directory.

# Develop

## Launch Dota2 devTools and build the project

> Run in windows powershell/cmd

```bash
npm run start
```

## VConsole Command

> Run in Dota2 VConsole

```bash
# launch/relaunch custom game
dota_launch_custom_game windy10v10ai dota
dota_launch_custom_game windy10v10ai custom
# show game end panel
dota_custom_ui_debug_panel 7
# reload lua
script_reload
# Speeds the game up to that number 加速游戏到指定倍速
host_timescale <float>
```

### How to compile png to vtex_c (Recommended) 如何编译图片png文件

If a PNG is referenced within an XML file, it will be compiled automatically. For standalone PNG files, use the following method to compile.
如果png在xml中被引用了，则会自动编译。对于独立的png文件，采用以下方式编译。

1. Add png file to [`content/panorama/images`](/content/panorama/images) folder.
2. Add image to [`content/panorama/layout/custom_game/images.xml`](/content/panorama/layout/custom_game/images.xml) file.

png will be compiled to vtex_c automatically when you run `npm run start`.

## Troubleshooting

This code needs to be on the same hard drive partition as dota2.<br>
代码需要和dota2在同一块硬盘分区上。

Reinstall solve most of the problems.<br>
重新安装可以解决大部分问题。

```bash
rm -r ./node_modules
npm install
```

# Documentation

## Supported by ModDota template and x-template

### ModDota template

https://github.com/ModDota/TypeScriptAddonTemplate

### X-Template

https://github.com/XavierCHN/x-template

## Typescript to lua

- sample modifiers and abilities:
  https://github.com/ModDota/TypeScriptAddonTemplate/tree/master/src/vscripts

## ModDota template README

Panorama UI with webpack, TypeScript and React.

- [TypeScript for VScripts](https://typescripttolua.github.io/) Check out [Typescript Introduction](https://moddota.com/scripting/Typescript/typescript-introduction/) for more information.
- [TypeScript for Panorama](https://moddota.com/panorama/introduction-to-panorama-ui-with-typescript)
- [React in Panorama tutorial](https://moddota.com/panorama/react)

## Contents 文件夹内容说明

- **[src/common]:** TypeScript .d.ts type declaration files with types that can be shared between Panorama and VScripts
- **[src/vscripts]:** TypeScript code for Dota addon (Lua) vscripts. Compiles lua to game/scripts/vscripts.
- **[src/panorama]:** TypeScript code for panorama UI. Compiles js to content/panorama/scripts/custom_game
  <br>
  <br>
- **[game/*]:** Dota game directory containing files such as npc kv files and compiled lua scripts.
- **[content/*]:** Dota content directory containing panorama sources other than scripts (xml, css, compiled js)

---

- **[src/vscripts]:** 用来写`tstl`代码，lua脚本会被编译到`game/scripts/vscripts`目录下
  - **[src/vscripts/shared]:** 用来写`panorama ts`和`tstl`公用的声明，如`custom_net_tables`等
- **[src/scripts]:** 各种 node 脚本，用来完成各种辅助功能
  <br>
  <br>
- **[game/*]:** 会和 `dota 2 beta/game/dota_addons/your_addon_name` 同步更新
- **[content/*]:** 会和 `dota 2 beta/content/dota_addons/your_addon_name` 同步更新

## Data Flow

![Data Flow](docs/drawio/dataflow.png)

# 维护指南

## Console报错

console中有如下报错时，技能特效会消失，需要删除对应的文件，然后重新启动Dota2即可。

```
Failed loading resource "particles/units/heroes/hero_skywrath_mage/skywrath_mage_mystic_flare_ambient.vpcf_c" (ERROR_BADREQUEST: Code error - bad request)
```

<br>

# Activity

![Alt](https://repobeats.axiom.co/api/embed/9528af5cb8e8d8b5f560ac532a775439dcf11b57.svg "Repobeats analytics image")

[![Star History Chart](https://api.star-history.com/svg?repos=windybirth/windy10v10ai&type=Date)](https://star-history.com/#windybirth/windy10v10ai&Date)

![](https://api.moedog.org/count/@windybirth.readme)
