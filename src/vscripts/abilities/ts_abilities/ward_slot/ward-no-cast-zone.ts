// 上/下河道肉山坑位中心点，半径范围内禁止放置真假眼，避免肉山视野被无成本压制
const NO_CAST_ZONE_RADIUS = 400;
const NO_CAST_ZONE_CENTERS = [Vector(2787, -2722, 0), Vector(-3092, 2250, 0)];

export function isInWardNoCastZone(location: Vector): boolean {
  return NO_CAST_ZONE_CENTERS.some(
    (center) => location.__sub(center).Length2D() <= NO_CAST_ZONE_RADIUS,
  );
}
