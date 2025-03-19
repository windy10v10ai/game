/**
 * 吸血相关的工具函数
 */

/** 判断目标是否可以触发吸血效果 */
function canLifestealFromTarget(target: CDOTA_BaseNPC, isAttack: boolean): boolean {
  if (!target) return false;
  if (target.IsBuilding()) return false; // 建筑
  // 幻象不触发技能吸血，但是可以触发攻击吸血
  if (!isAttack && target.IsIllusion()) return false;
  if (target.IsInvulnerable()) return false; // 无敌单位
  if (target.IsOther()) return false; // 信使等其他单位
  if (target.IsWard()) return false; // 守卫
  if (target.IsCourier()) return false; // 信使
  return true;
}

/** 判断伤害是否可以触发吸血效果
 * @param damageEvent 伤害事件
 * @param isAttack 是否是攻击
 * @returns 是否可以触发吸血效果
 */
function canLifestealFromDamage(damageEvent: ModifierInstanceEvent, isAttack: boolean): boolean {
  // 反弹的伤害不触发
  if ((damageEvent.damage_flags & DamageFlag.REFLECTION) === DamageFlag.REFLECTION) return false;
  // 移除生命值而不是造成直接伤害的技能不触发
  if ((damageEvent.damage_flags & DamageFlag.HPLOSS) === DamageFlag.HPLOSS) return false;
  // 不能触发攻击特效的攻击不触发 次级攻击 如分裂、月刃
  if (
    (damageEvent.damage_flags & DamageFlag.SECONDARY_PROJECTILE_ATTACK) ===
    DamageFlag.SECONDARY_PROJECTILE_ATTACK
  )
    return false;
  if (!isAttack) {
    // 技能吸血时，NO_SPELL_AMPLIFICATION
    if (
      (damageEvent.damage_flags & DamageFlag.NO_SPELL_AMPLIFICATION) ===
      DamageFlag.NO_SPELL_AMPLIFICATION
    )
      return false;
  }
  return true;
}

/** 计算实际吸血量 */
function calculateLifesteal(
  damage: number,
  lifeStealPercent: number,
  isHeroTarget: boolean,
  isSpellLifesteal: boolean,
): number {
  let finalLifesteal = damage * (lifeStealPercent / 100);

  // 非英雄目标降低吸血效果
  if (!isHeroTarget) {
    finalLifesteal *= isSpellLifesteal ? 0.2 : 0.6; // 技能吸血降低80%，普通吸血降低40%
  }

  return finalLifesteal;
}

/** 应用吸血效果和特效 */
function applyLifesteal(
  owner: CDOTA_BaseNPC,
  heal: number,
  ability: CDOTABaseAbility | undefined,
  isSpellLifesteal: boolean,
): void {
  if (heal <= 0) return;

  // FIXME 删除
  print(`${isSpellLifesteal ? '技能' : '攻击'}吸血: heal=${heal}`);

  owner.HealWithParams(heal, ability ?? {}, true, true, owner, isSpellLifesteal);

  // 吸血特效
  const particleId = ParticleManager.CreateParticle(
    isSpellLifesteal
      ? 'particles/items3_fx/octarine_core_lifesteal.vpcf'
      : 'particles/generic_gameplay/generic_lifesteal.vpcf',
    ParticleAttachment.ABSORIGIN_FOLLOW,
    owner,
  );
  ParticleManager.ReleaseParticleIndex(particleId);
}

/** 处理攻击吸血 */
function handleAttackLifesteal(
  event: ModifierInstanceEvent,
  lifeStealPercent: number,
  owner: CDOTA_BaseNPC,
): void {
  // 判定attacker是否是owner
  const attacker = event.attacker;
  if (attacker !== owner) return;

  // 判定是否是普通攻击
  const ability = event.inflictor;
  if (event.inflictor) return;

  // 普通攻击只有物理伤害触发攻击吸血，魔法伤害触发技能吸血，存粹伤害不触发
  if (event.damage_type !== DamageTypes.PHYSICAL) return;

  // 目标是自身或友军造成的任意伤害 不触发
  const target = event.unit;
  if (target.GetTeam() === owner.GetTeam()) return;

  if (!canLifestealFromDamage(event, true)) return;

  if (!canLifestealFromTarget(target, true)) return;

  const heal = calculateLifesteal(event.damage, lifeStealPercent, target.IsHero(), false);

  applyLifesteal(owner, heal, ability, false);
}

/** 处理技能吸血 */
function handleSpellLifesteal(
  event: ModifierInstanceEvent,
  lifeStealPercent: number,
  owner: CDOTA_BaseNPC,
): void {
  // 判定attacker是否是owner
  const attacker = event.attacker;
  if (attacker !== owner) return;

  // 纯粹伤害不触发技能吸血
  if (event.damage_type === DamageTypes.PURE) return;

  // 判定是否是普通攻击
  const ability = event.inflictor;
  // 普通攻击造成的物理伤害不触发技能吸血
  if (!ability && event.damage_type === DamageTypes.PHYSICAL) return;

  // 目标是自身或友军造成的任意伤害 不触发
  const target = event.unit;
  if (target.GetTeam() === owner.GetTeam()) return;

  if (!canLifestealFromDamage(event, false)) return;

  if (!canLifestealFromTarget(target, false)) return;

  const heal = calculateLifesteal(event.damage, lifeStealPercent, target.IsHero(), true);
  applyLifesteal(owner, heal, ability, true);
}

// 导出全局函数供Lua使用
declare global {
  function TsLifeStealOnAttackLanded(
    event: ModifierInstanceEvent,
    lifeStealPercent: number,
    owner: CDOTA_BaseNPC,
  ): void;
  function TsSpellLifeSteal(
    event: ModifierInstanceEvent,
    lifeStealPercent: number,
    owner: CDOTA_BaseNPC,
  ): void;
}

// 实现全局函数
_G.TsLifeStealOnAttackLanded = (
  event: ModifierInstanceEvent,
  lifeStealPercent: number,
  owner: CDOTA_BaseNPC,
) => {
  handleAttackLifesteal(event, lifeStealPercent, owner);
};

_G.TsSpellLifeSteal = (
  event: ModifierInstanceEvent,
  lifeStealPercent: number,
  owner: CDOTA_BaseNPC,
) => {
  handleSpellLifesteal(event, lifeStealPercent, owner);
};

export {};
