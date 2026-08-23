export function addTagTeamStoredDamage(
  currentBonus: number,
  damageTaken: number,
  conversionPct: number,
): number {
  return Math.max(0, currentBonus) + (Math.max(0, damageTaken) * Math.max(0, conversionPct)) / 100;
}

export function calculateTagTeamExtraDamage(
  nativeBonusDamage: number,
  storedDamage: number,
  isAttackDamage: boolean,
): number {
  return Math.max(0, storedDamage) + (isAttackDamage ? 0 : Math.max(0, nativeBonusDamage));
}
