export function calculateDeathPactBonus(
  target: Pick<CDOTA_BaseNPC, 'GetMaxHealth'>,
  healthPercent: number,
  damagePercent: number,
  talentHealth: number,
): { health: number; damage: number } {
  const maxHealth = target.GetMaxHealth();
  return {
    health: maxHealth * healthPercent * 0.01 + talentHealth,
    damage: maxHealth * damagePercent * 0.01,
  };
}

export function canConsumeDeathPactCreep(
  target: Pick<CDOTA_BaseNPC, 'IsAncient' | 'IsNeutralUnitType' | 'GetLevel'>,
  levelLimit: number,
  canTargetAncient: boolean,
): boolean {
  if (target.IsAncient()) {
    return canTargetAncient && target.IsNeutralUnitType();
  }
  return target.GetLevel() <= levelLimit;
}
