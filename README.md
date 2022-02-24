# Windy10v10AI
Dota2 custom game

## Steam workshop
https://steamcommunity.com/sharedfiles/filedetails/?id=2307479570

### compile item png to vtex_c
https://www.reddit.com/r/DotA2/comments/8yymx9/item_icons_mods_dont_work_since_one_of_latest/

create item XML file in dota 2 beta\content\dota_addons\Windy10v10AI\panorama\images\items
run /tool/compile_item_png.bat

## ModDota template

Panorama UI with webpack, TypeScript and React.

- [TypeScript for VScripts](https://typescripttolua.github.io/) Check out [Typescript Introduction](https://moddota.com/scripting/Typescript/typescript-introduction/) for more information.
- [TypeScript for Panorama](https://moddota.com/panorama/introduction-to-panorama-ui-with-typescript)
- [React in Panorama tutorial](https://moddota.com/panorama/react)

### Getting Started
Open terminal in that directory and run `npm install` to install dependencies.

### Contents:

* **[src/common]:** TypeScript .d.ts type declaration files with types that can be shared between Panorama and VScripts
* **[src/vscripts]:** TypeScript code for Dota addon (Lua) vscripts. Compiles lua to game/scripts/vscripts.
* **[src/panorama]:** TypeScript code for panorama UI. Compiles js to content/panorama/scripts/custom_game

--

* **[game/*]:** Dota game directory containing files such as npc kv files and compiled lua scripts.
* **[content/*]:** Dota content directory containing panorama sources other than scripts (xml, css, compiled js)
