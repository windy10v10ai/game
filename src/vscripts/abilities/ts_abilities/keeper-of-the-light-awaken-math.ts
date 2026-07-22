export const MAX_FOCUS_STACKS = 5;

const ILLUMINATE_ABILITY = 'keeper_of_the_light_illuminate';
const SUPPORTED_ILLUMINATE_SPECIALS = [
  'total_damage',
  'max_channel_time',
  'range',
  'radius',
] as const;

export function clampFocusStacks(stacks: number): number {
  return Math.min(MAX_FOCUS_STACKS, Math.max(0, Math.floor(stacks)));
}

export function calculateFocusDamagePctPerStack(
  baseDamagePctPerStack: number,
  spellAmplification: number,
  spellAmpScalingPerStack: number,
  spellAmpScalingCap: number,
): number {
  const cappedSpellAmpPct = Math.min(
    Math.max(0, spellAmplification * 100),
    Math.max(0, spellAmpScalingCap),
  );
  return baseDamagePctPerStack + (cappedSpellAmpPct * spellAmpScalingPerStack) / 100;
}

export function calculateFocusTotalDamagePct(
  stacks: number,
  baseDamagePctPerStack: number,
  spellAmplification: number,
  spellAmpScalingPerStack: number,
  spellAmpScalingCap: number,
): number {
  return (
    clampFocusStacks(stacks) *
    calculateFocusDamagePctPerStack(
      baseDamagePctPerStack,
      spellAmplification,
      spellAmpScalingPerStack,
      spellAmpScalingCap,
    )
  );
}

export function calculateAwakenedIlluminateDamage(
  baseDamage: number,
  stacks: number,
  baseDamageBonus: number,
  baseDamagePctPerStack: number,
  spellAmplification: number,
  spellAmpScalingPerStack: number,
  spellAmpScalingCap: number,
): number {
  const totalDamagePct = calculateFocusTotalDamagePct(
    stacks,
    baseDamagePctPerStack,
    spellAmplification,
    spellAmpScalingPerStack,
    spellAmpScalingCap,
  );
  return (baseDamage + baseDamageBonus) * (1 + totalDamagePct / 100);
}

export function calculateIlluminateMaxChannelTime(
  baseChannelTime: number,
  stacks: number,
  channelReductionPerStack: number,
): number {
  return Math.max(0, baseChannelTime - clampFocusStacks(stacks) * channelReductionPerStack);
}

export function calculateIlluminateRange(
  baseRange: number,
  stacks: number,
  rangePerStack: number,
): number {
  return baseRange + clampFocusStacks(stacks) * rangePerStack;
}

export function calculateIlluminateRadius(
  baseRadius: number,
  stacks: number,
  radiusPerStack: number,
): number {
  return baseRadius + clampFocusStacks(stacks) * radiusPerStack;
}

export interface SpellAmplificationOverrideState {
  isServer: boolean;
  serverSpellAmplification?: number;
  replicatedSpellAmplification: number;
}

export function resolveSpellAmplificationForOverride(
  state: SpellAmplificationOverrideState,
): number {
  const value = state.isServer
    ? state.serverSpellAmplification
    : state.replicatedSpellAmplification;
  if (value === undefined || value !== value) return 0;
  return Math.max(0, value);
}

export interface FocusStackOverrideState {
  isServer: boolean;
  snapshotActive: boolean;
  replicatedStacks: number;
  snapshotStacks: number;
}

export function resolveFocusStacksForOverride(state: FocusStackOverrideState): number {
  if (state.isServer && state.snapshotActive) return clampFocusStacks(state.snapshotStacks);
  return clampFocusStacks(state.replicatedStacks);
}

export function getFocusDuration(spiritFormLevel: number, durations: readonly number[]): number {
  if (spiritFormLevel <= 0 || durations.length === 0) return 0;
  const index = Math.min(Math.floor(spiritFormLevel), durations.length) - 1;
  return durations[index] ?? 0;
}

export interface FocusHitCandidate {
  isEnemy: boolean;
  isRealHero: boolean;
  isIllusion: boolean;
  isClone: boolean;
  alreadyHit: boolean;
}

export function isEligibleFocusHit(candidate: FocusHitCandidate): boolean {
  return (
    candidate.isEnemy &&
    candidate.isRealHero &&
    !candidate.isIllusion &&
    !candidate.isClone &&
    !candidate.alreadyHit
  );
}
export function isKeeperIlluminateSpecial(abilityName: string, specialName: string): boolean {
  if (abilityName !== ILLUMINATE_ABILITY) return false;
  return (SUPPORTED_ILLUMINATE_SPECIALS as readonly string[]).includes(specialName);
}

export function shouldCastIlluminateEnd(hasEndAbility: boolean, isActivated: boolean): boolean {
  return hasEndAbility && isActivated;
}
