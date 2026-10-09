# Setup

Use Windows 10/11, Steam, Dota 2, and [Dota 2 Workshop Tools](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Installing_and_Launching_Tools).
Playing the [published addon](https://steamcommunity.com/sharedfiles/filedetails/?id=2307479570) does not require this development setup.

Install Node.js using the version in [`.nvmrc`](../../../.nvmrc).
With [nvm-windows](https://github.com/coreybutler/nvm-windows), run in PowerShell from the repository root:

```powershell
nvm install $(Get-Content .nvmrc)
nvm use $(Get-Content .nvmrc)
node --version
```

Clone your fork onto the same disk partition as Dota 2.

Run from the repository root:

```powershell
npm install
```

The installer applies dependency patches, copies `game/` and `content/` into Dota's corresponding
`dota_addons/windy10v10ai/` directories, and replaces the checkout directories with junctions.
If an addon directory already exists, it asks whether to delete it: back up your local addon changes before agreeing.
If Dota is not found, dependencies can install but addon linking is skipped.

Check the installation output for both directory links, then follow the [development workflow](workflow.md).
