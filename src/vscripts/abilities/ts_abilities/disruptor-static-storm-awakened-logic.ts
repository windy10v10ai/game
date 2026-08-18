export interface Point {
  x: number;
  y: number;
}

export interface StormDpsInput {
  progress: number;
  baseMaxDps: number;
  baseStartPct: number;
  maxHealth: number;
  healthPctStart: number;
  healthPctEnd: number;
}

export interface GravityInput {
  distance: number;
  radius: number;
  progress: number;
  deadZone: number;
  startSpeed: number;
  endSpeed: number;
  maxSpeed: number;
}

export interface StormSource {
  id: string;
  position: Point;
}
export const DISRUPTOR_STATIC_STORM_AWAKENED_ABILITY_VALUES = [
  'duration',
  'radius',
  'damage_interval',
  'base_damage_start_pct',
  'damage_max',
  'max_health_damage_start_pct',
  'max_health_damage_end_pct',
  'gravity_radius_multiplier',
  'gravity_dead_zone',
  'gravity_start_speed',
  'gravity_end_speed',
  'gravity_max_speed',
] as const;

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * clamp01(progress);
}

export function calculateStormDps(input: StormDpsInput): number {
  const progress = clamp01(input.progress);
  const base =
    input.baseMaxDps * (input.baseStartPct / 100 + progress * (1 - input.baseStartPct / 100));
  const healthPct = lerp(input.healthPctStart, input.healthPctEnd, progress);
  return base + input.maxHealth * (healthPct / 100);
}

export function calculateTickDamage(input: StormDpsInput, intervalSeconds: number): number {
  return calculateStormDps(input) * intervalSeconds;
}

export function calculateGravitySpeed(input: GravityInput): number {
  const usableDistance = Math.max(0, input.distance - input.deadZone);
  const usableRadius = Math.max(0, input.radius - input.deadZone);
  if (usableDistance <= 0 || usableRadius <= 0) return 0;
  const distanceProgress = clamp01(usableDistance / usableRadius);
  return Math.min(
    input.maxSpeed,
    distanceProgress * lerp(input.startSpeed, input.endSpeed, input.progress),
  );
}

export function selectNearestSource(
  target: Point,
  sources: StormSource[],
): StormSource | undefined {
  return sources.reduce<StormSource | undefined>((nearest, source) => {
    if (!nearest) return source;
    const distance = squaredDistance(target, source.position);
    const nearestDistance = squaredDistance(target, nearest.position);
    return distance < nearestDistance || (distance === nearestDistance && source.id < nearest.id)
      ? source
      : nearest;
  }, undefined);
}

function squaredDistance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}
