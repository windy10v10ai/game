# Shared bot casting rules

Owners under `src/vscripts/ai/`:
`ability/ability-spec.ts`, `item/item-spec.ts`,
`action/cast-condition.ts`, and `action/target-dispatch.ts`.
Read their types instead of copying a complete field catalog into skills.

- Only supported typed conditions are valid. Extend condition evaluation and
  dispatch before introducing a new field; do not silently invent spec fields.
- `Self` skips target selection/filters. Other target sides describe candidates,
  even when runtime behavior eventually performs a no-target cast.
- Casting range defaults to engine range plus bonus. Explicit range changes
  candidate selection and pursuit, not only the number-counting radius.
- Target counts use effective range and alive candidates, not all
  `unitCondition` filters. A wider "observation" range can make bots chase.
- Numeric ranges are replaced as a unit during DeepMerge; `{lte: 40}` replaces
  the whole default range rather than combining with `gte: 40`.
- `noModifier` / `hasModifier` need real internal names. Check project
  localization first, then current vanilla modifier tooltips.
- `excludeSelf` matters for harmful friendly casts; don't add it to pure buffs
  without a reason.
- `notActionable` avoids redundant control; `disabled` selects existing
  control for abilities that need it. Hard and movement disabling differ.
- Nearby-enemy/ally/creep safety conditions belong directly under `self`,
  not `self.unitCondition`.
- `stance` uses the hero layer's fight/retreat decision. Health alone is not a
  substitute for engagement logic.
- Use `aheadCircle` for fixed forward circular effects, `facing` for caster
  orientation, and `fleeing` for a target's own retreat direction.
- Use `toggleByTarget` for "off when no target"; `toggleOff` alone still
  requires a matching target.
- For mixed UNIT_TARGET/POINT runtime behavior rejected as a unit cast, use
  `castMode: 'targetPosition'`. Repeated `[bot-cast]` entries can mean rejection.
- Shared registry specs are singletons across heroes/ticks. Never mutate
  `condition.target` in range filling; the first value would freeze globally.
- Channel stopping is opt-in via `stopChannel`; otherwise preserve full channels.
- Use `AbilityValues` / `abilityValue` terminology; the legacy API
  `GetSpecialValueFor` does not require naming new fields "specialValue".
- Comments explain intentions, not duplicate thresholds.
  If comments disagree with code, use history/live behavior to establish intent.
