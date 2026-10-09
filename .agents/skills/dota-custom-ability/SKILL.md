---
name: dota-custom-ability
description: "Implement a new TypeScript ability from scratch. Use for original custom abilities; use dota-clone-ability for vanilla inheritance and dota-awaken-ability for awakening slot replacements."
---

# Original abilities

Owns new implementations, not vanilla delta clones or awakening slot replacement.
Use $dota-clone-ability or $dota-awaken-ability for those cases.

Consult [native modifiers](../../references/vanilla-modifiers.md) before
implementing an existing engine effect. Reuse only when semantics match;
the lookup is not exhaustive.

New implementations use TypeScript under `src/vscripts/abilities/`,
`BaseAbility` / `BaseModifier` from `utils/dota_ts_adapter`, and registration
decorators. KV uses `BaseClass "ability_lua"` and a `ScriptFile` pointing to
the compiled module path. Preserve existing Lua/DataDriven implementations
when maintaining them; do not migrate solely for consistency.

## Engine constraints

- Read adjustable values from `AbilityValues`. Passive abilities return
  an intrinsic modifier through `GetIntrinsicModifierName()`.
- Prefer native modifiers and KV `Properties` for broadly applied static
  attributes; repeated Lua/TS property callbacks have per-unit cost.
  If script callbacks are necessary, cache values in creation/refresh hooks.
- For tracking/linear projectiles, pass the ability to the engine and settle
  hit effects in `OnProjectileHit` / `OnProjectileHit_ExtraData`.
  Estimated travel-time timers do not respect movement and dodging.
- `bIsAttack` does not automatically settle custom projectile damage;
  explicitly apply the intended damage/attack in the hit callback.
- Read [awakening techniques](../dota-awaken-ability/references/advanced-techniques.md)
  only for autocast, native ability linkage, immunity, or conditional bonuses.

Place KV in the appropriate existing ability file and verify its root inclusion.
Use $dota-add-image and $dota-localization-format-guide for player-visible assets.
When part of the request, register lottery membership and bot casting.
Build vscripts; test owned logic and verify engine-dependent behavior in Dota Tools.
