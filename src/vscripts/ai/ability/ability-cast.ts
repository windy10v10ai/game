import { CastCoindition, IsAbilityBehavior } from '../action/cast-condition';

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
 *  - POINT / AOE   → CastAbilityOnPosition(castPosition ?? target.GetAbsOrigin())
 *  - NO_TARGET     → CastAbilityNoTarget()
 *
 * castPosition 可选：当 spec 配置了 castMode='projectedOnCastRange' 时，dispatcher 会
 * 算出投影点并传入，覆盖默认的"释放点 = 目标位置"。
 *
 * 抽自 ActionAbility.CastAbilityOnFindEnemy 内部分支，供 dispatcher 与现有 ActionAbility 共用。
 */
export function CastAbilityOnTargetByBehavior(
  hero: CDOTA_BaseNPC_Hero,
  ability: CDOTABaseAbility,
  target: CDOTA_BaseNPC,
  castPosition?: Vector,
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
    hero.CastAbilityOnPosition(castPosition ?? target.GetAbsOrigin(), ability, playerId);
    return true;
  }
  if (IsAbilityBehavior(ability, AbilityBehavior.AOE)) {
    print(`[AI] CastByBehavior ${abilityName} on position`);
    hero.CastAbilityOnPosition(castPosition ?? target.GetAbsOrigin(), ability, playerId);
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

/**
 * 执行 spec 中声明的开关动作（toggle / autocast）。仅切换状态，不走正常施法派发。
 *
 * 用于 bot 主动开启抽奖抽到的法球/开关类被动技能（默认关闭，不开启永不生效）：
 *  - toggleOn / toggleOff：切换 TOGGLE 技能开关（如分裂箭、严寒烧灼有 A 杖时）
 *  - autoCastOn：开启自动施法（毒性攻击、霜冻之箭等攻击型法球）
 *
 * 仅当目标状态与当前状态不一致时才切换并返回 true（命中本 tick），避免反复点击。
 * dispatcher 与老链路 ActionAbility.doAction 共用。
 */
export function ApplyAbilityAction(
  ability: CDOTABaseAbility,
  action: NonNullable<CastCoindition['action']>,
): boolean {
  if (action.toggleOn && !ability.GetToggleState()) {
    print(`[AI] toggleOn ${ability.GetName()}`);
    ability.ToggleAbility();
    return true;
  }
  if (action.toggleOff && ability.GetToggleState()) {
    print(`[AI] toggleOff ${ability.GetName()}`);
    ability.ToggleAbility();
    return true;
  }
  if (action.autoCastOn && !ability.GetAutoCastState()) {
    print(`[AI] autoCastOn ${ability.GetName()}`);
    ability.ToggleAutoCast();
    return true;
  }
  return false;
}
