export function calculateBonusSkillPointCount(activePropertyLevel: number): number {
  return Math.max(0, Math.floor(activePropertyLevel / 2));
}
