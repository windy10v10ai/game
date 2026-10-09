# Development workflow

Complete [setup](setup.md), then run in PowerShell from the repository root:

```powershell
npm run start
```

This launches Dota in Tools mode and starts the Panorama and VScripts watchers.
Verify that compilation finishes without errors and the addon launches.
If Dota is already running, the launcher does not restart it; restart in Tools mode if necessary.

Before submitting a change, run:

```powershell
npm run lint
npm test
npm run build
```

`npm run build` builds both layers. To isolate a build, use `npm run build:panorama` or
`npm run build:vscripts`. `npm run lint:fix` applies ESLint fixes.
Compilation and automated tests do not replace checking gameplay or UI in Tools.

## VConsole

Run these commands in Dota's VConsole, not PowerShell:

```text
dota_launch_custom_game windy10v10ai dota
dota_launch_custom_game windy10v10ai custom
dota_custom_ui_debug_panel 7
script_reload
host_timescale <float>
```

The first two commands launch the addon on the `dota` or `custom` map.
The next commands show the end-game panel and reload Lua. Replace `<float>` with a speed multiplier;
`host_timescale 1` restores normal speed.

## Source layout

- [`src/common/`](../../../src/common/): shared types.
- [`src/vscripts/`](../../../src/vscripts/): TypeScript game logic compiled into `game/scripts/vscripts/`.
- [`src/panorama/`](../../../src/panorama/): TypeScript/React UI; current Webpack output goes into `content/panorama/layout/custom_game/react/`.
- [`src/scripts/`](../../../src/scripts/): development utilities.
- [`game/`](../../../game/) and [`content/`](../../../content/): addon game and content resources.

Edit TypeScript sources rather than generated Lua. See [data flow](../architecture/README.md) and
[contribution guidelines](../../../.github/CONTRIBUTING.md); PRs target `develop`.
