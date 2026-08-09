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
