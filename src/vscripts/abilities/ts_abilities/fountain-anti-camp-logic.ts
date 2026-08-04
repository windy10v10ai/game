export interface FountainAreaPoint {
  x: number;
  y: number;
}

export function isInsideFountainArea(
  point: FountainAreaPoint,
  center: FountainAreaPoint,
  radius: number,
): boolean {
  if (radius <= 0) return false;

  const deltaX = point.x - center.x;
  const deltaY = point.y - center.y;
  return deltaX * deltaX + deltaY * deltaY <= radius * radius;
}

export function getRetaliationHealthAfterHit(healthBefore: number, damage: number): number {
  return Math.max(0, healthBefore - Math.max(0, damage));
}

export function clampExcludedDamage(totalDamage: number, excludedDamage: number): number {
  return Math.max(0, totalDamage - Math.max(0, excludedDamage));
}

export function shouldArmRewardSuppression(currentHealth: number, incomingDamage: number): boolean {
  return currentHealth > 0 && incomingDamage > 0 && incomingDamage >= currentHealth;
}

export interface FountainRewardValues {
  minimumGold: number;
  maximumGold: number;
  deathXp: number;
}

export function captureLatestRewardValues(
  saved: FountainRewardValues,
  current: FountainRewardValues,
): FountainRewardValues {
  return {
    minimumGold: current.minimumGold > 0 ? current.minimumGold : saved.minimumGold,
    maximumGold: current.maximumGold > 0 ? current.maximumGold : saved.maximumGold,
    deathXp: current.deathXp > 0 ? current.deathXp : saved.deathXp,
  };
}

export interface TrackingProjectileStep {
  position: FountainAreaPoint;
  reached: boolean;
}

export function advanceTrackingProjectile(
  current: FountainAreaPoint,
  target: FountainAreaPoint,
  travelDistance: number,
  hitRadius: number,
): TrackingProjectileStep {
  const deltaX = target.x - current.x;
  const deltaY = target.y - current.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const safeTravelDistance = Math.max(0, travelDistance);
  const safeHitRadius = Math.max(0, hitRadius);
  const reached = distance <= safeHitRadius + safeTravelDistance;
  if (distance <= 0) return { position: current, reached: true };

  const stepDistance = reached ? Math.max(0, distance - safeHitRadius) : safeTravelDistance;
  const scale = stepDistance / distance;
  return {
    position: {
      x: current.x + deltaX * scale,
      y: current.y + deltaY * scale,
    },
    reached,
  };
}
export function isProjectileWithinHitRadius(
  projectile: FountainAreaPoint,
  target: FountainAreaPoint,
  hitRadius: number,
): boolean {
  if (hitRadius <= 0) return false;

  const deltaX = projectile.x - target.x;
  const deltaY = projectile.y - target.y;
  return deltaX * deltaX + deltaY * deltaY <= hitRadius * hitRadius;
}
