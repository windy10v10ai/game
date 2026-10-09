---
name: dota-add-image
description: "Add custom ability icons, item icons, or Panorama UI images, including PNG placement, content copies, and XML registration. Use when adding images, diagnosing purple placeholder icons, or creating an ability or item that needs a custom icon."
---

# Image assets

Existing vanilla ability/item textures and persona texture paths need only
`AbilityTextureName`; do not copy PNGs or register XML for them.

| Custom asset | Placement and registration                                                                                                                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ability icon | `game/resource/flash3/images/spellicons/<name>.png`; KV references `<name>`. No content copy or XML.                                                                                                             |
| Item icon    | Same PNG in `game/resource/flash3/images/items/` and `content/panorama/images/items/`, plus a matching `Image` in `content/panorama/layout/custom_game/images_items.xml`. Strip `item_` from the image filename. |
| Panorama UI  | `content/panorama/images/custom_game/<module>/`, registered in the hidden panel of `content/panorama/layout/custom_game/images.xml`.                                                                             |

UI filenames use lowercase underscores and a type prefix such as `icon_`,
`bg_`, `frame_`, or `decor_`. Reference them as
`file://{images}/custom_game/<module>/<file>.png`.
Use the shared registration file; do not create one XML compilation shell per image.

Run `npm run lint:images` after changing item icons.
For purple placeholders, check placement, content copy, XML registration,
the KV filename, and Workshop Tools compilation.
If all ability/modifier icons disappear together, investigate TS module loading
before changing assets; see `src/vscripts/CLAUDE.md`.

Compiled `*.vtex_c` assets are ignored by Git.
After cloning onto another machine, compile all images in Workshop Tools before
publishing; a successful TypeScript build alone does not create them.
