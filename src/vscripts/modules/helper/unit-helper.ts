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
