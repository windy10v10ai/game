import { IsSameTeam } from '../../modules/helper/unit-helper';
import {
  BaseItem,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { BaseItemModifier } from './base_item_modifier';

@registerAbility('item_saint_orb')
export class ItemSaintOrb extends BaseItem {
  GetIntrinsicModifierName(): string {
    return 'modifier_item_saint_orb_passive';
  }

  OnSpellStart(): void {
    const caster = this.GetCaster() as CDOTA_BaseNPC_Hero;
    const target = this.GetCursorTarget() as CDOTA_BaseNPC;
    const duration = this.GetSpecialValueFor('duration');

    if (!target) return;

    target.EmitSound('Item.LotusOrb.Target');

    target.AddNewModifier(caster, this, 'modifier_item_saint_orb_buff', { duration });
    target.AddNewModifier(caster, this, 'modifier_item_lotus_orb_active', { duration });
  }
}

@registerModifier('modifier_item_saint_orb_passive')
export class ModifierItemSaintOrbPassive extends BaseItemModifier {
  override statsModifierName: string = 'modifier_item_saint_orb_stats';

  // DeclareFunctions(): ModifierFunction[] {
  //   return [ModifierFunction.ABSORB_SPELL, ModifierFunction.REFLECT_SPELL];
  // }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return {
      [ModifierState.UNSLOWABLE]: true,
    };
  }

  // GetAbsorbSpell(keys: ModifierAbilityEvent): 0 | 1 {
  //   if (!IsServer()) {
  //     return 0;
  //   }
  //   const parent = this.GetParent();
  //   const item = this.GetAbility();
  //   if (!item) return 0;
  //   if (item.GetCooldownTimeRemaining() > 0) {
  //     return 0;
  //   }
  //   const absorbResult = GetAbsorbSpell(keys, parent, item);

  //   if (absorbResult) {
  //     StartAbilityCooldown(item);
  //   }
  //   return absorbResult ? 1 : 0;
  // }

  // GetReflectSpell(keys: ModifierAbilityEvent): 0 | 1 {
  //   if (!IsServer()) {
  //     return 0;
  //   }
  //   const item = this.GetAbility();
  //   if (!item) return 0;
  //   if (item.GetCooldownTimeRemaining() > 0) {
  //     return 0;
  //   }

  //   const parent = this.GetParent();
  //   const reflectResult = ReflectSpellToCaster(keys, parent);
  //   if (reflectResult) {
  //     // GetReflectSpell 优先执行 不进入冷却，GetAbsorbSpell执行结束后 进入冷却
  //     // StartAbilityCooldown(item);
  //   }
  //   return reflectResult ? 1 : 0;
  // }
}

@registerModifier('modifier_item_saint_orb_buff')
export class ModifierItemSaintOrbBuff extends BaseModifier {
  IsDebuff(): boolean {
    return false;
  }

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  IsPurgeException(): boolean {
    return false;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.ABSORB_SPELL,
      // ModifierFunction.REFLECT_SPELL,
    ];
  }

  GetTexture(): string {
    return 'item_saint_orb';
  }

  OnCreated(): void {
    if (!IsServer()) {
      return;
    }

    const parent = this.GetParent();
    parent.Purge(false, true, false, false, false);

    const position = parent.GetAbsOrigin();
    const particle = ParticleManager.CreateParticle(
      'particles/units/heroes/hero_templar_assassin/templar_assassin_refraction.vpcf',
      ParticleAttachment.CUSTOMORIGIN_FOLLOW,
      parent,
    );

    ParticleManager.SetParticleControl(particle, 0, position);
    ParticleManager.SetParticleControlEnt(
      particle,
      1,
      parent,
      ParticleAttachment.ABSORIGIN_FOLLOW,
      'attach_hitloc',
      parent.GetAbsOrigin(),
      true,
    );
    ParticleManager.SetParticleControl(particle, 5, position);

    this.AddParticle(particle, false, false, 20, false, false);
  }

  GetAbsorbSpell(keys: ModifierAbilityEvent): 0 | 1 {
    const parent = this.GetParent();
    const item = this.GetAbility();
    const absorbResult = GetAbsorbSpell(keys, parent, item);
    if (absorbResult) {
      this.Destroy();
    }
    return absorbResult ? 1 : 0;
  }

  // GetReflectSpell(keys: ModifierAbilityEvent): 0 | 1 {
  //   const parent = this.GetParent();

  //   return ReflectSpellToCaster(keys, parent) ? 1 : 0;
  // }
}

export function GetAbsorbSpell(
  keys: ModifierAbilityEvent,
  parent: CDOTA_BaseNPC,
  item: CDOTABaseAbility | undefined,
): boolean {
  if (!IsServer()) {
    return false;
  }
  if (!item) return false;

  const caster = keys.ability.GetCaster();
  if (IsSameTeam(caster, parent)) {
    // 不吸收队友技能
    return false;
  }

  // 创建吸收特效
  const particle = ParticleManager.CreateParticle(
    'particles/units/heroes/hero_templar_assassin/templar_loadout.vpcf',
    ParticleAttachment.ABSORIGIN_FOLLOW,
    parent,
  );

  const parentPos = parent.GetAbsOrigin();
  ParticleManager.SetParticleControl(particle, 0, parentPos);
  ParticleManager.SetParticleControl(particle, 1, parentPos);
  ParticleManager.SetParticleControl(particle, 2, Vector(10, 10, 10));
  ParticleManager.ReleaseParticleIndex(particle);

  // 治疗效果
  const healPercent = item.GetSpecialValueFor('heal_percent');
  const healAmount = parent.GetMaxHealth() * healPercent * 0.01;
  parent.Heal(healAmount, item);

  SendOverheadEventMessage(undefined, OverheadAlert.HEAL, parent, healAmount, undefined);
  return true;
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

  // 移除之前的反弹技能
  // @ts-expect-error 自定义英雄属性
  if (parent.reflected_spell) {
    // @ts-expect-error 自定义英雄属性
    parent.RemoveAbilityByHandle(parent.reflected_spell);
  }

  // 复制技能
  const sourceAbility = ability;
  const reflectedAbility = parent.AddAbility(sourceAbility.GetAbilityName());

  // 设置反弹技能的属性
  reflectedAbility.SetLevel(sourceAbility.GetLevel());
  reflectedAbility.SetStolen(true);
  reflectedAbility.SetHidden(true);

  // 设置目标为原施法者
  parent.SetCursorCastTarget(sourceAbility.GetCaster());

  // 释放反弹技能
  const castResult = reflectedAbility.CastAbility();

  // 返还魔法
  if (castResult) {
    parent.GiveMana(sourceAbility.GetManaCost(-1));
  }
  // 记录反弹技能
  // @ts-expect-error 自定义英雄属性
  parent.reflected_spell = reflectedAbility;

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
  parent.EmitSound('Item.LotusOrb.Activate');

  return castResult;
}
