export interface Point2D {
  x: number;
  y: number;
}

export interface TrackingProjectileStep {
  position: Point2D;
  reached: boolean;
}

export function advanceTrackingProjectile(
  current: Point2D,
  target: Point2D,
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
