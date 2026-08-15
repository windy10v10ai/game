import { ChallengeMetric } from '../../../common/dto/daily-challenge';

export type DailyChallengeDurationMetric = Extract<ChallengeMetric, `${string}_duration_ms`>;

export interface DailyChallengeModifierClassifierConstants {
  rootedState: modifierstate;
  silencedState: modifierstate;
  stunnedState: modifierstate;
  passivesDisabledState: modifierstate;
  tauntedState: modifierstate;
  slowFunctions: modifierfunction[];
  slowModifierNames: string[];
}

// dota-lua-types marks the legacy modifier enums as @compileMembersOnly, so their
// numeric values must be inlined rather than accessed as runtime enum objects.
const createDefaultConstants = (): DailyChallengeModifierClassifierConstants => ({
  rootedState: 0 as modifierstate,
  silencedState: 3 as modifierstate,
  stunnedState: 5 as modifierstate,
  passivesDisabledState: 30 as modifierstate,
  tauntedState: 48 as modifierstate,
  slowFunctions: [
    16, // MOVESPEED_BONUS_CONSTANT
    17, // MOVESPEED_BASE_OVERRIDE
    19, // MOVESPEED_MAX_OVERRIDE
    20, // MOVESPEED_BONUS_PERCENTAGE
    21, // MOVESPEED_BONUS_PERCENTAGE_UNIQUE
    24, // MOVESPEED_BONUS_CONSTANT_UNIQUE
    25, // MOVESPEED_BONUS_CONSTANT_UNIQUE_2
    26, // MOVESPEED_ABSOLUTE
    28, // MOVESPEED_ABSOLUTE_MAX
    283, // MOVESPEED_REDUCTION_PERCENTAGE
  ] as modifierfunction[],
  // Only modifiers already documented as verified slow effects in this project are candidates.
  slowModifierNames: [
    'modifier_item_angels_demise_slow',
    'modifier_item_overwhelming_blink_debuff',
    'modifier_drow_ranger_frost_arrows_slow',
    'modifier_brewmaster_void_brawler_slow',
    'modifier_sniper_shrapnel_slow',
  ],
});

function hasState(states: Record<number, boolean>, state: modifierstate): boolean {
  return states[state as number] === true;
}

export function classifyDailyChallengeModifier(
  modifier: CDOTA_Buff,
  constants: DailyChallengeModifierClassifierConstants = createDefaultConstants(),
): Set<DailyChallengeDurationMetric> {
  const result = new Set<DailyChallengeDurationMetric>();
  const states: Record<number, boolean> = {};
  modifier.CheckStateToTable(states);
  const isDebuff = modifier.IsDebuff();

  if (modifier.IsStunDebuff() || hasState(states, constants.stunnedState)) {
    result.add('stun_duration_ms');
  }
  if (hasState(states, constants.rootedState)) {
    result.add('root_duration_ms');
  }
  if (hasState(states, constants.silencedState)) {
    result.add('silence_duration_ms');
  }
  if (hasState(states, constants.tauntedState)) {
    result.add('taunt_duration_ms');
  }
  if (hasState(states, constants.passivesDisabledState)) {
    result.add('break_duration_ms');
  }
  const hasMovementSpeedFunction = constants.slowFunctions.some((func) =>
    modifier.HasFunction(func),
  );
  const hasExplicitSlowName = constants.slowModifierNames.some(
    (modifierName) => modifierName === modifier.GetName(),
  );
  if (isDebuff && (hasMovementSpeedFunction || hasExplicitSlowName)) {
    result.add('slow_duration_ms');
  }
  if (isDebuff) {
    result.add('debuff_duration_ms');
  }

  return result;
}
