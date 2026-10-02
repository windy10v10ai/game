/** 通用战斗数值计算：护甲减伤、命中期望伤害、期望普攻 DPS、状态抗性折算的负面状态时长。 */

export function calculateActualDamage(damage: number, target: CDOTA_BaseNPC): number {
  const armor = target.GetPhysicalArmorValue(false);
  return damage * (1 - (armor * 0.06) / (1 + Math.abs(armor) * 0.06));
}

export function calculateExpectedHitDamage(damage: number, target: CDOTA_BaseNPC): number {
  return calculateActualDamage(damage, target) * (1 - target.GetEvasion());
}

export function calculateAttackDPS(attacker: CDOTA_BaseNPC, target: CDOTA_BaseNPC): number {
  const rawDamage = attacker.GetAverageTrueAttackDamage(target);
  return calculateExpectedHitDamage(rawDamage, target) * attacker.GetAttacksPerSecond(false);
}

// 引擎给敌人挂 modifier 时不会按状态抗性缩短时长，负面状态须自行折算
export function calculateStatusResistedDuration(duration: number, target: CDOTA_BaseNPC): number {
  return Math.max(0, duration * (1 - target.GetStatusResistance()));
}
