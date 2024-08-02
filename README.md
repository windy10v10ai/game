# Windy10v10AI

This is a PVE Dota2 custom game. 10 Players vs 10 crazy Bots.<br>

这是一个PVE的Dota2的自定义游戏。10位玩家 挑战 10个疯狂的AI。

## Steam workshop

https://steamcommunity.com/sharedfiles/filedetails/?id=2307479570

## Table of Contents 目录

1. [Contributing 参与开发](#contributing)
2. [Get Start 环境配置](#get-start)
   - [Requirement](#requirement)
   - [Develop Tool](#develop-tool)
   - [Install](#install)
3. [Develop 开发](#develop)
   - [Dota2 vConsole2 Command](#dota2-vconsole2-command)
   - [How to compile item png to vtex_c](#how-to-compile-item-png-to-vtex_c)

# Contributing 参与开发

If you would like to contribute to Windy10v10AI, please see our [contributing guidelines](.github/CONTRIBUTING.md).

如果你想参与Windy10v10AI的开发，请参考我们的[参与指南](.github/CONTRIBUTING.md#参与开发-windy10v10ai)。

# Get Start 环境配置

## Requirement 环境要求

`Windows 10/11`

## Develop Tool 开发工具

- [Github Desktop](https://desktop.github.com/)
- [VS Code](https://code.visualstudio.com/)
- [VRF](https://vrf.steamdb.info/)

## Install 安装

1. Install Dota2 and [Dota 2 Workshop Tools](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Installing_and_Launching_Tools).
2. Install [node.js](https://nodejs.org/). `v20`
3. Clone this repository to local. Run `npm install` in the repository root directory. Content and game folder will be linked to dota2 dota_addons directory.

# Develop 开发

```bash
# Launch Dota2 devTools 启动Dota2开发工具
npm run launch

# build typescript to lua and panorama js
# 编译ts为lua和panorama js
npm run dev
```

## Dota2 vConsole2 Command 常用命令

```bash
# load custom game
dota_launch_custom_game windy10v10ai dota
# show game end panel
dota_custom_ui_debug_panel 7
# reload lua
script_reload
```

### How to compile item png to vtex_c 如何编译物品图标为vtex_c

Create item XML file in dota 2 content folder then run `tool/compile_item_png.bat`

FYI: https://www.reddit.com/r/DotA2/comments/8yymx9/item_icons_mods_dont_work_since_one_of_latest/

## Troubleshooting 故障排除

Reinstall solve most of the problems.<br>
重新安装可以解决大部分问题。

```bash
rm -r ./node_modules
npm install
```

If still not work, try to delete `game` and `content` folder in dota2 dota_addons directory.<br>
如果还是不行，尝试删除dota2 dota_addons目录下的`game`和`content`文件夹。

# Documentation 文档

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

# 维护指南

## Console报错

console中有如下报错时，技能特效会消失，需要删除对应的文件，然后重新启动Dota2即可。

```
Failed loading resource "particles/units/heroes/hero_skywrath_mage/skywrath_mage_mystic_flare_ambient.vpcf_c" (ERROR_BADREQUEST: Code error - bad request)
```
