---
name: update-heroes-custom
description: "Write and validate bot hero ability builds and talent selections in npc_heroes_custom.txt. Use before editing any Bot.Build, for build-order improvements or skill-point constraints, and after update-abilities-override processes a hero."
---

# Update Heroes Custom

verifies the **`Bot.Build`** of `npc_heroes_custom.txt` to ensure that the talent name exists and the tier is correct, the ability name is in a valid slot, the points added do not exceed `MaxLevel`, and the level key structure is compliant.

## When to use

- New writing or adjusting the order of adding points: first sort according to the "Build Rules" below, and then go through the "Detection Process" after making the changes. When adjusting the existing points, exchange between the level keys allowed by the rules. Do not fill in points to `17/19/21/22`, and do not clear `23/26/31`.
- Verification Bot points will be added after the version is updated or the Ability slot/override is changed.
- User requested to check Bot points/talent/ability level.

## data source

| Data                | Priority: High → Low                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| Ability slot        | `npc_heroes_custom.txt` Key with the same name → `docs/reference/{version}/npc_heroes.txt`             |
| Ability10–17 Talent | Same as above                                                                                          |
| MaxLevel            | `npc_abilities_override.txt` → `heroes/npc_dota_hero_<hero>.txt` → Inference (ultimate 3, remaining 4) |

---

## Valid ability list

After merging official and custom, **all non-`generic_hidden` Ability slots** (including Ability7+ such as `ogre_magi_multicast`).

- `npc_abilities_override.txt` There is a block **does not mean** available - it must be confirmed that the hero's Ability slot contains this ability. The innate ability of
- `Innate "1"` is not upgradeable and should not appear in Build.

---

## Effective talent set

| Level Tier | Ability Slot          | Build First Choice | Build Second Selection |
| ---------- | --------------------- | ------------------ | ---------------------- |
| Level 10   | Ability10 / Ability11 | `"10"`             | `"27"`                 |
| Level 15   | Ability12 / Ability13 | `"15"`             | `"28"`                 |
| Level 20   | Ability14 / Ability15 | `"20"`             | `"29"`                 |
| Level 25   | Ability16 / Ability17 | `"25"`             | `"30"`                 |

Talent name must match the merged Ability10–17 **word for word**. The obsolete name of the old version is invalid.

---

## Build Rules

### Talent

- **`10` / `15` / `20` / `25`**: Choose one of the two talents in the **corresponding file**.
- **`27` / `28` / `29` / `30`**: Fill in the other unselected ** in **10 / 15 / 20 / 25 respectively.

> **The most common errors**: ① The talent name has been revised and invalid (does not match word for word); ② Fill in the A talent to the B key; ③ 28/29 interchange (15-other and 20-other are reversed).

### ultimate

- adding point interval **≥ 6**, `30` does not increase.
- Typical MaxLevel 4: **6/12/18/24**. `24` is placed on the fourth level, and `31` is left for the fifth basic ability point.

### basic ability

For each basic ability S, the cumulative number of occurrences up to hero level L **C(L) ≤ ⌊(L+1)/2⌋** (`""` and talents are not counted). Adjacent levels are allowed to connect points. Total times **≤ MaxLevel**.

### Leave blank

- **`17` / `19` / `21` / `22`**: `""` is required.
- **Other keys** (including `23` / `24` / `26`): `""` is not allowed, valid ability or talent must be filled in. `23` / `24` / `26` must be non-talented.
- **`32`+**: Write if there is a dot, otherwise omit.

### example

Three MaxLevel 5 basic abilities + MaxLevel 4 ultimates:

```kv
"Build"
{
	"1"		"q"
	"2"		"w"
	"3"		"q"
	"4"		"w"
	"5"		"w"
	"6"		"ult"
	"7"		"q"
	"8"		"e"
	"9"		"q"
	"10"		"talent_10_pick"
	"11"		"w"
	"12"		"ult"
	"13"		"e"
	"14"		"q"
	"15"		"talent_15_pick"
	"16"		"w"
	"17"		""
	"18"		"ult"
	"19"		""
	"20"		"talent_20_pick"
	"21"		""
	"22"		""
	"23"		"e"
	"24"		"ult"
	"25"		"talent_25_pick"
	"26"		"e"
	"27"		"talent_10_other"
	"28"		"talent_15_other"
	"29"		"talent_20_other"
	"30"		"talent_25_other"
	"31"		"e"
}
```

q 5 points `1→3→7→9→14`, w 5 points `2→4→5→11→16` (adjacent connected points are legal), e 5 points `8→13→23→26→31`, ult 4 points `6→12→18→24` (interval 6).

---

## detection process

1. **Merge slots** → Valid ability list + valid talents (eight slots).
2. **Check MaxLevel**.
3. **Talent Exists**: The value of `10/15/20/25/27/28/29/30` exists literally in post-merger Ability10–17.
4. **Talent tier**: The first choice is in the corresponding tier; the supplementary selection is another unselected in the same tier; 27=10-other, 28=15-other, 29=20-other, 30=25-other.
5. **ability exists**: non-talent, non-empty item ∈ valid ability list.
6. **Numbers**: Total times ≤ MaxLevel; C(L) ≤ ⌊(L+1)/2⌋.
7. **leave blank**: 17/19/21/22 is blank, the rest are not blank.
8. **Ultimate**: Interval ≥ 6, 30 does not upgrade, level 4 is typical 6/12/18/24.

---

## Division of labor

| Documents                    | Responsibilities                       |
| ---------------------------- | -------------------------------------- |
| `npc_abilities_override.txt` | MaxLevel, value                        |
| `npc_heroes_custom.txt`      | Slot coverage, Bot.Build, Ability10–17 |

## Report

- Can list: effective talent set, Build talent selection, discovered problems.
- **Only git commit** when the user explicitly requests it.
