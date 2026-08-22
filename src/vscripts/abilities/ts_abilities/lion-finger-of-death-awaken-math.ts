export function calculateMissingHealthBonusDamage(
  preHitHealth: number,
  maxHealth: number,
  missingHealthDamagePct: number,
): number {
  const missingHealth = Math.max(0, maxHealth - preHitHealth);
  return (missingHealth * missingHealthDamagePct) / 100;
}

export function calculateFingerMeleeBonusDamage(
  fingerDamage: number,
  meleeDamagePct: number,
): number {
  return (Math.max(0, fingerDamage) * Math.max(0, meleeDamagePct)) / 100;
}

export function calculateCurrentFingerDamage(
  baseDamage: number,
  growthStacks: number,
  damagePerGrowth: number,
): number {
  return Math.max(0, baseDamage) + Math.max(0, growthStacks) * Math.max(0, damagePerGrowth);
}

export interface ObservedGrowthDelta {
  nextStackCount: number;
  delta: number;
}

export function initializeObservedGrowthStacks(currentStackCount: number | undefined): number {
  return currentStackCount ?? 0;
}

export function calculateObservedGrowthDelta(
  previousStackCount: number | undefined,
  currentStackCount: number,
): ObservedGrowthDelta {
  return {
    nextStackCount: currentStackCount,
    delta:
      previousStackCount === undefined || currentStackCount <= previousStackCount
        ? 0
        : currentStackCount - previousStackCount,
  };
}

export function reduceRemainingCooldown(
  currentRemainingCooldown: number,
  growthDelta: number,
  cooldownReductionPerGrowth: number,
): number {
  return Math.max(0, currentRemainingCooldown - growthDelta * cooldownReductionPerGrowth);
}

export interface PendingGrowthCooldownSettlement {
  pendingGrowthDelta: number;
  nextRemainingCooldown: number | undefined;
}

export function settlePendingGrowthCooldown(
  pendingGrowthDelta: number,
  currentRemainingCooldown: number | undefined,
  cooldownReductionPerGrowth: number,
): PendingGrowthCooldownSettlement {
  if (currentRemainingCooldown === undefined) {
    return { pendingGrowthDelta, nextRemainingCooldown: undefined };
  }

  return {
    pendingGrowthDelta: 0,
    nextRemainingCooldown: reduceRemainingCooldown(
      currentRemainingCooldown,
      pendingGrowthDelta,
      cooldownReductionPerGrowth,
    ),
  };
}
