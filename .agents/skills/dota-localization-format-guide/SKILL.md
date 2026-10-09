---
name: dota-localization-format-guide
description: "Maintain consistent formatting and synchronized keys in addon_schinese, addon_english, and addon_russian. Use when adding or modifying localization keys or repairing indentation, markup, or placeholders."
---

# Addon localization

Owns `game/resource/addon_schinese.txt`, `addon_english.txt`, and
`addon_russian.txt`. Read [format and tooltip rules](references/format.md)
when changing localized keys.

Add/delete/update corresponding entries in all three files, preserving order,
grouping, placeholders, and markup.
For legacy Russian gaps, complete the changed ability/item/module and related
series rather than filling the entire file or removing existing translations.

Use project-localized names first, then current vanilla localization.
Keep numerical data in KV/placeholders rather than duplicating it in prose.
Verify changed keys occur once in each language and run
`npm run lint:localization`. UI changes also need a layout check for longer
English/Russian text.
