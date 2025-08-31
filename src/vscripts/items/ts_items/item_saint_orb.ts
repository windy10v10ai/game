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

    // 添加林肯特效
    target.AddNewModifier(caster, this, 'modifier_item_saint_orb_buff', { duration });

    // 添加莲花效果
    target.AddNewModifier(caster, this, 'modifier_item_lotus_orb_active', { duration });
  }
}

@registerModifier('modifier_item_saint_orb_passive')
export class ModifierItemSaintOrbPassive extends BaseItemModifier {
  override statsModifierName: string = 'modifier_item_saint_orb_stats';

  private bonusMana: number = 0;
  private hpRegen: number = 0;
  private manaRegen: number = 0;
  private healBonus: number = 0;

  OnCreated(): void {
    super.OnCreated();

    if (this.GetAbility()) {
      const ability = this.GetAbility() as ItemSaintOrb;
      this.bonusMana = ability.GetSpecialValueFor('bonus_mana');
      this.hpRegen = ability.GetSpecialValueFor('hp_re');
      this.manaRegen = ability.GetSpecialValueFor('mana_re');
      this.healBonus = ability.GetSpecialValueFor('heal_bonus');
    }
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.HP_REGEN_AMPLIFY_PERCENTAGE,
      ModifierFunction.LIFESTEAL_AMPLIFY_PERCENTAGE,
      ModifierFunction.HEALTH_REGEN_CONSTANT,
      ModifierFunction.MANA_BONUS,
      ModifierFunction.MANA_REGEN_CONSTANT,
    ];
  }

  GetModifierConstantManaRegen(): number {
    return this.manaRegen;
  }

  GetModifierManaBonus(): number {
    return this.bonusMana;
  }

  GetModifierConstantHealthRegen(): number {
    return this.hpRegen;
  }

  GetModifierHPRegenAmplify_Percentage(): number {
    return this.healBonus;
  }

  GetModifierLifestealRegenAmplify_Percentage(): number {
    return this.healBonus;
  }
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
    return [ModifierFunction.ABSORB_SPELL];
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
    if (!IsServer()) return 0;

    const caster = keys.ability.GetCaster();
    if (IsSameTeam(caster, this.GetParent())) {
      // 不反弹队友技能
      return 0;
    }

    // 创建吸收特效
    const particle = ParticleManager.CreateParticle(
      'particles/units/heroes/hero_templar_assassin/templar_loadout.vpcf',
      ParticleAttachment.ABSORIGIN_FOLLOW,
      this.GetParent(),
    );

    const parentPos = this.GetParent().GetAbsOrigin();
    ParticleManager.SetParticleControl(particle, 0, parentPos);
    ParticleManager.SetParticleControl(particle, 1, parentPos);
    ParticleManager.SetParticleControl(particle, 2, Vector(10, 10, 10));
    ParticleManager.ReleaseParticleIndex(particle);

    // 治疗效果
    const ability = this.GetAbility();
    if (!ability) return 0;

    const healPercent = ability.GetSpecialValueFor('heal');
    const healAmount = this.GetParent().GetMaxHealth() * healPercent * 0.01;
    this.GetParent().Heal(healAmount, ability);

    SendOverheadEventMessage(
      undefined,
      OverheadAlert.HEAL,
      this.GetParent(),
      healAmount,
      undefined,
    );

    this.Destroy();
    return 1;
  }
}
