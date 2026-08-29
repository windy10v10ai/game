import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

const BURNING_SPEAR = 'huskar_burning_spear_incendiary_awakened';
const LEGACY_PURE_DAMAGE_TALENT = 'special_bonus_unique_huskar_5';
const INCENDIARY_FACET = 'huskar_nothl_conflagration';
const NATIVE_BURN_DEBUFF = 'modifier_huskar_burning_spear_debuff';
const NATIVE_BURN_COUNTER = 'modifier_huskar_burning_spear_counter';
const PURE_BURN_DEBUFF = 'modifier_huskar_burning_spear_incendiary_awakened_debuff';
const ROSHAN_UNIT_NAME = 'npc_dota_roshan';
const AWAKEN_ICON = 'huskar_burning_spear';
const PURE_DAMAGE_LOG_SAMPLE_LIMIT = 5;
const BURN_INTERVAL = 1;

@registerAbility('special_bonus_unique_huskar_incendiary_awaken')
export class SpecialBonusUniqueHuskarIncendiaryAwaken extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_huskar_incendiary_awaken.name;
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_huskar_incendiary_awaken')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_huskar_incendiary_awaken extends BaseModifier {
  private pureDamageLogSamples = 0;

  OnCreated(): void {
    if (!IsServer()) return;

    const legacyTalent = this.GetParent().FindAbilityByName(LEGACY_PURE_DAMAGE_TALENT);
    if (legacyTalent !== undefined && legacyTalent.GetLevel() === 0) {
      legacyTalent.SetLevel(1);
    }

    const incendiaryFacet = this.GetParent().FindAbilityByName(INCENDIARY_FACET);
    if (incendiaryFacet !== undefined && incendiaryFacet.GetLevel() === 0) {
      incendiaryFacet.SetLevel(1);
    }
  }

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  GetTexture(): string {
    return AWAKEN_ICON;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.ON_MODIFIER_ADDED,
      ModifierFunction.ON_MODIFIER_REFRESHED,
      ModifierFunction.ON_TAKEDAMAGE,
    ];
  }

  OnModifierAdded(event: ModifierAddedEvent): void {
    this.syncPureBurnFromNativeDebuff(event);
  }

  OnModifierRefreshed(event: ModifierAddedEvent): void {
    this.syncPureBurnFromNativeDebuff(event);
  }

  private syncPureBurnFromNativeDebuff(event: ModifierAddedEvent): void {
    if (!IsServer() || event.added_buff.GetName() !== NATIVE_BURN_DEBUFF) return;

    const parent = this.GetParent();
    const ability = this.GetAbility();
    const target = event.unit;
    const nativeAbility = event.added_buff.GetAbility();
    if (
      parent.IsIllusion() ||
      !ability ||
      ability.IsNull() ||
      !nativeAbility ||
      nativeAbility.IsNull() ||
      nativeAbility.GetAbilityName() !== BURNING_SPEAR ||
      event.added_buff.GetCaster() !== parent ||
      !target ||
      target.IsNull()
    ) {
      return;
    }

    // 计数器和伤害层数在同一攻击事件内更新，下一帧读取最终状态。
    Timers.CreateTimer(0, () => {
      if (this.IsNull() || parent.IsNull() || target.IsNull() || !target.IsAlive()) return;

      const nativeDebuff = target.FindModifierByNameAndCaster(NATIVE_BURN_DEBUFF, parent);
      if (!nativeDebuff || nativeDebuff.IsNull()) return;

      const nativeCounter = target.FindModifierByNameAndCaster(NATIVE_BURN_COUNTER, parent);
      const stacks = Math.max(
        1,
        nativeDebuff.GetStackCount(),
        nativeCounter && !nativeCounter.IsNull() ? nativeCounter.GetStackCount() : 0,
      );
      const duration = Math.max(0, nativeDebuff.GetRemainingTime());
      const existing = target.FindModifierByNameAndCaster(PURE_BURN_DEBUFF, parent);

      if (existing && !existing.IsNull()) {
        existing.SetDuration(duration, true);
        existing.SetStackCount(stacks);
        existing.ForceRefresh();
        return;
      }

      const pureBurn = target.AddNewModifier(parent, nativeAbility, PURE_BURN_DEBUFF, { duration });
      pureBurn?.SetStackCount(stacks);
    });
  }

  OnTakeDamage(event: ModifierInstanceEvent): void {
    if (!IsServer() || this.pureDamageLogSamples >= PURE_DAMAGE_LOG_SAMPLE_LIMIT) return;

    const parent = this.GetParent();
    const target = event.unit;
    const inflictor = event.inflictor;
    if (
      event.attacker !== parent ||
      !target ||
      target.IsNull() ||
      !inflictor ||
      inflictor.IsNull() ||
      inflictor.GetAbilityName() !== BURNING_SPEAR
    ) {
      return;
    }

    this.pureDamageLogSamples += 1;
    const actualDamageType = event.damage_type;
    const isPure = actualDamageType === DamageTypes.PURE;
    const incendiary = parent.FindAbilityByName(INCENDIARY_FACET);
    const maxHealthBurnPct = inflictor.GetSpecialValueFor('pure_burn_damage_max_pct');
    print(
      `[HuskarAwakenPureDamageTest] sample=${this.pureDamageLogSamples}/${PURE_DAMAGE_LOG_SAMPLE_LIMIT} ability=${inflictor.GetAbilityName()} victim=${target.GetUnitName()} damage=${event.damage} original_damage=${event.original_damage} damage_type=${actualDamageType} expected_pure=${DamageTypes.PURE} is_pure=${isPure ? 1 : 0} incendiary_level=${incendiary?.GetLevel() ?? 0} max_health_burn_pct=${maxHealthBurnPct}`,
    );
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_huskar_incendiary_awaken')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_huskar_burning_spear_incendiary_awakened_debuff extends BaseModifier {
  private burnDamage = 0;
  private maxHealthBurnPct = 0;

  OnCreated(): void {
    this.refreshValues();
    if (IsServer()) this.StartIntervalThink(BURN_INTERVAL);
  }

  OnRefresh(): void {
    this.refreshValues();
  }

  private refreshValues(): void {
    const ability = this.GetAbility();
    if (!ability || ability.IsNull()) return;

    this.burnDamage = ability.GetSpecialValueFor('pure_burn_damage');
    this.maxHealthBurnPct = ability.GetSpecialValueFor('pure_burn_damage_max_pct');
  }

  IsHidden(): boolean {
    return true;
  }

  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return true;
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;

    const target = this.GetParent();
    const caster = this.GetCaster();
    const ability = this.GetAbility();
    if (!caster || caster.IsNull() || !ability || ability.IsNull() || !target.IsAlive()) return;

    const maxHealthBurn =
      target.GetUnitName() === ROSHAN_UNIT_NAME
        ? 0
        : (target.GetMaxHealth() * this.maxHealthBurnPct) / 100;
    const damagePerStack = this.burnDamage + maxHealthBurn;
    ApplyDamage({
      victim: target,
      attacker: caster,
      damage: damagePerStack * Math.max(1, this.GetStackCount()),
      damage_type: DamageTypes.PURE,
      ability,
    });
  }
}
