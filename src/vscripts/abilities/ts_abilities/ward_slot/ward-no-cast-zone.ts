// 上/下河道肉山坑位中心点，半径范围内禁止放置真假眼，避免肉山视野被无成本压制
const NO_CAST_ZONE_RADIUS = 550;
const NO_CAST_ZONE_CENTERS = [Vector(2756, -2708, 7), Vector(-3117, 2291, 7)];

export function isInWardNoCastZone(location: Vector): boolean {
  return NO_CAST_ZONE_CENTERS.some(
    (center) => location.__sub(center).Length2D() <= NO_CAST_ZONE_RADIUS,
  );
}
