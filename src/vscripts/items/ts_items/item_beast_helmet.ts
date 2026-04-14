import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { BaseItemModifier } from './base_item_modifier';

@registerAbility()
export class item_beast_helmet extends BaseAbility {
  OnSpellStart(): void {
    const caster = this.GetCaster();
    const duration = this.GetSpecialValueFor('active_duration');

    caster.AddNewModifier(caster, this, 'modifier_item_beast_helmet_active', {
      duration: duration,
    });
    caster.EmitSound('DOTA_Item.BlackKingBar.Activate');
  }

  GetSharedCooldownName(): string {
    return 'item_black_king_bar';
  }

  GetIntrinsicModifierName(): string {
    return 'modifier_item_beast_helmet';
  }
}

@registerModifier('items/ts_items/item_beast_helmet.lua')
export class modifier_item_beast_helmet extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  GetAttributes(): ModifierAttribute {
    return ModifierAttribute.PERMANENT + ModifierAttribute.MULTIPLE;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.STATS_STRENGTH_BONUS,
      ModifierFunction.STATS_INTELLECT_BONUS,
      ModifierFunction.SPELL_AMPLIFY_PERCENTAGE,
    ];
  }

  GetModifierBonusStats_Strength(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_strength') ?? 0;
  }

  GetModifierBonusStats_Intellect(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_intellect') ?? 0;
  }

  GetModifierSpellAmplify_Percentage(): number {
    const parent = this.GetParent();
    if (parent.IsHero()) {
      const hero = parent as CDOTA_BaseNPC_Hero;
      const intellect = hero.GetIntellect(false);
      const ampPerInt = this.GetAbility()?.GetSpecialValueFor('spell_amp_per_int') ?? 0;
      return intellect * ampPerInt;
    }
    return 0;
  }
}

@registerModifier('items/ts_items/item_beast_helmet.lua')
export class modifier_item_beast_helmet_active extends BaseItemModifier {
  protected override statsModifierName: string = '';
  private isApplyingPureDamage: boolean = false;

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  GetTexture(): string {
    return 'item_beast_helmet';
  }

  GetEffectName(): string {
    return 'particles/items_fx/black_king_bar_avatar.vpcf';
  }

  GetStatusEffectName(): string {
    return 'particles/status_fx/status_effect_avatar.vpcf';
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return {
      [ModifierState.MAGIC_IMMUNE]: true,
    };
  }

  OnCreated(): void {
    super.OnCreated();
    if (IsServer()) {
      this.SendBuffRefreshToClients();
    }
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.MAGICAL_RESISTANCE_BONUS,
      ModifierFunction.PHYSICAL_ARMOR_BONUS,
      ModifierFunction.TOTALDAMAGEOUTGOING_PERCENTAGE,
      ModifierFunction.STATUS_RESISTANCE,
    ];
  }

  GetModifierMagicalResistanceBonus(): number {
    return 100;
  }

  GetModifierPhysicalArmorBonus(): number {
    return 20;
  }

  GetModifierStatusResistance(): number {
    return 100;
  }

  GetModifierTotalDamageOutgoing_Percentage(params: ModifierAttackEvent): number {
    if (!IsServer()) return 0;
    if (this.isApplyingPureDamage) {
      return 0;
    }

    if (params.damage_type !== DamageTypes.PURE && params.damage > 0) {
      if (params.attacker === this.GetParent()) {
        this.isApplyingPureDamage = true;

        ApplyDamage({
          victim: params.target,
          attacker: this.GetParent(),
          damage: params.damage,
          damage_type: DamageTypes.PURE,
          ability: this.GetAbility(),
          damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION | DamageFlag.NO_DAMAGE_MULTIPLIERS,
        });

        this.isApplyingPureDamage = false;
        return -100;
      }
    }

    return 0;
  }
}
