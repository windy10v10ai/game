---
name: localization-format-guide
description: "Maintain consistent formatting and synchronized keys in addon_schinese, addon_english, and addon_russian. Use when adding or modifying localization keys or repairing indentation, markup, or placeholders."
---

# Localization Format Guide

This skill is used to maintain the localized KeyValues ​​file under `game/resource/`, ensuring that the Chinese, English and Russian content and format are completely consistent, the key order is consistent with the comments, and the project's specifications for indentation, comments, HTML tags, color codes and variable placeholders are followed.

## usage time

- Add/modify localization keys for UI, item, ability, and modifier
- synchronizes the content and format of trilingual localization files
- Fixed display problems caused by inconsistent alignment, indentation, labels, and placeholders

## Reference (must be followed)

- `references/localization-format-guide.md`

## execution steps (recommendations)

1. Specify the key list and corresponding text to be added/modified
2. adds and deletes the same key in `addon_schinese.txt`, `addon_english.txt`, and `addon_russian.txt` at the same time. The positions in the three files are consistent with the order. Comments are uniformly in Chinese.
3. When the modified entry is originally missing in Russian, all keys of the entry (including modifier, entries in the same series) must be filled in together; irrelevant entries in the inventory do not need to be filled in, and existing Russian entries must not be deleted unilaterally.
4. alignment check:
   - indentation, tab alignment, and blank line position are consistent
   - HTML tags are in the same position (including `\n` and `<br>`)
   - placeholder (such as `%duration%`, `%dMODIFIER_PROPERTY_XXX%`) is consistent
5. If modifier is involved: Complete the required entries for `Name` and `Description`
6. Chinese punctuation uses full width; numbers/English/HTML/placeholders remain the same
