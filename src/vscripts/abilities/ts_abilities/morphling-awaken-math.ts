/** Agility lent by Replicate: a percentage of the target's three attributes, minus Agility it only holds on loan. */
export function calculateBorrowedAgility(
  strength: number,
  agility: number,
  intellect: number,
  loanedAgility: number,
  pct: number,
): number {
  return (Math.max(0, strength + agility - loanedAgility + intellect) * pct) / 100;
}
