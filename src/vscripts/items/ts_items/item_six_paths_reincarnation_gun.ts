import { BaseItem, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { BaseItemModifier } from './base_item_modifier';

const SHOTGUN_COOLDOWN_MODIFIERS = [
  'modifier_item_shotgun_cooldown',
  'modifier_item_shotgun_v2_cooldown',
  'modifier_item_six_paths_reincarnation_gun_cooldown',
];

const REINCARNATION_DAMAGE_TYPES = [DamageTypes.PHYSICAL, DamageTypes.MAGICAL, DamageTypes.PURE];

function rollReincarnationDamageType(): DamageTypes {
  return REINCARNATION_DAMAGE_TYPES[RandomInt(0, REINCARNATION_DAMAGE_TYPES.length - 1)];
}

function hasShotgunCooldown(unit: CDOTA_BaseNPC): boolean {
  return SHOTGUN_COOLDOWN_MODIFIERS.some((modifierName) => unit.HasModifier(modifierName));
}

// 纯粹伤害不吃护甲，按目标护甲折算出"若是物理攻击本应造成的伤害"作为参照上限，
// 避免后期高护甲目标下纯粹伤害相对物理/魔法伤害差距过大。
function capPureDamageByArmor(
  rawDamage: number,
  target: CDOTA_BaseNPC,
  capMultiplier: number,
): number {
  const armor = target.GetPhysicalArmorValue(false);
  if (armor <= 0) return rawDamage; // 负护甲下物理等效值必然放大，封顶不会生效

  const armorMultiplier = 1 - (0.06 * armor) / (1 + 0.06 * armor);
  return Math.min(rawDamage, rawDamage * armorMultiplier * capMultiplier);
}

@registerAbility('item_six_paths_reincarnation_gun')
export class ItemSixPathsReincarnationGun extends BaseItem {
  GetIntrinsicModifierName(): string {
    return 'modifier_item_six_paths_reincarnation_gun';
  }

  OnSpellStart(): void {
    const caster = this.GetCaster() as CDOTA_BaseNPC_Hero;
    caster.AddNewModifier(caster, this, 'modifier_item_six_paths_reincarnation_gun_active', {
      duration: this.GetSpecialValueFor('active_duration'),
    });
  }
}

@registerModifier(
  'items/ts_items/item_six_paths_reincarnation_gun',
  'modifier_item_six_paths_reincarnation_gun',
)
export class ModifierItemSixPathsReincarnationGun extends BaseItemModifier {
  override statsModifierName = 'modifier_item_six_paths_reincarnation_gun_stats';

  private attackRadius = 400;
  private attackPercent = 45;
  private internalCooldown = 0.05;
  private mageSlayerDuration = 3;
  private spellLifesteal = 30;
  private pureDamageCapMultiplier = 3;

  OnCreated(): void {
    const ability = this.GetAbility();
    if (ability) {
      this.attackRadius = ability.GetSpecialValueFor('attack_radius');
      this.attackPercent = ability.GetSpecialValueFor('attack_percent');
      this.internalCooldown = ability.GetSpecialValueFor('internal_cooldown');
      this.mageSlayerDuration = ability.GetSpecialValueFor('mage_slayer_duration');
      this.spellLifesteal = ability.GetSpecialValueFor('spell_lifesteal');
      this.pureDamageCapMultiplier = ability.GetSpecialValueFor('pure_damage_cap_multiplier');
    }
    super.OnCreated();
  }

  OnRefresh(): void {
    this.OnCreated();
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_ATTACK_LANDED, ModifierFunction.ON_TAKEDAMAGE];
  }

  OnTakeDamage(event: ModifierInstanceEvent): void {
    TsSpellLifeSteal(event, this.spellLifesteal, this.GetParent());
  }

  OnAttackLanded(event: ModifierAttackEvent): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    const ability = this.GetAbility();
    const target = event.target;
    if (!ability || event.attacker !== parent || parent.IsIllusion()) return;
    if (!target || target.IsNull() || target.GetTeamNumber() === parent.GetTeamNumber()) return;
    if (target.IsBuilding() || target.IsOther()) return;

    const debuffDuration = this.mageSlayerDuration * (1 - target.GetStatusResistance());
    target.AddNewModifier(parent, ability, 'modifier_item_six_paths_reincarnation_gun_debuff', {
      duration: debuffDuration,
    });

    // Reuse the original shotgun family's attacker-wide cooldown so simultaneous split arrows
    // and multiple shotgun variants cannot create several splash procs from one attack instant.
    if (hasShotgunCooldown(parent)) return;

    const preReductionAttackDamage = Math.max(event.original_damage, 0);
    if (preReductionAttackDamage <= 0) return;

    parent.AddNewModifier(parent, ability, 'modifier_item_six_paths_reincarnation_gun_cooldown', {
      duration: this.internalCooldown,
    });

    const splashDamage = (preReductionAttackDamage * this.attackPercent) / 100;
    const splashDamageType = rollReincarnationDamageType();
    const enemies = FindUnitsInRadius(
      parent.GetTeamNumber(),
      target.GetAbsOrigin(),
      undefined,
      this.attackRadius,
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO | UnitTargetType.BASIC,
      UnitTargetFlags.NONE,
      FindOrder.ANY,
      false,
    );
    const particle = ParticleManager.CreateParticle(
      'particles/custom/shrapnel.vpcf',
      ParticleAttachment.CUSTOMORIGIN,
      undefined,
    );
    ParticleManager.SetParticleControl(particle, 0, target.GetAbsOrigin());
    ParticleManager.ReleaseParticleIndex(particle);

    for (const enemy of enemies) {
      if (enemy === target) continue;
      if (enemy.IsBuilding() || enemy.IsOther()) continue;
      const damage =
        splashDamageType === DamageTypes.PURE
          ? capPureDamageByArmor(splashDamage, enemy, this.pureDamageCapMultiplier)
          : splashDamage;
      ApplyDamage({
        victim: enemy,
        attacker: parent,
        damage,
        damage_type: splashDamageType,
        damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION + DamageFlag.REFLECTION,
        ability,
      });
    }
  }
}

@registerModifier(
  'items/ts_items/item_six_paths_reincarnation_gun',
  'modifier_item_six_paths_reincarnation_gun_cooldown',
)
export class ModifierItemSixPathsReincarnationGunCooldown extends BaseItemModifier {
  override statsModifierName = '';

  IsHidden(): boolean {
    return true;
  }

  RemoveOnDeath(): boolean {
    return true;
  }
}

@registerModifier(
  'items/ts_items/item_six_paths_reincarnation_gun',
  'modifier_item_six_paths_reincarnation_gun_debuff',
)
export class ModifierItemSixPathsReincarnationGunDebuff extends BaseItemModifier {
  override statsModifierName = '';

  private spellDamageReduction = 30;
  private damagePerType = 90;
  private damageInterval = 1;
  private hasTicked = false; // To prevent the first tick from happening immediately on creation

  OnCreated(): void {
    this.refreshValues();

    if (IsServer()) {
      this.StartIntervalThink(this.damageInterval);
    }
  }

  OnRefresh(): void {
    this.refreshValues();
  }

  private refreshValues(): void {
    const ability = this.GetAbility();
    if (!ability) return;

    this.spellDamageReduction = ability.GetSpecialValueFor('mage_slayer_spell_damage_reduction');
    this.damagePerType = ability.GetSpecialValueFor('mage_slayer_damage_per_type');
    this.damageInterval = ability.GetSpecialValueFor('mage_slayer_damage_interval');
  }

  IsHidden(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return true;
  }

  GetAttributes(): ModifierAttribute {
    return ModifierAttribute.NONE;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.TOTALDAMAGEOUTGOING_PERCENTAGE];
  }

  GetModifierTotalDamageOutgoing_Percentage(event: ModifierAttackEvent): number {
    if (event.attacker === this.GetParent() && event.inflictor) {
      return -this.spellDamageReduction;
    }
    return 0;
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;

    if (!this.hasTicked) {
      this.hasTicked = true;
      return;
    }

    const target = this.GetParent();
    const caster = this.GetCaster();
    const ability = this.GetAbility();
    if (!caster || !ability || !target.IsAlive()) return;

    for (const damageType of [DamageTypes.PHYSICAL, DamageTypes.MAGICAL, DamageTypes.PURE]) {
      ApplyDamage({
        victim: target,
        attacker: caster,
        damage: this.damagePerType,
        damage_type: damageType,
        damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION + DamageFlag.REFLECTION,
        ability,
      });
    }
  }
}

@registerModifier(
  'items/ts_items/item_six_paths_reincarnation_gun',
  'modifier_item_six_paths_reincarnation_gun_active',
)
export class ModifierItemSixPathsReincarnationGunActive extends BaseItemModifier {
  override statsModifierName = '';

  private attackDamageTypes: Record<number, DamageTypes> = {};
  private pureDamageCapMultiplier = 3;

  OnCreated(): void {
    if (IsServer()) {
      this.attackDamageTypes = {};
    }
    const ability = this.GetAbility();
    if (ability) {
      this.pureDamageCapMultiplier = ability.GetSpecialValueFor('pure_damage_cap_multiplier');
    }
  }

  OnRefresh(): void {
    this.OnCreated();
  }

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  GetAttributes(): ModifierAttribute {
    return ModifierAttribute.NONE;
  }

  GetTexture(): string {
    return 'six_paths_reincarnation_gun';
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.ON_ATTACK_RECORD,
      ModifierFunction.ON_ATTACK_LANDED,
      ModifierFunction.ON_ATTACK_RECORD_DESTROY,
      ModifierFunction.TOTALDAMAGEOUTGOING_PERCENTAGE,
    ];
  }

  OnAttackRecord(event: ModifierAttackEvent): void {
    if (!IsServer() || event.attacker !== this.GetParent()) return;
    this.attackDamageTypes[event.record] = rollReincarnationDamageType();
  }

  GetModifierTotalDamageOutgoing_Percentage(event: ModifierAttackEvent): number {
    if (!IsServer()) return 0;
    if (event.attacker !== this.GetParent() || event.damage_category !== DamageCategory.ATTACK) {
      return 0;
    }
    if (event.target.IsBuilding() || event.target.IsOther()) return 0;

    const damageType = this.getOrCreateDamageType(event.record);
    return damageType === DamageTypes.PHYSICAL ? 0 : -100;
  }

  OnAttackLanded(event: ModifierAttackEvent): void {
    if (!IsServer() || event.attacker !== this.GetParent()) return;
    if (event.target.IsBuilding() || event.target.IsOther()) return;

    const damageType = this.getOrCreateDamageType(event.record);
    if (damageType === DamageTypes.PHYSICAL) return;

    const ability = this.GetAbility();
    const target = event.target;
    if (!ability || !target || target.IsNull()) return;

    let convertedDamage = Math.max(event.original_damage, 0);
    if (convertedDamage <= 0) return;

    if (damageType === DamageTypes.PURE) {
      convertedDamage = capPureDamageByArmor(convertedDamage, target, this.pureDamageCapMultiplier);
    }

    ApplyDamage({
      victim: target,
      attacker: this.GetParent(),
      damage: convertedDamage,
      damage_type: damageType,
      damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION + DamageFlag.REFLECTION,
      ability,
    });
  }

  OnAttackRecordDestroy(event: ModifierAttackEvent): void {
    if (!IsServer() || event.attacker !== this.GetParent()) return;
    delete this.attackDamageTypes[event.record];
  }

  private getOrCreateDamageType(record: number): DamageTypes {
    const existing = this.attackDamageTypes[record];
    if (existing !== undefined) return existing;

    const rolled = rollReincarnationDamageType();
    this.attackDamageTypes[record] = rolled;
    return rolled;
  }
}
