// 全局函数 IsEnemy
declare global {
  function IsEnemyTeam(unit1: CDOTA_BaseNPC, unit2: CDOTA_BaseNPC): boolean;
  function IsSameTeam(unit1: CDOTA_BaseNPC, unit2: CDOTA_BaseNPC): boolean;
}

// 实现全局 IsEnemy 函数
function IsEnemyTeam(unit1: CDOTA_BaseNPC, unit2: CDOTA_BaseNPC): boolean {
  if (!unit1 || !unit2) {
    return false;
  }
  return unit1.GetTeamNumber() !== unit2.GetTeamNumber();
}

function IsSameTeam(unit1: CDOTA_BaseNPC, unit2: CDOTA_BaseNPC): boolean {
  if (!unit1 || !unit2) {
    return false;
  }
  return unit1.GetTeamNumber() === unit2.GetTeamNumber();
}

// 导出函数以便在其他模块中使用
export { IsEnemyTeam, IsSameTeam };
