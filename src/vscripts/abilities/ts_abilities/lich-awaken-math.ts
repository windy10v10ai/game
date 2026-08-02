export function calculateLichAwakenDamage(intelligence: number, multiplier: number): number {
  return Math.max(intelligence, 0) * Math.max(multiplier, 0);
}

export function calculateLichAwakenDetonationDamage(
  intelligence: number,
  multiplier: number,
  consumedStacks: number,
): number {
  return calculateLichAwakenDamage(intelligence, multiplier) * Math.max(consumedStacks, 0);
}

export function isRoshanUnitName(unitName: string): boolean {
  return unitName === 'npc_dota_roshan';
}

export function isLichAwakenMarkTarget(
  isRoshan: boolean,
  isRealHero: boolean,
  isIllusion: boolean,
): boolean {
  return isRoshan || (isRealHero && !isIllusion);
}
