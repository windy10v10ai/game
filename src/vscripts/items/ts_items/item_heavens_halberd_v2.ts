import { BaseItem, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { BaseItemModifier } from './base_item_modifier';

@registerAbility('item_heavens_halberd_v2')
export class ItemHeavensHalberdV2 extends BaseItem {
  GetIntrinsicModifierName(): string {
    return 'modifier_item_heavens_halberd_v2';
  }

  OnSpellStart(): void {
    const caster = this.GetCaster() as CDOTA_BaseNPC_Hero;
    caster.EmitSound('DOTA_Item.MeteorHammer.Cast');

    // 创建特效
    const particle = ParticleManager.CreateParticle(
      'particles/neutral_fx/roshan_slam.vpcf',
      ParticleAttachment.POINT,
      caster,
    );
    const origin = caster.GetAbsOrigin();
    ParticleManager.SetParticleControl(particle, 0, origin);
    ParticleManager.SetParticleControl(particle, 1, origin);
    ParticleManager.SetParticleControl(particle, 2, origin);
    ParticleManager.SetParticleControl(particle, 3, origin);
    ParticleManager.ReleaseParticleIndex(particle);

    caster.StartGesture(GameActivity.DOTA_TELEPORT_END);

    // 计算缴械持续时间
    const durBase = this.GetSpecialValueFor('disarm_con_base');
    const durStr = caster.GetStrength() / this.GetSpecialValueFor('disarm_con_per_str');
    const durMax = this.GetSpecialValueFor('disarm_con_max');
    const dur = Math.min(durBase + durStr, durMax);

    const knockbackRange = this.GetSpecialValueFor('knockback_range');
    const knockbackDistance = this.GetSpecialValueFor('knockback_distance');

    // 寻找范围内的敌人
    const enemies = FindUnitsInRadius(
      caster.GetTeamNumber(),
      caster.GetAbsOrigin(),
      undefined,
      knockbackRange,
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO | UnitTargetType.BASIC,
      UnitTargetFlags.NONE,
      FindOrder.ANY,
      false,
    );

    // 对每个敌人施加击退和缴械效果
    for (const enemy of enemies) {
      const knockback = {
        should_stun: 0.01,
        knockback_duration: 0.5,
        duration: 0.5,
        knockback_distance: knockbackDistance,
        knockback_height: 100,
        center_x: caster.GetAbsOrigin().x,
        center_y: caster.GetAbsOrigin().y,
        center_z: caster.GetAbsOrigin().z,
      };

      enemy.AddNewModifier(enemy, this, 'modifier_knockback', knockback);
      const finalDur = dur * (1 - enemy.GetStatusResistance());
      enemy.AddNewModifier(enemy, this, 'modifier_heavens_halberd_debuff', {
        duration: finalDur,
      });
    }
  }
}

@registerModifier('modifier_item_heavens_halberd_v2', 'items/ts_items/item_heavens_halberd_v2')
export class ModifierItemHeavensHalberdV2 extends BaseItemModifier {
  override statsModifierName: string = 'modifier_item_heavens_halberd_v2_stats';

  private ability: ItemHeavensHalberdV2;
  private disarmed: boolean = true;
  private cd: number = 5;
  private bonusEvasion: number;
  private hpRegenAmp: number;
  private attch: number;
  private disarm: number;
  private statusResistance: number;
  private spellResist: number;
  private spellLifesteal: number;
  private mpRe: number;

  OnCreated(): void {
    this.ability = this.GetAbility() as ItemHeavensHalberdV2;

    this.bonusEvasion = this.ability.GetSpecialValueFor('bonus_evasion');
    this.hpRegenAmp = this.ability.GetSpecialValueFor('hp_regen_amp');
    this.attch = this.ability.GetSpecialValueFor('attch');
    this.disarm = this.ability.GetSpecialValueFor('disarm');
    this.statusResistance = this.ability.GetSpecialValueFor('status_resistance');
    this.spellResist = this.ability.GetSpecialValueFor('spell_resist');
    this.spellLifesteal = this.ability.GetSpecialValueFor('spell_lifesteal');
    this.mpRe = this.ability.GetSpecialValueFor('mana_re');

    super.OnCreated();
  }

  OnTakeDamage(event: ModifierInstanceEvent): void {
    TsSpellLifeSteal(event, this.spellLifesteal, this.GetParent());
  }

  OnIntervalThink(): void {
    this.disarmed = true;
    this.StartIntervalThink(-1);
  }

  OnAttackLanded(event: ModifierAttackEvent): void {
    if (!IsServer()) return;
    if (!this.disarmed) return;

    if (
      event.attacker === this.GetParent() &&
      !event.attacker.IsIllusion() &&
      !event.target.IsBuilding() &&
      !event.target.IsMagicImmune()
    ) {
      if (RollPseudoRandomPercentage(this.attch, 0, this.ability.GetCaster())) {
        if (this.disarmed) {
          this.disarmed = false;
          this.StartIntervalThink(this.cd);

          const duration = this.disarm * (1 - event.target.GetStatusResistance());
          event.target.AddNewModifier(
            this.GetParent(),
            this.ability,
            'modifier_heavens_halberd_debuff',
            {
              duration: duration,
            },
          );
        }
      }
    }
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.EVASION_CONSTANT,
      ModifierFunction.HP_REGEN_AMPLIFY_PERCENTAGE,
      ModifierFunction.HEAL_AMPLIFY_PERCENTAGE_TARGET,
      ModifierFunction.STATUS_RESISTANCE_STACKING,
      ModifierFunction.MAGICAL_RESISTANCE_BONUS,
      ModifierFunction.MANA_REGEN_CONSTANT,
      ModifierFunction.ON_ATTACK_LANDED,
      ModifierFunction.ON_TAKEDAMAGE,
    ];
  }

  GetModifierEvasion_Constant(): number {
    return this.bonusEvasion;
  }

  GetModifierHPRegenAmplify_Percentage(): number {
    return this.hpRegenAmp;
  }

  GetModifierConstantManaRegen(): number {
    return this.mpRe;
  }

  GetModifierHealAmplify_PercentageTarget(): number {
    return this.hpRegenAmp;
  }

  GetModifierStatusResistanceStacking(): number {
    return this.statusResistance;
  }

  GetModifierMagicalResistanceBonus(): number {
    return this.spellResist;
  }
}
