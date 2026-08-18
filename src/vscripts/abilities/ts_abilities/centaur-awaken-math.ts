export interface CentaurDamageSample {
  time: number;
  damage: number;
}

export function filterRecentCentaurDamage(
  samples: readonly CentaurDamageSample[],
  currentTime: number,
  windowSeconds: number,
): CentaurDamageSample[] {
  const earliestTime = currentTime - Math.max(windowSeconds, 0);
  return samples.filter(
    (sample) => sample.damage > 0 && sample.time >= earliestTime && sample.time <= currentTime,
  );
}

export interface CentaurDamageCycle {
  pendingSamples: CentaurDamageSample[];
  currentSamples: CentaurDamageSample[];
}

export function beginCentaurDamageCycle(
  samples: readonly CentaurDamageSample[],
  currentTime: number,
  windowSeconds: number,
): CentaurDamageCycle {
  return {
    pendingSamples: filterRecentCentaurDamage(samples, currentTime, windowSeconds),
    currentSamples: [],
  };
}

export function restoreCancelledCentaurDamageCycle(
  pendingSamples: readonly CentaurDamageSample[],
  currentSamples: readonly CentaurDamageSample[],
  currentTime: number,
  windowSeconds: number,
): CentaurDamageSample[] {
  return filterRecentCentaurDamage(
    [...pendingSamples, ...currentSamples],
    currentTime,
    windowSeconds,
  );
}

export function shouldFinishCentaurDamageCycle(
  fullyCast: boolean,
  consumedStoredDamage: number,
): boolean {
  return fullyCast || consumedStoredDamage > 0;
}

export function canCentaurAccumulateDamage(
  doubleEdgeLevel: number,
  passivesDisabled: boolean,
): boolean {
  return doubleEdgeLevel > 0 && !passivesDisabled;
}

export function sumCentaurDamage(samples: readonly CentaurDamageSample[]): number {
  let totalDamage = 0;
  for (const sample of samples) {
    totalDamage += Math.max(sample.damage, 0);
  }
  return totalDamage;
}

export function calculateCentaurDoubleEdgeNormalDamage(
  baseDamage: number,
  strength: number,
  strengthDamagePct: number,
): number {
  return Math.max(baseDamage, 0) + (Math.max(strength, 0) * Math.max(strengthDamagePct, 0)) / 100;
}

export function calculateCentaurStoredDamage(
  recentDamage: number,
  conversionPct: number,
  normalDoubleEdgeDamage: number,
  capPct: number,
): number {
  const convertedDamage = (Math.max(recentDamage, 0) * Math.max(conversionPct, 0)) / 100;
  const damageCap = (Math.max(normalDoubleEdgeDamage, 0) * Math.max(capPct, 0)) / 100;
  return Math.min(convertedDamage, damageCap);
}

export function calculateCentaurShieldAmount(
  consumedStoredDamage: number,
  shieldPct: number,
): number {
  return (Math.max(consumedStoredDamage, 0) * Math.max(shieldPct, 0)) / 100;
}

export function mergeCentaurShieldAmount(
  currentRemainingShield: number,
  newShield: number,
): number {
  return Math.max(currentRemainingShield, newShield, 0);
}
