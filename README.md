# Windy10v10AI

This is a custom game for Dota2. It is a 10v10 AI game.<br>

这是一个Dota2的自定义游戏。是一个10v10的AI游戏。

## Steam workshop

https://steamcommunity.com/sharedfiles/filedetails/?id=2307479570

## Table of Contents

1. [Contributing 参与指南](#contributing)
2. [Get Start 环境配置](#get-start)
   - [Requirement](#requirement)
   - [Develop Tool](#develop-tool)
   - [Install](#install)
3. [Develop 开发](#develop)
   - [Dota2 vConsole2 Command](#dota2-vconsole2-command)
   - [How to compile item png to vtex_c](#how-to-compile-item-png-to-vtex_c)

# Contributing

If you would like to contribute to Windy10v10AI, please see our [contributing guidelines](.github/CONTRIBUTING.md).

# Get Start

## Requirement

`Windows 10/11`

## Develop Tool

- [Github Desktop](https://desktop.github.com/)
- [VS Code](https://code.visualstudio.com/)
- [VRF](https://vrf.steamdb.info/)

## Install

1. Install Dota2 and [Dota 2 Workshop Tools](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Installing_and_Launching_Tools).
2. Install [node.js](https://nodejs.org/). `v20.10.0`
3. Run `npm install` in root directory. Content and game folder will be linked to dota2 dota_addons directory.

# Develop

## Dota2 vConsole2 Command

```bash
# load custom game
dota_launch_custom_game windy10v10ai dota
# show game end panel
dota_custom_ui_debug_panel 7
# reload lua
script_reload
```

### How to compile item png to vtex_c

Create item XML file in dota 2 content folder then run `tool/compile_item_png.bat`

FYI: https://www.reddit.com/r/DotA2/comments/8yymx9/item_icons_mods_dont_work_since_one_of_latest/

## NPM Command

```bash
# check code style
npm run lint
```

## Use typescript to develop

### Typescript to lua

```
npm run dev:vscripts
```

- sample modifiers and abilities:
  https://github.com/ModDota/TypeScriptAddonTemplate/tree/master/src/vscripts

### React to paranoma (not setted)

```
npm run dev:panorama
```

## Supported by ModDota template

Panorama UI with webpack, TypeScript and React.

- [TypeScript for VScripts](https://typescripttolua.github.io/) Check out [Typescript Introduction](https://moddota.com/scripting/Typescript/typescript-introduction/) for more information.
- [TypeScript for Panorama](https://moddota.com/panorama/introduction-to-panorama-ui-with-typescript)
- [React in Panorama tutorial](https://moddota.com/panorama/react)

### Contents:

- **[src/common]:** TypeScript .d.ts type declaration files with types that can be shared between Panorama and VScripts
- **[src/vscripts]:** TypeScript code for Dota addon (Lua) vscripts. Compiles lua to game/scripts/vscripts.
- **[src/panorama]:** TypeScript code for panorama UI. Compiles js to content/panorama/scripts/custom_game

--

- **[game/*]:** Dota game directory containing files such as npc kv files and compiled lua scripts.
- **[content/*]:** Dota content directory containing panorama sources other than scripts (xml, css, compiled js)
