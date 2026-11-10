import { ModifierEventHub } from '../../modules/modifier-event/modifier-event-hub';
import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import {
  CentaurDamageSample,
  calculateNormalDoubleEdgeDamage,
  calculateShieldAmount,
  calculateStoredDamage,
  filterRecentDamage,
  mergeShieldAmount,
  sumRecentDamage,
} from './centaur-awaken-math';

const DOUBLE_EDGE_ABILITY = 'centaur_double_edge';
const EDGE_DAMAGE_KEY = 'edge_damage';
const STACK_REFRESH_INTERVAL = 0.5;

interface CentaurShieldParams {
  shield?: number;
}

/** 半人马战行者 觉醒 */
@registerAbility('special_bonus_unique_centaur_upgrade')
export class SpecialBonusUniqueCentaurUpgrade extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_centaur_upgrade.name;
  }
}

/** 技能本身隐藏不进技能栏，常驻图标的层数显示当前反击之力 */
@registerModifier('abilities/ts_abilities/special_bonus_unique_centaur_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_centaur_upgrade extends BaseModifier {
  private samples: CentaurDamageSample[] = [];
  private settling = false;

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
    return DOUBLE_EDGE_ABILITY;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.OVERRIDE_ABILITY_SPECIAL,
      ModifierFunction.OVERRIDE_ABILITY_SPECIAL_VALUE,
      ModifierFunction.TOOLTIP,
    ];
  }

  OnTooltip(): number {
    return this.GetStackCount();
  }

  OnCreated(): void {
    if (!IsServer()) return;
    const parent = this.GetParent();
    ModifierEventHub.RegisterDamageByVictim(parent, this, (event) =>
      this.OnParentTakeDamage(event),
    );
    ModifierEventHub.RegisterDamageByAttacker(parent, this, (event) =>
      this.OnParentDealDamage(event),
    );
    this.StartIntervalThink(STACK_REFRESH_INTERVAL);
  }

  OnDestroy(): void {
    if (!IsServer()) return;
    const parent = this.GetParent();
    ModifierEventHub.UnregisterDamageByVictim(parent, this);
    ModifierEventHub.UnregisterDamageByAttacker(parent, this);
  }

  OnIntervalThink(): void {
    if (!this.GetParent().IsAlive()) {
      this.samples = [];
    } else {
      this.samples = filterRecentDamage(this.samples, GameRules.GetGameTime(), this.getWindow());
    }
    this.SetStackCount(Math.ceil(this.getStoredDamage()));
  }

  // 客户端只会问「要不要覆盖」却从不回调取值，故客户端一律不覆盖，tooltip 里的双刃剑伤害保持原数
  GetModifierOverrideAbilitySpecial(event: ModifierOverrideAbilitySpecialEvent): 0 | 1 {
    if (!IsServer()) return 0;
    return event.ability_special_value === EDGE_DAMAGE_KEY &&
      event.ability.GetAbilityName() === DOUBLE_EDGE_ABILITY
      ? 1
      : 0;
  }

  GetModifierOverrideAbilitySpecialValue(event: ModifierOverrideAbilitySpecialEvent): number {
    // 不能在此调用 GetSpecialValueFor(edge_damage)，那会再次触发本回调造成无限递归
    return (
      event.ability.GetLevelSpecialValueNoOverride(
        event.ability_special_value,
        event.ability_special_level,
      ) + this.getStoredDamage()
    );
  }

  private OnParentTakeDamage(event: ModifierInstanceEvent): void {
    const parent = this.GetParent();
    const attacker = event.attacker;
    if (
      !parent.IsRealHero() ||
      parent.PassivesDisabled() ||
      !attacker ||
      attacker.IsNull() ||
      attacker.GetTeamNumber() === parent.GetTeamNumber() ||
      (event.damage_flags & (DamageFlag.HPLOSS | DamageFlag.REFLECTION)) !== 0
    ) {
      return;
    }
    const doubleEdge = parent.FindAbilityByName(DOUBLE_EDGE_ABILITY);
    if (!doubleEdge || doubleEdge.GetLevel() <= 0) return;

    const now = GameRules.GetGameTime();
    this.samples = filterRecentDamage(this.samples, now, this.getWindow());
    this.samples.push({ time: now, damage: event.damage });
  }

  // 一次施法的第一个命中事件结算，下一帧再清空，让同一次双刃剑的所有目标都吃到同样的加成
  private OnParentDealDamage(event: ModifierInstanceEvent): void {
    const parent = this.GetParent();
    const inflictor = event.inflictor;
    const target = event.unit;
    if (
      this.settling ||
      !inflictor ||
      inflictor.IsNull() ||
      inflictor.GetAbilityName() !== DOUBLE_EDGE_ABILITY ||
      !target ||
      target.IsNull() ||
      target === parent ||
      target.GetTeamNumber() === parent.GetTeamNumber()
    ) {
      return;
    }

    this.settling = true;
    const consumed = this.getStoredDamage();
    Timers.CreateTimer(0, () => {
      this.settling = false;
      if (this.IsNull()) return;
      this.samples = [];
      this.SetStackCount(0);
      this.grantShield(consumed);
    });
  }

  private grantShield(consumed: number): void {
    const ability = this.GetAbility();
    if (!ability || ability.IsNull()) return;
    const shield = calculateShieldAmount(consumed, ability.GetSpecialValueFor('shield_pct'));
    if (shield <= 0) return;

    const parent = this.GetParent();
    parent.AddNewModifier(
      parent,
      ability,
      modifier_special_bonus_unique_centaur_upgrade_shield.name,
      {
        duration: ability.GetSpecialValueFor('shield_duration'),
        shield,
      },
    );
  }

  private getWindow(): number {
    return this.GetAbility()?.GetSpecialValueFor('damage_window') ?? 0;
  }

  private getStoredDamage(): number {
    const ability = this.GetAbility();
    const parent = this.GetParent();
    const doubleEdge = parent.FindAbilityByName(DOUBLE_EDGE_ABILITY);
    if (!ability || ability.IsNull() || !doubleEdge || doubleEdge.GetLevel() <= 0) return 0;

    const normalDamage = calculateNormalDoubleEdgeDamage(
      doubleEdge.GetLevelSpecialValueNoOverride(EDGE_DAMAGE_KEY, doubleEdge.GetLevel() - 1),
      parent.IsHero() ? (parent as CDOTA_BaseNPC_Hero).GetStrength() : 0,
      doubleEdge.GetSpecialValueFor('strength_damage'),
    );
    return calculateStoredDamage(
      sumRecentDamage(this.samples, GameRules.GetGameTime(), this.getWindow()),
      ability.GetSpecialValueFor('damage_conversion_pct'),
      normalDamage,
      ability.GetSpecialValueFor('stored_damage_cap_pct'),
    );
  }
}

/** 全伤害护盾，层数显示剩余量 */
@registerModifier('abilities/ts_abilities/special_bonus_unique_centaur_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_centaur_upgrade_shield extends BaseModifier {
  private remainingShield = 0;

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  IsBuff(): boolean {
    return true;
  }

  GetTexture(): string {
    return 'centaur_return';
  }

  OnCreated(params: CentaurShieldParams): void {
    this.refreshShield(params);
  }

  OnRefresh(params: CentaurShieldParams): void {
    this.refreshShield(params);
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.INCOMING_DAMAGE_CONSTANT, ModifierFunction.TOOLTIP];
  }

  OnTooltip(): number {
    return this.GetStackCount();
  }

  GetModifierIncomingDamageConstant(event: ModifierAttackEvent): number {
    if (!IsServer()) return this.GetStackCount();
    if (event.damage <= 0 || (event.damage_flags & DamageFlag.HPLOSS) !== 0) return 0;

    const blockedDamage = Math.min(event.damage, this.remainingShield);
    this.remainingShield -= blockedDamage;
    this.SetStackCount(Math.ceil(this.remainingShield));

    if (this.remainingShield <= 0) {
      Timers.CreateTimer(0, () => {
        if (!this.IsNull()) this.Destroy();
      });
    }
    return -blockedDamage;
  }

  private refreshShield(params: CentaurShieldParams): void {
    if (!IsServer()) return;
    this.remainingShield = mergeShieldAmount(this.remainingShield, params.shield ?? 0);
    this.SetStackCount(Math.ceil(this.remainingShield));
  }
}
