function isFiniteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export function roundMorphlingFlowTooltipValue(value: number): number {
  if (!isFiniteNonNegative(value)) return 0;
  return Math.round(value * 10) / 10;
}

export function calculateMorphlingFlowSpellAmplification(
  agility: number,
  agilityPerSpellAmp: number,
): number {
  if (
    !isFiniteNonNegative(agility) ||
    !Number.isFinite(agilityPerSpellAmp) ||
    agilityPerSpellAmp <= 0
  ) {
    return 0;
  }

  return agility / agilityPerSpellAmp;
}

export function calculateMorphlingFlowCooldownSpeedBonus(
  agility: number,
  strength: number,
  minimumRatioPercent: number,
  maximumRatioPercent: number,
  maximumBonus: number,
): number {
  if (
    !isFiniteNonNegative(agility) ||
    !isFiniteNonNegative(strength) ||
    !isFiniteNonNegative(minimumRatioPercent) ||
    !Number.isFinite(maximumRatioPercent) ||
    maximumRatioPercent <= minimumRatioPercent ||
    !Number.isFinite(maximumBonus) ||
    maximumBonus <= 0
  ) {
    return 0;
  }

  const ratioPercent = (strength / Math.max(agility, 1)) * 100;
  const progress =
    (ratioPercent - minimumRatioPercent) / (maximumRatioPercent - minimumRatioPercent);
  return Math.max(0, Math.min(maximumBonus, progress * maximumBonus));
}
