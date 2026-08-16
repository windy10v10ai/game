export interface Point2D {
  x: number;
  y: number;
}

export type RecastFinishReason = 'cast' | 'expired' | 'death';

export interface RecastWindowState {
  phase: 'recast' | 'cooldown';
  cooldownStarted: boolean;
  reason?: RecastFinishReason;
}

export function getRadialDestination(
  center: Point2D,
  target: Point2D,
  maxDistance: number,
  fallbackDirection: Point2D = { x: 1, y: 0 },
): Point2D {
  let directionX = target.x - center.x;
  let directionY = target.y - center.y;
  let length = Math.sqrt(directionX * directionX + directionY * directionY);

  if (length === 0) {
    directionX = fallbackDirection.x;
    directionY = fallbackDirection.y;
    length = Math.sqrt(directionX * directionX + directionY * directionY);
  }

  if (length === 0) {
    directionX = 1;
    length = 1;
  }

  return {
    x: center.x + (directionX / length) * maxDistance,
    y: center.y + (directionY / length) * maxDistance,
  };
}

export function startRecastWindow(): RecastWindowState {
  return { phase: 'recast', cooldownStarted: false };
}

export function finishRecastWindow(
  _state: RecastWindowState,
  reason: RecastFinishReason,
): RecastWindowState {
  return { phase: 'cooldown', cooldownStarted: true, reason };
}

export function shouldRestoreDelayedCooldown(cooldownRemaining: number): boolean {
  return cooldownRemaining > 0;
}

export function registerCollision(alreadyCollided: boolean): {
  collided: boolean;
  shouldSettle: boolean;
} {
  return { collided: true, shouldSettle: !alreadyCollided };
}

export function isTerrainCollision(
  traversable: boolean,
  blocked: boolean,
  nearbyTree: boolean,
  heightDelta: number,
  maxHeightDelta: number,
): boolean {
  return !traversable || blocked || nearbyTree || Math.abs(heightDelta) > maxHeightDelta;
}
