import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { BaseItemModifier } from './base_item_modifier';

@registerAbility()
export class item_curse_of_ages extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return 'modifier_item_curse_of_ages';
  }

  OnSpellStart(): void {
    const caster = this.GetCaster();
    const target = this.GetCursorTarget();
    if (!target) return;

    const stacks = this.GetSpecialValueFor('active_instant_stacks');
    for (let i = 0; i < stacks; i++) {
      target.AddNewModifier(caster, this, 'modifier_item_curse_of_ages_stack', {});
    }
  }
}

@registerModifier('items/ts_items/item_curse_of_ages.lua')
export class modifier_item_curse_of_ages extends BaseItemModifier {
  protected override statsModifierName: string = '';

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.STATS_STRENGTH_BONUS,
      ModifierFunction.STATS_AGILITY_BONUS,
      ModifierFunction.STATS_INTELLECT_BONUS,
      ModifierFunction.PREATTACK_BONUS_DAMAGE,
      ModifierFunction.SPELL_AMPLIFY_PERCENTAGE,
      ModifierFunction.MANA_BONUS,
      ModifierFunction.ON_ATTACK_LANDED,
    ];
  }

  GetModifierBonusStats_Strength(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_strength') ?? 0;
  }

  GetModifierBonusStats_Agility(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_agility') ?? 0;
  }

  GetModifierBonusStats_Intellect(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_intellect') ?? 0;
  }

  GetModifierPreAttack_BonusDamage(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_damage') ?? 0;
  }

  GetModifierSpellAmplify_Percentage(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_spell_amp') ?? 0;
  }

  GetModifierManaBonus(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_mana') ?? 0;
  }

  OnAttackLanded(event: ModifierAttackEvent): void {
    if (!IsServer()) return;
    if (event.attacker !== this.GetParent()) return;
    if (!event.target.IsRealHero()) return;

    event.target.AddNewModifier(
      this.GetParent(),
      this.GetAbility(),
      'modifier_item_curse_of_ages_stack',
      {},
    );
  }
}

@registerModifier('items/ts_items/item_curse_of_ages.lua')
export class modifier_item_curse_of_ages_stack extends BaseModifier {
  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return true;
  }

  GetTexture(): string {
    return 'item_curse_of_ages';
  }

  OnCreated(): void {
    if (IsServer()) {
      this.SetStackCount(1);
    }
  }

  OnRefresh(): void {
    if (IsServer()) {
      if (this.GetStackCount() < 30) {
        this.SetStackCount(this.GetStackCount() + 1);
      }
    }
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.HEALTH_BONUS,
      ModifierFunction.PHYSICAL_ARMOR_BONUS,
      ModifierFunction.MAGICAL_RESISTANCE_BONUS,
    ];
  }

  GetModifierHealthBonus(): number {
    return -(this.GetStackCount() * 80);
  }

  GetModifierPhysicalArmorBonus(): number {
    return -(Math.floor(this.GetStackCount() / 10) * 3);
  }

  GetModifierMagicalResistanceBonus(): number {
    return -(Math.floor(this.GetStackCount() / 20) * 15);
  }
}
