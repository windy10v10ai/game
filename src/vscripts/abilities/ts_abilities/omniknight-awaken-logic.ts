export interface OmniknightHammerAttackTransition {
  count: number;
  triggerHammer: boolean;
}

export function advanceHammerAttackCount(
  currentCount: number,
  attacksPerHammer: number,
  isValidAttack: boolean,
  nativeHammerTriggered: boolean,
): OmniknightHammerAttackTransition {
  const threshold = Math.max(Math.floor(attacksPerHammer), 1);
  const normalizedCount = Math.min(Math.max(Math.floor(currentCount), 0), threshold);

  if (!isValidAttack) {
    return { count: normalizedCount, triggerHammer: false };
  }

  if (normalizedCount >= threshold) {
    return nativeHammerTriggered
      ? { count: 0, triggerHammer: true }
      : { count: threshold, triggerHammer: false };
  }

  return { count: normalizedCount + 1, triggerHammer: false };
}
