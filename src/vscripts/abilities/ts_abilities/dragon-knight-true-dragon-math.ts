export function isWithinTrueDragonPresence(
  dragonX: number,
  dragonY: number,
  sourceX: number,
  sourceY: number,
  attackRange: number,
  dragonHullRadius = 0,
  sourceHullRadius = 0,
): boolean {
  if (attackRange <= 0) return false;

  const effectiveRange =
    attackRange + Math.max(dragonHullRadius, 0) + Math.max(sourceHullRadius, 0);
  const deltaX = sourceX - dragonX;
  const deltaY = sourceY - dragonY;
  return deltaX * deltaX + deltaY * deltaY <= effectiveRange * effectiveRange;
}

export interface RoarDamageState {
  accumulatedDamage: number;
  shouldTrigger: boolean;
}

export function updateRoarDamageState(
  accumulatedDamage: number,
  receivedDamage: number,
  maximumHealth: number,
  thresholdPercent: number,
  cooldownReady: boolean,
): RoarDamageState {
  if (!cooldownReady || maximumHealth <= 0 || thresholdPercent <= 0) {
    return { accumulatedDamage: 0, shouldTrigger: false };
  }

  const currentDamage = Math.max(accumulatedDamage, 0);
  if (receivedDamage <= 0) {
    return { accumulatedDamage: currentDamage, shouldTrigger: false };
  }

  const nextDamage = currentDamage + receivedDamage;
  if (nextDamage >= maximumHealth * (thresholdPercent / 100)) {
    return { accumulatedDamage: 0, shouldTrigger: true };
  }

  return { accumulatedDamage: nextDamage, shouldTrigger: false };
}
export interface RoarInternalCooldownState extends RoarDamageState {
  cooldownEndTime: number;
}

export function updateRoarInternalCooldown(
  accumulatedDamage: number,
  receivedDamage: number,
  maximumHealth: number,
  thresholdPercent: number,
  currentTime: number,
  cooldownEndTime: number,
  cooldownDuration: number,
): RoarInternalCooldownState {
  if (currentTime < cooldownEndTime) {
    return { accumulatedDamage: 0, cooldownEndTime, shouldTrigger: false };
  }

  const damageState = updateRoarDamageState(
    accumulatedDamage,
    receivedDamage,
    maximumHealth,
    thresholdPercent,
    true,
  );
  if (!damageState.shouldTrigger) {
    return { ...damageState, cooldownEndTime };
  }

  return {
    accumulatedDamage: 0,
    cooldownEndTime: currentTime + Math.max(cooldownDuration, 0),
    shouldTrigger: true,
  };
}
export interface RoarHealthLossState {
  observedHealth: number;
  accumulatedHealthLoss: number;
  cooldownEndTime: number;
  shouldTrigger: boolean;
}

export function updateRoarHealthLossState(
  previousObservedHealth: number,
  currentHealth: number,
  accumulatedHealthLoss: number,
  maximumHealth: number,
  thresholdPercent: number,
  currentTime: number,
  cooldownEndTime: number,
  cooldownDuration: number,
): RoarHealthLossState {
  const observedHealth = Math.max(currentHealth, 0);
  if (currentTime < cooldownEndTime || maximumHealth <= 0 || thresholdPercent <= 0) {
    return {
      observedHealth,
      accumulatedHealthLoss: 0,
      cooldownEndTime,
      shouldTrigger: false,
    };
  }

  const actualHealthLoss = Math.max(Math.max(previousObservedHealth, 0) - observedHealth, 0);
  const nextHealthLoss = Math.max(accumulatedHealthLoss, 0) + actualHealthLoss;
  if (nextHealthLoss < maximumHealth * (thresholdPercent / 100)) {
    return {
      observedHealth,
      accumulatedHealthLoss: nextHealthLoss,
      cooldownEndTime,
      shouldTrigger: false,
    };
  }

  return {
    observedHealth,
    accumulatedHealthLoss: 0,
    cooldownEndTime: currentTime + Math.max(cooldownDuration, 0),
    shouldTrigger: true,
  };
}
export function calculateLethalDamageConstant(damage: number, currentHealth: number): number {
  if (damage < currentHealth || currentHealth <= 0) return 0;
  return -(damage - currentHealth + 1);
}

export function getTrueDragonFormTier(ultimateLevel: number, hasScepter: boolean): number {
  const inheritedTier = Math.floor(ultimateLevel) + (hasScepter ? 1 : 0);
  return Math.min(Math.max(inheritedTier, 1), 4);
}
export function calculateAdditionalCorrosiveDamage(
  targetDamagePerSecond: number,
  nativeDamagePerSecond: number,
): number {
  return Math.max(targetDamagePerSecond - nativeDamagePerSecond, 0);
}

export function calculateSlowAdjustment(targetSlow: number, nativeSlow: number): number {
  return nativeSlow - targetSlow;
}

export function isWithinSplashExtension(
  distance: number,
  nativeRadius: number,
  addedRadius: number,
): boolean {
  if (distance < 0 || nativeRadius < 0 || addedRadius <= 0) return false;
  return distance > nativeRadius && distance <= nativeRadius + addedRadius;
}

export function calculateSplashExtensionDamage(
  originalAttackDamage: number,
  splashDamagePercent: number,
): number {
  if (originalAttackDamage <= 0 || splashDamagePercent <= 0) return 0;
  return originalAttackDamage * (splashDamagePercent / 100);
}
