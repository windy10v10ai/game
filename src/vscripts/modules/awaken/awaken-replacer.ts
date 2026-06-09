/** 觉醒替换算法：新增 / 替换 / 插入三分支。物品觉醒与数据觉醒共用此入口 */

import { ABILITY_REPLACEMENTS, AbilityReplacement } from './awaken-config';

/** 加新技能并设等级（不超过其 MaxLevel） */
function addAbilityAtLevel(hero: CDOTA_BaseNPC_Hero, abilityName: string, level: number): void {
  const added = hero.AddAbility(abilityName);
  if (added !== undefined) {
    added.SetLevel(Math.min(level, added.GetMaxLevel()));
  }
}

/** 解析替换目标技能名：优先 targetAbility，其次 targetSlot 当前占用的技能 */
function resolveTargetAbility(
  hero: CDOTA_BaseNPC_Hero,
  replacement: AbilityReplacement,
): string | undefined {
  if (replacement.targetAbility !== undefined) {
    return replacement.targetAbility;
  }
  if (replacement.targetSlot !== undefined) {
    return hero.GetAbilityByIndex(replacement.targetSlot)?.GetAbilityName();
  }
  return undefined;
}

/** 新技能初始等级：配了 inheritLevelFrom 则继承该关联技能当前等级，否则用 fallback */
function resolveNewLevel(
  hero: CDOTA_BaseNPC_Hero,
  replacement: AbilityReplacement,
  fallbackLevel: number,
): number {
  if (replacement.inheritLevelFrom !== undefined) {
    const linked = hero.FindAbilityByName(replacement.inheritLevelFrom);
    if (linked !== undefined) {
      return linked.GetLevel();
    }
  }
  return fallbackLevel;
}

/** 插入：保存原技能等级 → 移除 → 退点数 → 加新技能 → 加回原技能并恢复等级 */
function insertAbility(
  hero: CDOTA_BaseNPC_Hero,
  replacement: AbilityReplacement,
  targetAbilityName: string,
): boolean {
  const oldAbility = hero.FindAbilityByName(targetAbilityName);
  if (oldAbility === undefined) {
    return false;
  }
  const savedLevel = oldAbility.GetLevel();
  // 继承等级须在移除关联技能前求值（inheritLevelFrom 可能正是被插入槽位的技能）
  const newAbilityLevel = resolveNewLevel(hero, replacement, replacement.newLevel);
  hero.RemoveAbility(targetAbilityName);
  hero.SetAbilityPoints(hero.GetAbilityPoints() + savedLevel);
  addAbilityAtLevel(hero, replacement.newAbility, newAbilityLevel);
  addAbilityAtLevel(hero, targetAbilityName, savedLevel);
  return true;
}

/** 替换：移除旧技能 → 加新技能，inheritLevelFrom > newLevel(>0) > 原已学等级（不退点数） */
function replaceAbility(
  hero: CDOTA_BaseNPC_Hero,
  replacement: AbilityReplacement,
  targetAbilityName: string | undefined,
): boolean {
  let savedLevel = 0;
  if (targetAbilityName !== undefined) {
    const oldAbility = hero.FindAbilityByName(targetAbilityName);
    if (oldAbility !== undefined) {
      savedLevel = oldAbility.GetLevel();
    }
  }
  const fallbackLevel = replacement.newLevel > 0 ? replacement.newLevel : savedLevel;
  const newAbilityLevel = resolveNewLevel(hero, replacement, fallbackLevel);
  if (targetAbilityName !== undefined && hero.FindAbilityByName(targetAbilityName) !== undefined) {
    hero.RemoveAbility(targetAbilityName);
  }
  addAbilityAtLevel(hero, replacement.newAbility, newAbilityLevel);
  return true;
}

/** 返回是否实际执行了觉醒；英雄已拥有 newAbility 时跳过并返回 false（幂等，供重复使用判定） */
export function executeReplacement(
  hero: CDOTA_BaseNPC_Hero,
  replacement: AbilityReplacement,
): boolean {
  // 已觉醒则跳过：避免重复使用觉醒石时再次 AddAbility 叠加同名技能
  if (hero.FindAbilityByName(replacement.newAbility) !== undefined) {
    return false;
  }

  // 纯新增
  if (replacement.targetAbility === undefined && replacement.targetSlot === undefined) {
    addAbilityAtLevel(
      hero,
      replacement.newAbility,
      resolveNewLevel(hero, replacement, replacement.newLevel),
    );
    return true;
  }

  const targetAbilityName = resolveTargetAbility(hero, replacement);

  // 插入：targetSlot 命中非空槽位时把原技能挤进来重新加回；空槽/generic_hidden 走替换
  if (
    replacement.targetSlot !== undefined &&
    targetAbilityName !== undefined &&
    targetAbilityName !== 'generic_hidden'
  ) {
    return insertAbility(hero, replacement, targetAbilityName);
  }

  return replaceAbility(hero, replacement, targetAbilityName);
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
