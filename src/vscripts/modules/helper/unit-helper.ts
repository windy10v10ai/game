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

const reflectExceptions: string[] = [
  'rubick_spell_steal',
  'shadow_shaman_shackles',
  'legion_commander_duel',
  'phantom_assassin_phantom_strike',
  'riki_blink_strike',
  'morphling_replicate',
];

export function ReflectSpellToCaster(keys: ModifierAbilityEvent, parent: CDOTA_BaseNPC): boolean {
  if (!IsServer()) {
    return false;
  }

  const ability = keys.ability;
  const caster = ability.GetCaster();

  // 如果施法者是队友，不反弹
  if (IsSameTeam(caster, parent)) {
    return false;
  }

  // 如果无法反弹的技能（在例外列表中）
  if (!ability || reflectExceptions.includes(ability.GetAbilityName())) {
    return false;
  }

  // 检查父单位是否存活
  if (!parent.IsAlive()) {
    return false;
  }

  // 复制技能
  const sourceAbility = ability;
  const reflectedAbility = parent.AddAbility(sourceAbility.GetAbilityName());

  // 设置反弹技能的属性
  reflectedAbility.SetLevel(sourceAbility.GetLevel());
  reflectedAbility.SetStolen(true);
  //   reflectedAbility.SetHidden(true);

  // 设置目标为原施法者
  parent.SetCursorCastTarget(sourceAbility.GetCaster());

  // 释放反弹技能
  const castResult = reflectedAbility.CastAbility();

  // 返还魔法
  if (castResult) {
    parent.GiveMana(sourceAbility.GetManaCost(-1));
  }
  // 移除反弹技能
  parent.RemoveAbilityByHandle(reflectedAbility);

  // 创建反弹特效
  const particle = ParticleManager.CreateParticle(
    'particles/units/heroes/hero_antimage/antimage_spellshield_reflect.vpcf',
    ParticleAttachment.ABSORIGIN_FOLLOW,
    parent,
  );

  ParticleManager.SetParticleControlEnt(
    particle,
    1,
    parent,
    ParticleAttachment.POINT_FOLLOW,
    'attach_hitloc',
    parent.GetAbsOrigin(),
    true,
  );
  ParticleManager.ReleaseParticleIndex(particle);

  // 播放特效
  parent.EmitSound('Item.LotusOrb.Target');

  return castResult;
}
