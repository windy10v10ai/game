export interface DoomAwakenedFriendlyTargetInput {
  hasScepter: boolean;
  sameTeam: boolean;
  isRealHero: boolean;
}

interface NativeAbilitySpecialValue {
  value?: unknown;
  special_bonus_scepter?: unknown;
}

interface NativeAbilityKeyValues {
  AbilityValues?: Record<string, unknown>;
}

function readLevelNumber(value: unknown, abilityLevel: number): number {
  if (typeof value === 'number') return Math.max(0, value);
  if (typeof value !== 'string') return 0;

  const values = value
    .trim()
    .split(' ')
    .filter((entry) => entry.length > 0);
  if (values.length === 0) return 0;

  const levelIndex = Math.max(0, Math.min(values.length - 1, abilityLevel - 1));
  const parsed = Number(values[levelIndex]);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

export function getDoomAwakenedNativeScepterRadius(
  abilityKeyValues: unknown,
  abilityLevel: number,
): number {
  const abilityValues = (abilityKeyValues as NativeAbilityKeyValues | undefined)?.AbilityValues;
  const radiusValue = abilityValues?.scepter_aura_radius;

  if (typeof radiusValue === 'number' || typeof radiusValue === 'string') {
    return readLevelNumber(radiusValue, abilityLevel);
  }

  const radius = radiusValue as NativeAbilitySpecialValue | undefined;
  return (
    readLevelNumber(radius?.value, abilityLevel) +
    readLevelNumber(radius?.special_bonus_scepter, abilityLevel)
  );
}

export function getDoomAwakenedEffectiveRadius(nativeRadius: number, aoeBonus: number): number {
  return Math.max(0, nativeRadius) + Math.max(0, aoeBonus);
}

export function isDoomAwakenedFriendlyTarget({
  hasScepter,
  sameTeam,
  isRealHero,
}: DoomAwakenedFriendlyTargetInput): boolean {
  return hasScepter && sameTeam && isRealHero;
}

export interface DoomAwakenedTalentStateInput {
  hasMuteTalent: boolean;
  hasBreakTalent: boolean;
}

export interface DoomAwakenedTalentStates {
  muted: boolean;
  passivesDisabled: boolean;
}

export function getDoomAwakenedTalentStates({
  hasMuteTalent,
  hasBreakTalent,
}: DoomAwakenedTalentStateInput): DoomAwakenedTalentStates {
  return {
    muted: hasMuteTalent,
    passivesDisabled: hasBreakTalent,
  };
}
