# Lottery statistical rules

Analyze active and passive pools independently.
For each tier calculate ability count, event count, event-weighted win rate
`sum(winrate * events) / sum(events)`, and weighted standard deviation.

## Adequacy

Stop without an adjustment plan if:

- Pool events are below 5000.
- Any tier's median ability event count is below 100.
- In a tier with at least ten abilities, fewer than 30% have at least 200 events.

Per-ability samples below 200 support observation, not ordinary tier migration.
Below 50 while peers commonly exceed 200 is a low-pick-rate question, not an
automatic demotion/removal.

## Quantiles and targets

Target midpoint shares: T5 4.5%, T4 14%, T3 22%, T2 34%, T1 25.5%.
These account for "draw six, choose one" rather than only draw weights.
Round target counts from current total pool size.

Rank abilities with at least 200 events by descending win rate and assign
`ideal_tier` by those whole-pool quantile shares.
`shift = ideal_tier - current_tier`, with larger tier numbers stronger.
Do not derive direction from nearest current-tier mean or a vacancy quota.

Prefer one-tier moves. Two-tier moves require at least 300 events and a win rate
more than 15 percentage points from the current-tier mean in that direction.
Retain near-boundary one-tier candidates within 1pp to limit oscillation.

Limit moves touching each tier to `max(3, current_count * 0.15)`.
Prioritize larger absolute shifts, then larger deviation from the original
median. Defer over-limit candidates; do not force full convergence in one release.

## Exceptions

- T1, at least 200 events, win rate below its weighted mean by over 8pp:
  ask about buffing, removal, or observation. Ordinary low T1 entries remain.
- Very low pick rate: ask about demotion, buffing, removal, or observation.
- At least 300 events, ideal shift +1, among the tier's top three by events,
  current tier T4+: flag possible nerf rather than assuming another tier solves it.
- At least 200 events, top two by events, shift zero: flag overexposure.
- Small samples: observe; identify extreme signals without executing a move.

Numerical proposals do not authorize KV edits.

## Final-state simulation

For every tier:
`final = initial + incoming - outgoing - removals`.

Require `abs(final - target) <= abs(initial - target)`.
Rollback accidental zero-shift moves or reduce migrations that worsen the gap.
Show initial, final, and target counts, deferred candidates, and sample evidence
before requesting approval. Check the applied membership against this simulation.
