# Vanilla Dota reference files

Ability/item KV, localization, and AI work may require a snapshot under `docs/reference/<version>/`.
This optional directory is ignored by Git and is not included in a clone.

Using [Source 2 Viewer](https://valveresourceformat.github.io/), open
`dota 2 beta/game/dota/pak01_dir.vpk`. Extract `scripts/npc/` and the files
`abilities_english.txt` and `abilities_schinese.txt` into the versioned reference directory.

The NPC files should be directly under `docs/reference/<version>/`, not inside an extra
`scripts/npc/` nesting. Verify that the localization files and the `heroes/` directory are present.
Use a version label matching the extracted game data. These files are reference material, not editable addon sources.
