import { BaseItem, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { BaseItemModifier } from './base_item_modifier';

const DAMAGE_TYPE_PHYSICAL = 1;
const DAMAGE_TYPE_MAGICAL = 2;
const DAMAGE_TYPE_PURE = 3;

const SHOTGUN_COOLDOWN_MODIFIERS = [
  'modifier_item_shotgun_cooldown',
  'modifier_item_shotgun_v2_cooldown',
  'modifier_item_six_paths_reincarnation_gun_cooldown',
];

type ReincarnationDamageType = 1 | 2 | 3;

function rollReincarnationDamageType(): ReincarnationDamageType {
  return RandomInt(DAMAGE_TYPE_PHYSICAL, DAMAGE_TYPE_PURE) as ReincarnationDamageType;
}

function toDotaDamageType(damageType: ReincarnationDamageType): DamageTypes {
  if (damageType === DAMAGE_TYPE_MAGICAL) return DamageTypes.MAGICAL;
  if (damageType === DAMAGE_TYPE_PURE) return DamageTypes.PURE;
  return DamageTypes.PHYSICAL;
}

function hasShotgunCooldown(unit: CDOTA_BaseNPC): boolean {
  return SHOTGUN_COOLDOWN_MODIFIERS.some((modifierName) => unit.HasModifier(modifierName));
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
  private attackPercent = 60;
  private internalCooldown = 0.05;
  private mageSlayerDuration = 3;
  private spellLifesteal = 42;

  OnCreated(): void {
    const ability = this.GetAbility();
    if (ability) {
      this.attackRadius = ability.GetSpecialValueFor('attack_radius');
      this.attackPercent = ability.GetSpecialValueFor('attack_percent');
      this.internalCooldown = ability.GetSpecialValueFor('internal_cooldown');
      this.mageSlayerDuration = ability.GetSpecialValueFor('mage_slayer_duration');
      this.spellLifesteal = ability.GetSpecialValueFor('spell_lifesteal');
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
    const splashDamageType = toDotaDamageType(rollReincarnationDamageType());
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
      if (enemy.IsBuilding() || enemy.IsOther()) continue;
      ApplyDamage({
        victim: enemy,
        attacker: parent,
        damage: splashDamage,
        damage_type: splashDamageType,
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

  private spellDamageReduction = 50;
  private damagePerType = 200;
  private damageInterval = 1;

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

  private attackDamageTypes: Record<number, ReincarnationDamageType> = {};

  OnCreated(): void {
    if (IsServer()) {
      this.attackDamageTypes = {};
    }
  }

  OnRefresh(): void {
    if (IsServer()) {
      this.attackDamageTypes = {};
    }
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

    const damageType = this.getOrCreateDamageType(event.record);
    return damageType === DAMAGE_TYPE_PHYSICAL ? 0 : -100;
  }

  OnAttackLanded(event: ModifierAttackEvent): void {
    if (!IsServer() || event.attacker !== this.GetParent()) return;

    const damageType = this.getOrCreateDamageType(event.record);
    if (damageType === DAMAGE_TYPE_PHYSICAL) return;

    const ability = this.GetAbility();
    if (!ability || !event.target || event.target.IsNull()) return;

    const convertedDamage = Math.max(event.original_damage, 0);
    if (convertedDamage <= 0) return;

    ApplyDamage({
      victim: event.target,
      attacker: this.GetParent(),
      damage: convertedDamage,
      damage_type: toDotaDamageType(damageType),
      ability,
    });
  }

  OnAttackRecordDestroy(event: ModifierAttackEvent): void {
    if (!IsServer() || event.attacker !== this.GetParent()) return;
    delete this.attackDamageTypes[event.record];
  }

  private getOrCreateDamageType(record: number): ReincarnationDamageType {
    const existing = this.attackDamageTypes[record];
    if (existing !== undefined) return existing;

    const rolled = rollReincarnationDamageType();
    this.attackDamageTypes[record] = rolled;
    return rolled;
  }
}
