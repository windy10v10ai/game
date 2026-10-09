---
name: add-image
description: "Add custom ability icons, item icons, or Panorama UI images, including PNG placement, content copies, and XML registration. Use when adding images, diagnosing purple placeholder icons, or creating an ability or item that needs a custom icon."
---

# Add images

## Step 1: Decide whether a PNG is needed

If `AbilityTextureName` references an existing vanilla Dota 2 texture (an ability or item name), use that name directly. **Don't put any png, don't register xml**, and that's the end.

Only **homemade or extracted** icons from Dota2 resource unpacking continue down.

## Step 2: Select process by type

The storage rules for the three types of pictures are different. **Don't copy each other**.

### A. ability icon (ability `ability_xxx` of `AbilityTextureName`)

Place the icon at `game/resource/flash3/images/spellicons/<name>.png` and reference its filename in KV:

```
"AbilityTextureName"    "axe_auto_culling_blade"
```

The engine automatically searches for `.png` with the same name under `spellicons/`. There is no need to register xml or copy the content.

### B. item icon (`AbilityTextureName` of item `item_xxx`)

The icon name is the item name without `item_` prefix. Three steps are indispensable. **Omitting any step produces a purple placeholder**:

1. `game/resource/flash3/images/items/<name>.png`
2. Copy the same png to `content/panorama/images/items/<name>.png`
3. Add a line to `content/panorama/layout/custom_game/images_items.xml`, `id` is consistent with the filename:

```xml
<Image id="awaken_stone" class="SeqImg" src="file://{images}/items/awaken_stone.png" />
```

The registration table is in a different directory than png because the engine only allows layout to be loaded from `layout/custom_game/`.

### C. Panorama UI pictures

Place UI images in `content/panorama/images/custom_game/<module>/`, grouped by functional module (`lottery/`, `profile/`, `battlepass/`, etc.):

1. file names are lowercase and underscore, prefixed by type (`icon_` `bg_` `frame_` `decor_`)
2. Add a line of `<Image>` statement (id is unique in the file) in the `content/panorama/layout/custom_game/images.xml` hidden Panel to trigger `.vtex_c` compilation
3. **no longer** creates a separate `<name>.xml` compilation shell for each image

Reference the image as `file://{images}/custom_game/<module>/<file>.png` in React or less.

## Step 3: Verification

```bash
npm run lint:images
```

This verifies that item icons are consistent in three places (already merged into `npm run lint`).

## troubleshooting purple blocks

Check in order: whether the png is in the corresponding directory → whether the item icon is missing a content copy or xml registration → whether the file name is completely consistent with the reference in KV → whether it has not been compiled with Dota tools.

If the entire ability and modifier icons **collectively** disappear, first suspect that the TS module has failed to load (see `src/vscripts/CLAUDE.md` "Do not evaluate engine enumeration at the top level of the module"). It is not an icon resource problem.

## Pre-release reminder

Compiled assets at `game/panorama/images/items/*.vtex_c` are ignored by Git and generated locally by Dota Tools. **After cloning onto a new machine, you must first use Dota tools to compile it completely before publishing**, otherwise the workshop package will be missing icons - the same is true for the lottery, profile, member and other directories under `custom_game/`.
