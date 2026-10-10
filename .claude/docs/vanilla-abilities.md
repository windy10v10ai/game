# Looking Up Vanilla Abilities

When the user gives an ability system name (e.g. `dragon_knight_dragon_blood`), use it directly. `<version>` is the latest version directory under `docs/reference/` (including the letter suffix, e.g. `7.41f`); the file layout is described in `game/scripts/npc/CLAUDE.md`, section "原版 KV 参考".

When given a Chinese name (e.g. 「龙血」) or hero name–ability name (e.g. 「幻影刺客-幻影之矛」), search the Chinese name in `abilities_schinese.txt` and extract the system name from the matching line's key (`DOTA_Tooltip_ability_{system_name}`). If there are multiple candidates, ask the user to confirm with `AskUserQuestion`.

When given a hero name, locate the hero ID from file names under `heroes/` or from `abilities_schinese.txt`, then read the ability slots from `heroes/npc_dota_hero_<hero>.txt`.

When writing custom ability/item tooltips, refer to the official text to keep terminology consistent:

```bash
grep "DOTA_Tooltip_ability_dragon_knight_dragon_blood" docs/reference/<version>/abilities_schinese.txt
grep "DOTA_Tooltip_ability_dragon_knight_dragon_blood" docs/reference/<version>/abilities_english.txt
```
