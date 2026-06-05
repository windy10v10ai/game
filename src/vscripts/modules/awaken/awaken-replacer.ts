/** 觉醒替换算法：新增 / 替换 / 插入三分支。物品觉醒与数据觉醒共用此入口 */

import { ABILITY_REPLACEMENTS, AbilityReplacement } from './awaken-config';

/** 返回是否实际执行了觉醒；英雄已拥有 newAbility 时跳过并返回 false（幂等，供重复使用判定） */
export function executeReplacement(
  hero: CDOTA_BaseNPC_Hero,
  replacement: AbilityReplacement,
): boolean {
  // 已觉醒则跳过：避免重复使用觉醒石时再次 AddAbility 叠加同名技能
  if (hero.FindAbilityByName(replacement.newAbility) !== undefined) {
    return false;
  }

  // 分支1：纯新增
  if (replacement.targetAbility === undefined && replacement.targetSlot === undefined) {
    const added = hero.AddAbility(replacement.newAbility);
    if (added !== undefined) {
      added.SetLevel(replacement.newLevel);
    }
    return true;
  }

  let targetAbilityName: string | undefined = replacement.targetAbility;
  const isTargetSlot = replacement.targetSlot !== undefined;
  if (targetAbilityName === undefined && isTargetSlot) {
    const ability = hero.GetAbilityByIndex(replacement.targetSlot!);
    if (ability !== undefined) {
      targetAbilityName = ability.GetAbilityName();
    }
  }

  // 分支2：插入（保存原技能等级 → 移除 → 退点数 → 加新技能 → 加回原技能并恢复等级）
  if (isTargetSlot && targetAbilityName !== undefined && targetAbilityName !== 'generic_hidden') {
    const oldAbility = hero.FindAbilityByName(targetAbilityName);
    if (oldAbility !== undefined) {
      const savedLevel = oldAbility.GetLevel();
      hero.RemoveAbility(targetAbilityName);
      hero.SetAbilityPoints(hero.GetAbilityPoints() + savedLevel);
      const newAb = hero.AddAbility(replacement.newAbility);
      if (newAb !== undefined) {
        newAb.SetLevel(replacement.newLevel);
      }
      const reAdded = hero.AddAbility(targetAbilityName);
      if (reAdded !== undefined) {
        reAdded.SetLevel(savedLevel);
      }
      return true;
    }
    return false;
  }

  // 分支3：替换（移除旧技能，加新技能后把原已学等级同步到新技能，不退点数）
  let savedLevel = 0;
  if (targetAbilityName !== undefined) {
    const oldAbility = hero.FindAbilityByName(targetAbilityName);
    if (oldAbility !== undefined) {
      savedLevel = oldAbility.GetLevel();
      hero.RemoveAbility(targetAbilityName);
    }
  }
  const added = hero.AddAbility(replacement.newAbility);
  if (added !== undefined) {
    // newLevel > 0 时优先用配置等级；否则同步旧技能已学等级，均不超过新技能 MaxLevel
    const desiredLevel = replacement.newLevel > 0 ? replacement.newLevel : savedLevel;
    added.SetLevel(Math.min(desiredLevel, added.GetMaxLevel()));
  }
  return true;
}

/** 英雄是否在觉醒支持列表内（用于施法前校验，不支持则拒绝施法并提示） */
export function canAwaken(hero: CDOTA_BaseNPC_Hero): boolean {
  const heroName = hero.GetUnitName();
  return ABILITY_REPLACEMENTS.some((r) => r.heroName === heroName);
}

/** 支持觉醒的英雄是否已觉醒完毕（所有匹配条目的 newAbility 均已存在，无可执行的觉醒） */
export function isAwakened(hero: CDOTA_BaseNPC_Hero): boolean {
  const heroName = hero.GetUnitName();
  const matched = ABILITY_REPLACEMENTS.filter((r) => r.heroName === heroName);
  if (matched.length === 0) {
    return false;
  }
  return matched.every((r) => hero.FindAbilityByName(r.newAbility) !== undefined);
}

/** 对英雄应用所有匹配的觉醒替换，返回是否实际执行了觉醒（已觉醒/未命中均返回 false，供调用方决定是否消耗道具） */
export function applyAwakenByHero(hero: CDOTA_BaseNPC_Hero): boolean {
  const heroName = hero.GetUnitName();
  let applied = false;
  for (const replacement of ABILITY_REPLACEMENTS) {
    if (heroName !== replacement.heroName) {
      continue;
    }
    if (executeReplacement(hero, replacement)) {
      applied = true;
    }
  }
  return applied;
}
