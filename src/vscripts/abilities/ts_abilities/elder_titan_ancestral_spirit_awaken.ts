import { HeroUtil } from '../../ai/hero/hero-util';
import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

const SCRIPT_PATH = 'abilities/ts_abilities/elder_titan_ancestral_spirit_awaken';
const AWAKEN_ABILITY = 'elder_titan_ancestral_spirit_awaken';
const NATIVE_SPIRIT_ABILITY = 'elder_titan_ancestral_spirit';
const RETURN_SPIRIT_ABILITY = 'elder_titan_return_spirit';
const CONTROLLER_MODIFIER = 'modifier_elder_titan_ancestral_spirit_awaken_controller';

@registerAbility(AWAKEN_ABILITY)
export class ElderTitanAncestralSpiritAwaken extends BaseAbility {
  private waitingForSpiritReturn = false;

  GetIntrinsicModifierName(): string {
    return CONTROLLER_MODIFIER;
  }

  GetBehavior(): AbilityBehavior {
    return AbilityBehavior.POINT + AbilityBehavior.AUTOCAST;
  }

  GetAOERadius(): number {
    return this.GetSpecialValueFor('radius');
  }

  OnUpgrade(): void {
    if (!IsServer()) return;
    this.ensureNativeSpiritAbility();
  }

  OnOwnerSpawned(): void {
    if (!IsServer()) return;
    this.ensureNativeSpiritAbility();
  }

  OnSpellStart(): void {
    if (!IsServer()) return;
    this.castNativeSpiritAt(this.GetCursorPosition());
  }

  ensureNativeSpiritAbility(): CDOTABaseAbility | undefined {
    const caster = this.GetCaster();
    let nativeSpirit = caster.FindAbilityByName(NATIVE_SPIRIT_ABILITY);
    if (!nativeSpirit) {
      nativeSpirit = caster.AddAbility(NATIVE_SPIRIT_ABILITY);
      if (nativeSpirit !== undefined) nativeSpirit.SetHidden(true);
    }
    if (!nativeSpirit) return undefined;

    if (nativeSpirit.GetLevel() !== this.GetLevel()) {
      nativeSpirit.SetLevel(this.GetLevel());
    }
    return nativeSpirit;
  }

  trackPendingSpiritReturn(): void {
    if (this.waitingForSpiritReturn) return;

    const returnSpirit = this.GetCaster().FindAbilityByName(RETURN_SPIRIT_ABILITY);
    if (!returnSpirit) return;

    this.waitingForSpiritReturn = !returnSpirit.IsHidden();
  }

  restoreWrapperAfterReturn(): void {
    if (!this.waitingForSpiritReturn) return;

    const caster = this.GetCaster();
    const nativeSpirit = caster.FindAbilityByName(NATIVE_SPIRIT_ABILITY);
    const returnSpirit = caster.FindAbilityByName(RETURN_SPIRIT_ABILITY);
    if (!nativeSpirit || !returnSpirit) return;
    if (!returnSpirit.IsHidden()) return;

    this.waitingForSpiritReturn = false;
    caster.SwapAbilities(NATIVE_SPIRIT_ABILITY, AWAKEN_ABILITY, false, true);
    nativeSpirit.SetHidden(true);
  }

  /** 沉默/眩晕/引导中等状态下不应触发自动丢魂/自动收魂，与手动施法的前置条件保持一致 */
  private isAutoTriggerBlocked(): boolean {
    const caster = this.GetCaster();
    if (HeroUtil.NotActionable(caster) || caster.IsSilenced()) return true;
    // 玩家正在持续释放（TP 等）时不抢操作，避免打断
    if (caster.IsChanneling()) return true;
    return false;
  }

  /** 自动施法下：冷却好、附近有敌方英雄时，朝最远的敌方英雄自动丢魂 */
  tryAutoCastSpirit(): void {
    if (!this.GetAutoCastState() || this.waitingForSpiritReturn) return;
    if (this.GetCooldownTimeRemaining() > 0) return;
    if (this.isAutoTriggerBlocked()) return;

    const caster = this.GetCaster();
    const target = FindUnitsInRadius(
      caster.GetTeamNumber(),
      caster.GetAbsOrigin(),
      undefined,
      this.GetCastRange(caster.GetAbsOrigin(), undefined) + caster.GetCastRangeBonus(),
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO,
      UnitTargetFlags.FOW_VISIBLE + UnitTargetFlags.NO_INVIS,
      FindOrder.FARTHEST,
      false,
    )[0];
    if (!target) return;

    // 自动触发不经过引擎原生施法管线，须用 UseResources 模拟正常施法扣蓝与启动冷却
    this.UseResources(true, false, false, true);
    this.castNativeSpiritAt(target.GetAbsOrigin());
  }

  /** 自动施法下：召回游魂技能一旦可释放（无 CD 等限制）就立即自动收回 */
  tryAutoReturnSpirit(): void {
    if (!this.GetAutoCastState() || !this.waitingForSpiritReturn) return;
    if (this.isAutoTriggerBlocked()) return;

    const returnSpirit = this.GetCaster().FindAbilityByName(RETURN_SPIRIT_ABILITY);
    if (!returnSpirit || !returnSpirit.IsFullyCastable()) return;

    returnSpirit.OnSpellStart();
  }

  private castNativeSpiritAt(location: Vector): void {
    const caster = this.GetCaster();
    const nativeSpirit = this.ensureNativeSpiritAbility();
    if (!nativeSpirit) return;

    nativeSpirit.SetActivated(true);
    caster.SetCursorPosition(location);
    nativeSpirit.OnSpellStart();

    const returnSpirit = caster.FindAbilityByName(RETURN_SPIRIT_ABILITY);
    if (!returnSpirit) return;

    returnSpirit.SetLevel(Math.max(1, this.GetLevel()));
    this.waitingForSpiritReturn = true;
    caster.SwapAbilities(AWAKEN_ABILITY, RETURN_SPIRIT_ABILITY, false, true);
  }
}

@registerModifier(SCRIPT_PATH)
export class modifier_elder_titan_ancestral_spirit_awaken_controller extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  OnCreated(): void {
    if (!IsServer()) return;
    const ability = this.GetAbility() as ElderTitanAncestralSpiritAwaken;
    ability.ensureNativeSpiritAbility();
    ability.trackPendingSpiritReturn();
    this.StartIntervalThink(0.3);
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;
    const ability = this.GetAbility() as ElderTitanAncestralSpiritAwaken;
    ability.ensureNativeSpiritAbility();
    ability.trackPendingSpiritReturn();
    ability.restoreWrapperAfterReturn();
    ability.tryAutoReturnSpirit();
    ability.tryAutoCastSpirit();
  }
}
