# Windy10v10AI
Dota2 custom game

## Steam workshop
https://steamcommunity.com/sharedfiles/filedetails/?id=2307479570

## Get Start
1. Install Dota2 and [Dota 2 Workshop Tools](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Installing_and_Launching_Tools).
2. Install node.js.
3. Run `npm install` in root directory. Content and game folder will be linked to dota2 dota_addons directory.
### compile item png to vtex_c
https://www.reddit.com/r/DotA2/comments/8yymx9/item_icons_mods_dont_work_since_one_of_latest/

create item XML file in dota 2 beta\content\dota_addons\Windy10v10AI\panorama\images\items
run /tool/compile_item_png.bat

## About ModDota template

Panorama UI with webpack, TypeScript and React.

- [TypeScript for VScripts](https://typescripttolua.github.io/) Check out [Typescript Introduction](https://moddota.com/scripting/Typescript/typescript-introduction/) for more information.
- [TypeScript for Panorama](https://moddota.com/panorama/introduction-to-panorama-ui-with-typescript)
- [React in Panorama tutorial](https://moddota.com/panorama/react)

### Contents:

* **[src/common]:** TypeScript .d.ts type declaration files with types that can be shared between Panorama and VScripts
* **[src/vscripts]:** TypeScript code for Dota addon (Lua) vscripts. Compiles lua to game/scripts/vscripts.
* **[src/panorama]:** TypeScript code for panorama UI. Compiles js to content/panorama/scripts/custom_game

--

* **[game/*]:** Dota game directory containing files such as npc kv files and compiled lua scripts.
* **[content/*]:** Dota content directory containing panorama sources other than scripts (xml, css, compiled js)
