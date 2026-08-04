export function getWispTetherMoveSpeedFloor(
  untetheredWispSpeed: number,
  tetherTargetSpeed: number,
): number {
  return Math.max(untetheredWispSpeed, tetherTargetSpeed);
}

export function getWispTetherMoveSpeedOverride(isWisp: boolean, synchronizedSpeed: number): number {
  return isWisp ? synchronizedSpeed : 0;
}

export function getWispTetherTransferredDamage(
  receivedDamage: number,
  damageSharePct: number,
  isReflectedDamage = false,
): number {
  if (receivedDamage <= 0 || damageSharePct <= 0 || damageSharePct >= 100 || isReflectedDamage) {
    return 0;
  }
  return (receivedDamage * damageSharePct) / (100 - damageSharePct);
}

export function getWispTetherShareableAttribute(
  totalAttribute: number,
  receivedTetherAttribute: number,
): number {
  if (totalAttribute <= 0) return 0;
  return Math.max(totalAttribute - Math.max(receivedTetherAttribute, 0), 0);
}

export function getWispTetherSharedAttribute(
  wispAttribute: number,
  attributeSharePct: number,
): number {
  if (wispAttribute <= 0 || attributeSharePct <= 0) return 0;
  return (wispAttribute * attributeSharePct) / 100;
}

export function canClaimWispTetherTargetBenefits(
  existingProviderEntityIndices: readonly number[],
  currentProviderEntityIndex: number,
): boolean {
  return (
    existingProviderEntityIndices.length === 0 ||
    (existingProviderEntityIndices.length === 1 &&
      existingProviderEntityIndices[0] === currentProviderEntityIndex)
  );
}
