import { IsAbilityBehavior } from '../action/cast-condition';

/**
 * 技能的有效施法距离 = KV 中 AbilityCastRange + 施法者的施法距离加成。
 */
export function GetFullCastRange(self: CDOTA_BaseNPC_Hero, ability: CDOTABaseAbility): number {
  const range = ability.GetCastRange(self.GetAbsOrigin(), undefined);
  const castRangeIncrease = self.GetCastRangeBonus();
  return range + castRangeIncrease;
}

/**
 * 给定一个已选定的 target，按 ability 的 behavior 位掩码自动派发到对应的 CastAbility 调用。
 *
 *  - UNIT_TARGET   → CastAbilityOnTarget(target)
 *  - POINT / AOE   → CastAbilityOnPosition(target.GetAbsOrigin())
 *  - NO_TARGET     → CastAbilityNoTarget()
 *
 * 抽自 ActionAbility.CastAbilityOnFindEnemy 内部分支，供 dispatcher 与现有 ActionAbility 共用。
 */
export function CastAbilityOnTargetByBehavior(
  hero: CDOTA_BaseNPC_Hero,
  ability: CDOTABaseAbility,
  target: CDOTA_BaseNPC,
): boolean {
  const playerId = hero.GetPlayerOwnerID();
  const abilityName = ability.GetName();

  if (IsAbilityBehavior(ability, AbilityBehavior.UNIT_TARGET)) {
    print(`[AI] CastByBehavior ${abilityName} on target`);
    hero.CastAbilityOnTarget(target, ability, playerId);
    return true;
  }
  if (IsAbilityBehavior(ability, AbilityBehavior.POINT)) {
    print(`[AI] CastByBehavior ${abilityName} on point`);
    hero.CastAbilityOnPosition(target.GetAbsOrigin(), ability, playerId);
    return true;
  }
  if (IsAbilityBehavior(ability, AbilityBehavior.AOE)) {
    print(`[AI] CastByBehavior ${abilityName} on position`);
    hero.CastAbilityOnPosition(target.GetAbsOrigin(), ability, playerId);
    return true;
  }
  if (IsAbilityBehavior(ability, AbilityBehavior.NO_TARGET)) {
    print(`[AI] CastByBehavior ${abilityName} no target`);
    hero.CastAbilityNoTarget(ability, playerId);
    return true;
  }

  print(`[AI] ERROR CastByBehavior ${abilityName} behavior not supported`);
  return false;
}
