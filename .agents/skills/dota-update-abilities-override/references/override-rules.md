# Ability and item delta overrides

Apply removal rules before design recalculation, then update baseline comments.

## Remove inherited and obsolete data

Omit values identical to vanilla, including identical sibling subkeys,
except explicit ordering constraints for awakening bonus precedence.
Remove a subblock when no changed keys remain.
Repeating vanilla's final constant to fill extra levels is still inherited;
a new arithmetic-progression value is an actual delta and must be written.

Remove `CalculateSpellDamageTooltip`, obsolete `special_bonus_facet_*`,
and formerly official keys no longer present.
Do not invent a `value` to fill an obsolete facet-only block.
For structural migrations, move a documented design rule to the new
scepter/shard key and remove obsolete auxiliaries such as `RequiresScepter`.
Ask only if that design intent is unresolved.

Retain intentional custom keys marked `原版不存在，手动修改`.
Unmarked custom LinkedAbility/AbilityDraftPreAbility/talent references require
confirmation; genuinely removed vanilla keys do not.
Verify talent references against the merged hero Ability10–17 slots.
Generic talents with numbers in their names use the engine implementation,
not a new AbilityValues block.

## Effective layout and intent

A nested `AbilityValues` value takes precedence over an invalid top-level
override for the same key. Move the delta to the effective nested position.
For MaxLevel expansion, scan the complete reference block: top-level arrays,
nested values, and flat AbilityValues arrays, including keys absent in overrides.
Keep constants as one token rather than repeated equal tokens.

Recalculate documented `xN`, `+N`, or `差值N` rules from current vanilla.
`延伸` means level extension only. Unannotated legacy values default to current
vanilla plus extension, rather than an undocumented retained buff.
If the comment base already matches current vanilla, retain the documented
design value unless another validity rule applies.

When historical data cannot distinguish competing intentional designs, ask
per key with its localized ability/attribute name, current official value,
existing value, old comment, and concrete multiplier/delta/extension/retain
choices. Resolve a missing multiplier before applying it.

## Level calculations

- Ordinary expansion follows adjacent arithmetic differences to effective MaxLevel.
- Custom marked keys keep their design values and expand when required.
- Basic cooldown floor is 10s; ultimate floor is 60s.
- An ultimate whose vanilla minimum exceeds 60s extends the original difference
  without locking the endpoint.
- Otherwise use the established last-level floor `max(vanilla_min, floor)`,
  preserving the first value and an integer arithmetic step where possible.
  Adjust the first value slightly when necessary for an integer step.
  Prefer multiples of 5/10 when compatible.
- Preserve the established redistribution rule when fitting additional cooldown
  levels to the reference endpoint, e.g. `12 10 8 6 -> 10 9 8 7 6`.
- Percentage fields must not exceed 100. If extension would overflow and the
  vanilla maximum exceeds 50, redistribute to end at that maximum:
  `step = (max - first) / (MaxLevel - 1)`, with suitable rounding.
  Example: `40 60 80 100 -> 40 55 70 85 100`.

## Comments and verification

Changed-value comments begin with current vanilla numbers, followed by the
design rule. Preserve useful existing design reasons.
Pure extension uses `延伸`; multipliers need their numeric baseline,
not only `// x2`.
Follow the file's existing comment convention; do not add facet/lifestone labels.
Annotate newly accepted custom keys with their reason.

Verify no inherited duplicates, obsolete keys, or omitted variable-level values
remain; numbers and comments must reproduce the same design calculation.
