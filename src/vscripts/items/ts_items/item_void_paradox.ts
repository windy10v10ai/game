import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { BaseItemModifier } from './base_item_modifier';

@registerAbility()
export class item_void_paradox extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return 'modifier_item_void_paradox';
  }

  OnSpellStart(): void {
    const caster = this.GetCaster();
    const mod = caster.FindModifierByName('modifier_item_void_paradox') as
      | modifier_item_void_paradox
      | undefined;
    const stacks = mod ? mod.GetStackCount() : 0;

    const duration = this.GetSpecialValueFor('active_duration');
    caster.AddNewModifier(caster, this, 'modifier_item_void_paradox_active', {
      duration: duration,
      stacks: stacks,
    });
  }
}

@registerModifier('items/ts_items/item_void_paradox.lua')
export class modifier_item_void_paradox extends BaseItemModifier {
  protected override statsModifierName: string = '';

  IsHidden(): boolean {
    return false;
  }

  GetTexture(): string {
    return 'item_void_paradox';
  }

  OnCreated(): void {
    super.OnCreated();
    if (IsServer()) {
      this.SetStackCount(0);
    }
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.STATS_STRENGTH_BONUS,
      ModifierFunction.STATS_AGILITY_BONUS,
      ModifierFunction.STATS_INTELLECT_BONUS,
      ModifierFunction.HEALTH_BONUS,
      ModifierFunction.HEALTH_REGEN_CONSTANT,
      ModifierFunction.PHYSICAL_ARMOR_BONUS,
      ModifierFunction.SPELL_AMPLIFY_PERCENTAGE,
      ModifierFunction.PREATTACK_BONUS_DAMAGE,
      ModifierFunction.ON_DEATH,
    ];
  }

  GetModifierBonusStats_Strength(): number {
    const base = this.GetAbility()?.GetSpecialValueFor('bonus_strength') ?? 0;
    const perDeath = this.GetAbility()?.GetSpecialValueFor('stats_per_death') ?? 0;
    return base + this.GetStackCount() * perDeath;
  }

  GetModifierBonusStats_Agility(): number {
    const perDeath = this.GetAbility()?.GetSpecialValueFor('stats_per_death') ?? 0;
    return this.GetStackCount() * perDeath;
  }

  GetModifierBonusStats_Intellect(): number {
    const perDeath = this.GetAbility()?.GetSpecialValueFor('stats_per_death') ?? 0;
    return this.GetStackCount() * perDeath;
  }

  GetModifierHealthBonus(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_health') ?? 0;
  }

  GetModifierConstantHealthRegen(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_health_regen') ?? 0;
  }

  GetModifierPhysicalArmorBonus(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_armor') ?? 0;
  }

  GetModifierSpellAmplify_Percentage(): number {
    const base = this.GetAbility()?.GetSpecialValueFor('bonus_spell_amp') ?? 0;
    const perDeath = this.GetAbility()?.GetSpecialValueFor('spell_amp_per_death') ?? 0;
    return base + this.GetStackCount() * perDeath;
  }

  GetModifierPreAttack_BonusDamage(): number {
    const perDeath = this.GetAbility()?.GetSpecialValueFor('damage_per_death') ?? 0;
    return this.GetStackCount() * perDeath;
  }

  OnDeath(event: ModifierInstanceEvent): void {
    if (!IsServer()) return;
    if (event.unit !== this.GetParent()) return;
    this.SetStackCount(this.GetStackCount() + 1);
    this.SendBuffRefreshToClients();
  }
}

@registerModifier('items/ts_items/item_void_paradox.lua')
export class modifier_item_void_paradox_active extends BaseModifier {
  private doubledStacks: number = 0;

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  GetTexture(): string {
    return 'item_void_paradox';
  }

  OnCreated(params: { stacks?: number }): void {
    if (IsServer()) {
      this.doubledStacks = params.stacks ?? 0;
    }
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.STATS_STRENGTH_BONUS,
      ModifierFunction.STATS_AGILITY_BONUS,
      ModifierFunction.STATS_INTELLECT_BONUS,
      ModifierFunction.PREATTACK_BONUS_DAMAGE,
      ModifierFunction.SPELL_AMPLIFY_PERCENTAGE,
    ];
  }

  GetModifierBonusStats_Strength(): number {
    const perDeath = this.GetAbility()?.GetSpecialValueFor('stats_per_death') ?? 0;
    return this.doubledStacks * perDeath;
  }

  GetModifierBonusStats_Agility(): number {
    const perDeath = this.GetAbility()?.GetSpecialValueFor('stats_per_death') ?? 0;
    return this.doubledStacks * perDeath;
  }

  GetModifierBonusStats_Intellect(): number {
    const perDeath = this.GetAbility()?.GetSpecialValueFor('stats_per_death') ?? 0;
    return this.doubledStacks * perDeath;
  }

  GetModifierPreAttack_BonusDamage(): number {
    const perDeath = this.GetAbility()?.GetSpecialValueFor('damage_per_death') ?? 0;
    return this.doubledStacks * perDeath;
  }

  GetModifierSpellAmplify_Percentage(): number {
    const perDeath = this.GetAbility()?.GetSpecialValueFor('spell_amp_per_death') ?? 0;
    return this.doubledStacks * perDeath;
  }
}
