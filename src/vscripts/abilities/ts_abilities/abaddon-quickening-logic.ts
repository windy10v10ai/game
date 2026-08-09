export interface QuickeningCooldownState {
  entityIndex: number;
  remainingCooldown: number;
}

export interface QuickeningCooldownPlan {
  entityIndex: number;
  nextCooldown: number;
}

export function getQuickeningCooldownReduction(
  isHero: boolean,
  heroReduction: number,
  unitReduction: number,
): number {
  return isHero ? heroReduction : unitReduction;
}

export function isQuickeningDeathInRange(distance: number, radius: number): boolean {
  return distance <= radius;
}

export function calculateQuickeningCooldownPlans(
  cooldowns: QuickeningCooldownState[],
  reduction: number,
): QuickeningCooldownPlan[] {
  const seen = new Set<number>();
  const plans: QuickeningCooldownPlan[] = [];

  for (const cooldown of cooldowns) {
    if (seen.has(cooldown.entityIndex)) continue;
    seen.add(cooldown.entityIndex);
    if (cooldown.remainingCooldown <= 0) continue;

    plans.push({
      entityIndex: cooldown.entityIndex,
      nextCooldown: Math.max(0, cooldown.remainingCooldown - reduction),
    });
  }

  return plans;
}
