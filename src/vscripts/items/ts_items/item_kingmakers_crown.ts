import {
  BaseItem,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { BaseItemModifier } from './base_item_modifier';

@registerAbility('item_kingmakers_crown')
export class ItemKingmakersCrown extends BaseItem {
  GetIntrinsicModifierName(): string {
    return 'modifier_item_kingmakers_crown';
  }
}

/**
 * Main Item Modifier
 * Provides base stats and handles the 1200 radius "Vladimir's Cuirass" style aura.
 */
@registerModifier('items/ts_items/item_kingmakers_crown', 'modifier_item_kingmakers_crown')
export class ModifierItemKingmakersCrown extends BaseItemModifier {
  override statsModifierName: string = '';

  OnCreated(): void {
    if (IsServer()) {
      // Add the global aura emitter
      this.GetCaster()?.AddNewModifier(
        this.GetCaster(),
        this.GetAbility(),
        'modifier_item_kingmakers_crown_global_emitter',
        {},
      );
    }
  }

  OnDestroy(): void {
    if (IsServer()) {
      this.GetCaster()?.RemoveModifierByName('modifier_item_kingmakers_crown_global_emitter');
    }
  }

  // Aura settings (Standard 1200 radius)
  IsAura(): boolean {
    return true;
  }

  GetAuraRadius(): number {
    return this.GetAbility()?.GetSpecialValueFor('aura_radius') ?? 1200;
  }

  GetAuraSearchTeam(): UnitTargetTeam {
    return UnitTargetTeam.BOTH;
  }

  GetAuraSearchType(): UnitTargetType {
    return UnitTargetType.HERO | UnitTargetType.BASIC | UnitTargetType.BUILDING;
  }

  GetModifierAura(): string {
    return 'modifier_item_kingmakers_crown_vlad_aura';
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.PREATTACK_BONUS_DAMAGE,
      ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
      ModifierFunction.PHYSICAL_ARMOR_BONUS,
      ModifierFunction.STATS_STRENGTH_BONUS,
      ModifierFunction.STATS_AGILITY_BONUS,
      ModifierFunction.STATS_INTELLECT_BONUS,
    ];
  }

  GetModifierPreAttack_BonusDamage(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_damage') ?? 0;
  }

  GetModifierAttackSpeedBonus_Constant(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_attack_speed') ?? 0;
  }

  GetModifierPhysicalArmorBonus(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_armor') ?? 0;
  }

  GetModifierBonusStats_Strength(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_all_stats') ?? 0;
  }

  GetModifierBonusStats_Agility(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_all_stats') ?? 0;
  }

  GetModifierBonusStats_Intellect(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_all_stats') ?? 0;
  }
}

/**
 * Vladimir-style Aura Modifier (Radius 1200)
 * Affects heroes, creeps, and buildings.
 */
@registerModifier(
  'items/ts_items/item_kingmakers_crown',
  'modifier_item_kingmakers_crown_vlad_aura',
)
export class ModifierItemKingmakersCrownVladAura extends BaseModifier {
  IsHidden(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return this.GetParent().GetTeamNumber() !== this.GetCaster()?.GetTeamNumber();
  }

  IsPurgable(): boolean {
    return false;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
      ModifierFunction.PHYSICAL_ARMOR_BONUS,
      ModifierFunction.BASEDAMAGEOUTGOING_PERCENTAGE,
      ModifierFunction.MANA_REGEN_CONSTANT,
      ModifierFunction.ON_ATTACK_LANDED,
    ];
  }

  GetModifierAttackSpeedBonus_Constant(): number {
    if (this.IsDebuff()) return 0;
    return this.GetAbility()?.GetSpecialValueFor('aura_attack_speed') ?? 0;
  }

  GetModifierPhysicalArmorBonus(): number {
    const ability = this.GetAbility();
    if (!ability) return 0;

    if (this.IsDebuff()) {
      return ability.GetSpecialValueFor('aura_negative_armor');
    }
    return ability.GetSpecialValueFor('aura_armor');
  }

  GetModifierBaseDamageOutgoing_Percentage(): number {
    if (this.IsDebuff()) return 0;
    return this.GetAbility()?.GetSpecialValueFor('damage_aura') ?? 0;
  }

  GetModifierManaRegenConstant(): number {
    if (this.IsDebuff()) return 0;
    return this.GetAbility()?.GetSpecialValueFor('mana_regen_aura') ?? 0;
  }

  OnAttackLanded(event: ModifierAttackEvent): void {
    if (!IsServer()) return;
    if (event.attacker !== this.GetParent()) return;
    if (this.IsDebuff()) return;

    // Lifesteal logic
    const lifestealPct = this.GetAbility()?.GetSpecialValueFor('vampiric_aura') ?? 0;
    if (lifestealPct > 0 && event.damage > 0) {
      const heal = event.damage * (lifestealPct / 100);
      event.attacker.Heal(heal, this.GetAbility());

      const particle = ParticleManager.CreateParticle(
        'particles/generic_gameplay/generic_lifesteal.vpcf',
        ParticleAttachment.ABSORIGIN_FOLLOW,
        event.attacker,
      );
      ParticleManager.ReleaseParticleIndex(particle);
    }
  }
}

/**
 * Global Aura Emitter for Lane Creeps
 */
@registerModifier(
  'items/ts_items/item_kingmakers_crown',
  'modifier_item_kingmakers_crown_global_emitter',
)
export class ModifierItemKingmakersCrownGlobalEmitter extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return true;
  }

  IsAura(): boolean {
    return true;
  }

  GetAuraRadius(): number {
    return FIND_UNITS_EVERYWHERE;
  }

  GetAuraSearchTeam(): UnitTargetTeam {
    return UnitTargetTeam.FRIENDLY;
  }

  GetAuraSearchType(): UnitTargetType {
    return UnitTargetType.BASIC;
  }

  GetModifierAura(): string {
    return 'modifier_item_kingmakers_crown_global_aura';
  }

  GetAuraEntityReject(entity: CDOTA_BaseNPC): boolean {
    return !this.IsLaneCreep(entity);
  }

  private IsLaneCreep(unit: CDOTA_BaseNPC): boolean {
    const name = unit.GetUnitName();
    const entName = unit.GetName();
    // Support custom names from manager and standard dota names
    return (
      name === 'npc_dota_creep_lane' ||
      name === 'npc_dota_creep_siege' ||
      entName === 'npc_dota_creep_lane' ||
      entName === 'npc_dota_creep_siege' ||
      name.indexOf('npc_dota_creep_goodguys') !== -1 ||
      name.indexOf('npc_dota_creep_badguys') !== -1
    );
  }
}

/**
 * Global Inheritance Aura Modifier (Only Lane Creeps)
 * Now also amplifies time-based scaling by 30% and adds 50% magic resistance.
 */
@registerModifier(
  'items/ts_items/item_kingmakers_crown',
  'modifier_item_kingmakers_crown_global_aura',
)
export class ModifierItemKingmakersCrownGlobalAura extends BaseModifier {
  private ampHP: number = 0;
  private ampDamage: number = 0;
  private ampReduction: number = 0;

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  OnCreated(): void {
    if (IsServer()) {
      this.StartIntervalThink(1.0);
    }
  }

  OnIntervalThink(): void {
    const parent = this.GetParent();
    const caster = this.GetCaster();
    if (!parent || !caster || !caster.IsHero()) return;

    const hero = caster as CDOTA_BaseNPC_Hero;
    const pct = this.GetAbility()?.GetSpecialValueFor('stat_inheritance_percent') ?? 10;

    // 1. Hero Stat Inheritance (Base Logic)
    const baseInheritDamage = hero.GetAverageTrueAttackDamage(undefined) * (pct / 100);
    this.SetStackCount(Math.floor(baseInheritDamage));

    // 2. Time Scaling Amplification (30%)
    // Identify creep buff ability and tier
    let buffAbility = parent.FindAbilityByName('creep_buff');
    if (!buffAbility) buffAbility = parent.FindAbilityByName('creep_buff_upgraded');
    if (!buffAbility) buffAbility = parent.FindAbilityByName('creep_buff_mega');

    if (buffAbility && buffAbility.GetLevel() > 0) {
      const level = buffAbility.GetLevel();

      // Damage Amp
      const scalingDamage = buffAbility.GetSpecialValueFor('bonus_damage');
      this.ampDamage = scalingDamage * 0.3;

      // Reduction Amp
      const scalingReduction = buffAbility.GetSpecialValueFor('damage_reduction');
      this.ampReduction = scalingReduction * 0.1;

      // HP Amp (Reverse formula from CreepBuffManager)
      // ScaledHP = BaseHP * (1 + 0.05 * level) + 100 * level
      const currentBaseMaxHP = parent.GetBaseMaxHealth();
      const originalBaseHP = (currentBaseMaxHP - 100 * level) / (1 + 0.05 * level);
      const scalingHP = currentBaseMaxHP - originalBaseHP;
      this.ampHP = scalingHP * 0.3;
    } else {
      this.ampHP = 0;
      this.ampDamage = 0;
      this.ampReduction = 0;
    }
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.EXTRA_HEALTH_BONUS,
      ModifierFunction.PREATTACK_BONUS_DAMAGE,
      ModifierFunction.INCOMING_DAMAGE_PERCENTAGE,
      ModifierFunction.MAGICAL_RESISTANCE_BONUS,
    ];
  }

  GetModifierExtraHealthBonus(): number {
    const caster = this.GetCaster();
    if (!caster || !caster.IsHero()) return 0;

    const pct = this.GetAbility()?.GetSpecialValueFor('stat_inheritance_percent') ?? 10;
    const inheritHP = caster.GetMaxHealth() * (pct / 100);

    return inheritHP + this.ampHP;
  }

  GetModifierPreAttack_BonusDamage(): number {
    return this.GetStackCount() + this.ampDamage;
  }

  GetModifierIncomingDamage_Percentage(): number {
    return this.ampReduction;
  }

  GetModifierMagicalResistanceBonus(): number {
    return 50;
  }
}
