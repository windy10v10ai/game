export interface ElderTitanFieldCounts {
  creeps: number;
  heroLike: number;
  realHeroes: number;
}

export interface ElderTitanFieldValues {
  damagePerCreep: number;
  damagePerHero: number;
  movePctPerCreep: number;
  movePctPerHero: number;
  movePctCap: number;
  attackSpeedPerRealHero: number;
  attackSpeedCap: number;
}

export interface ElderTitanFieldBonuses {
  attackDamage: number;
  moveSpeedPct: number;
  attackSpeed: number;
}

export interface SpiritWrapperState {
  waitingForReturn: boolean;
  returnHidden: boolean;
}

export interface DefenseReductionResult {
  baseAfter: number;
  bonusAfter: number;
}

export interface RealHeroTargetState {
  isRealHero: boolean;
  isIllusion: boolean;
  isClone: boolean;
  isTempestDouble: boolean;
  isCreepHero: boolean;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function cleanFloatingPoint(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export class FieldTouchTracker {
  private readonly touched = new Set<number>();

  touch(entityIndex: number): boolean {
    if (this.touched.has(entityIndex)) return false;
    this.touched.add(entityIndex);
    return true;
  }

  reset(): void {
    this.touched.clear();
  }
}

export type ElderTitanAwakenCastMode = 'point' | 'no-target';

export function resolveAwakenCastMode(fieldMode: boolean): ElderTitanAwakenCastMode {
  return fieldMode ? 'no-target' : 'point';
}

export interface NaturalOrderOverlapState {
  applyBaseArmorReduction: boolean;
  applyBaseMagicResistanceReduction: boolean;
}

export function resolveNaturalOrderOverlap(
  hasNativeArmorReduction: boolean,
  hasNativeMagicResistanceReduction: boolean,
): NaturalOrderOverlapState {
  return {
    applyBaseArmorReduction: !hasNativeArmorReduction,
    applyBaseMagicResistanceReduction: !hasNativeMagicResistanceReduction,
  };
}
export function resolveFieldMode(
  isServerRuntime: boolean,
  serverAutoCastState: boolean | undefined,
  replicatedControllerStack: number,
): boolean {
  return isServerRuntime ? serverAutoCastState === true : replicatedControllerStack > 0;
}
export function calculateRadiusWithCastRangeBonus(
  baseRadius: number,
  castRangeBonus: number,
): number {
  return Math.max(0, baseRadius) + Math.max(0, castRangeBonus);
}

export function shouldOverrideNaturalOrderRadius(
  fieldMode: boolean,
  abilityName: string,
  specialValueName: string,
): boolean {
  return fieldMode && abilityName === 'elder_titan_natural_order' && specialValueName === 'radius';
}

export function shouldRestoreAwakenWrapper(state: SpiritWrapperState): boolean {
  return state.waitingForReturn && state.returnHidden;
}

export function isEligibleRealHeroTarget(state: RealHeroTargetState): boolean {
  return (
    state.isRealHero &&
    !state.isIllusion &&
    !state.isClone &&
    !state.isTempestDouble &&
    !state.isCreepHero
  );
}

export function calculateFieldBonuses(
  counts: ElderTitanFieldCounts,
  values: ElderTitanFieldValues,
): ElderTitanFieldBonuses {
  const creeps = Math.max(0, counts.creeps);
  const heroLike = Math.max(0, counts.heroLike);
  const realHeroes = Math.max(0, counts.realHeroes);

  return {
    attackDamage: creeps * values.damagePerCreep + heroLike * values.damagePerHero,
    moveSpeedPct: Math.min(
      values.movePctCap,
      creeps * values.movePctPerCreep + heroLike * values.movePctPerHero,
    ),
    attackSpeed: Math.min(values.attackSpeedCap, realHeroes * values.attackSpeedPerRealHero),
  };
}

export function calculateDefenseReduction(
  baseValue: number,
  bonusValue: number,
  reductionPct: number,
  reducePositiveBonus: boolean,
): DefenseReductionResult {
  const remaining = 1 - clamp(reductionPct, 0, 100) / 100;
  const baseAfter = baseValue > 0 ? baseValue * remaining : baseValue;
  const bonusAfter = reducePositiveBonus && bonusValue > 0 ? bonusValue * remaining : bonusValue;

  return {
    baseAfter: cleanFloatingPoint(baseAfter),
    bonusAfter: cleanFloatingPoint(bonusAfter),
  };
}

export function calculateBonusArmorReductionDelta(
  baseArmor: number,
  currentTotalArmor: number,
  reductionPct: number,
  reducePositiveBonus: boolean,
  nativeBaseAlreadyReduced: boolean,
): number {
  if (!reducePositiveBonus) return 0;

  const remaining = 1 - clamp(reductionPct, 0, 100) / 100;
  const currentBaseArmor =
    nativeBaseAlreadyReduced && baseArmor > 0 ? baseArmor * remaining : baseArmor;
  const bonusArmor = currentTotalArmor - currentBaseArmor;
  if (bonusArmor <= 0) return 0;

  return cleanFloatingPoint(bonusArmor * remaining - bonusArmor);
}

/**
 * Calculates the target magic resistance in percentage points.
 * Idle fields preserve bonus sources and reduce only native base resistance.
 * Empowered fields subtract Natural Order's value directly from the raw total,
 * rebuilding that raw total first when native Natural Order already reduced the base.
 */
export function calculateMagicResistanceTarget(
  totalResistancePct: number,
  baseResistancePct: number,
  reductionPct: number,
  reducePositiveBonus: boolean,
  nativeBaseAlreadyReduced = false,
): number {
  const base = clamp(baseResistancePct / 100, -10, 0.999999);
  const reductionPctClamped = clamp(reductionPct, 0, 100);
  const reduction = reductionPctClamped / 100;
  const remaining = 1 - reduction;
  const currentBase = nativeBaseAlreadyReduced && base > 0 ? base * remaining : base;

  if (reducePositiveBonus) {
    if (!nativeBaseAlreadyReduced) {
      return cleanFloatingPoint(totalResistancePct - reductionPctClamped);
    }

    const observedTotal = totalResistancePct / 100;
    const bonusSource = 1 - (1 - observedTotal) / (1 - currentBase);
    const rawTotal = 1 - (1 - base) * (1 - bonusSource);
    return cleanFloatingPoint(rawTotal * 100 - reductionPctClamped);
  }

  if (nativeBaseAlreadyReduced) return cleanFloatingPoint(totalResistancePct);

  const total = totalResistancePct / 100;
  const bonusSource = 1 - (1 - total) / (1 - currentBase);
  const baseAfter = base > 0 ? base * remaining : base;
  const target = 1 - (1 - baseAfter) * (1 - bonusSource);

  return cleanFloatingPoint(target * 100);
}
