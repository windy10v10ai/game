// 实现全局 IsEnemy 函数
export function IsEnemyTeam(unit1: CDOTA_BaseNPC, unit2: CDOTA_BaseNPC): boolean {
  if (!unit1 || !unit2) {
    return false;
  }
  return unit1.GetTeamNumber() !== unit2.GetTeamNumber();
}

export function IsSameTeam(unit1: CDOTA_BaseNPC, unit2: CDOTA_BaseNPC): boolean {
  if (!unit1 || !unit2) {
    return false;
  }
  return unit1.GetTeamNumber() === unit2.GetTeamNumber();
}

// 敌方单位在战争迷雾里查不到，只能按阵营各查一次友方再合并
const ALL_TEAMS = [DotaTeam.GOODGUYS, DotaTeam.BADGUYS, DotaTeam.NEUTRALS];

export function findAllUnits(unitType: UnitTargetType): CDOTA_BaseNPC[] {
  const units: CDOTA_BaseNPC[] = [];
  for (const team of ALL_TEAMS) {
    const found = FindUnitsInRadius(
      team,
      Vector(0, 0, 0),
      undefined,
      FIND_UNITS_EVERYWHERE,
      UnitTargetTeam.FRIENDLY,
      unitType,
      UnitTargetFlags.INVULNERABLE + UnitTargetFlags.OUT_OF_WORLD,
      FindOrder.ANY,
      false,
    );
    for (const unit of found) units.push(unit);
  }
  return units;
}
