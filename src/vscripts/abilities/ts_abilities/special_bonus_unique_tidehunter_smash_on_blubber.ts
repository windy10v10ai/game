import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import {
  getTidehunterAwakenCarrierTotalDamageOutgoingPercentage,
  shouldTriggerTidehunterAwakenProcCarrier,
} from './tidehunter-anchor-smash-awaken-logic';

const ANCHOR_SMASH_ABILITY = 'tidehunter_anchor_smash';

/** 潮汐猎人 锚击-觉醒：复用原生海妖外壳净化锚击，并为其补齐攻击特效。 */
@registerAbility('special_bonus_unique_tidehunter_smash_on_blubber')
export class SpecialBonusUniqueTidehunterSmashOnBlubber extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_tidehunter_smash_on_blubber.name;
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_tidehunter_smash_on_blubber')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_tidehunter_smash_on_blubber extends BaseModifier {
  private carrierAttackInProgress = false;
  private carrierAttackRecords: Record<number, boolean> = {};

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  IsPurgeException(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  AllowIllusionDuplicate(): boolean {
    return false;
  }

  GetTexture(): string {
    return ANCHOR_SMASH_ABILITY;
  }

  OnCreated(): void {
    if (!IsServer()) return;
    this.carrierAttackInProgress = false;
    this.carrierAttackRecords = {};
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.ON_TAKEDAMAGE,
      ModifierFunction.ON_ATTACK_RECORD,
      ModifierFunction.ON_ATTACK_RECORD_DESTROY,
      ModifierFunction.TOTALDAMAGEOUTGOING_PERCENTAGE,
    ];
  }

  OnTakeDamage(event: ModifierInstanceEvent): void {
    if (!IsServer()) return;

    const tidehunter = this.GetParent() as CDOTA_BaseNPC_Hero;
    const awakenAbility = this.GetAbility();
    const target = event.unit;
    const inflictor = event.inflictor;
    const targetIsValid =
      !!target &&
      !target.IsNull() &&
      target.IsAlive() &&
      target !== tidehunter &&
      target.GetTeamNumber() !== tidehunter.GetTeamNumber();

    if (
      !shouldTriggerTidehunterAwakenProcCarrier({
        attackerMatches: event.attacker === tidehunter,
        awakenAbilityActive:
          !!awakenAbility && !awakenAbility.IsNull() && awakenAbility.GetLevel() > 0,
        carrierAttackInProgress: this.carrierAttackInProgress,
        inflictorAbilityName:
          inflictor && !inflictor.IsNull() ? inflictor.GetAbilityName() : undefined,
        damageFlags: event.damage_flags,
        reflectionFlag: DamageFlag.REFLECTION,
        damage: event.damage,
        targetIsValid,
      })
    ) {
      return;
    }

    this.carrierAttackInProgress = true;
    tidehunter.PerformAttack(
      target,
      true,
      true,
      true,
      false,
      tidehunter.IsRangedAttacker(),
      false,
      false,
    );
    this.carrierAttackInProgress = false;
  }

  OnAttackRecord(event: ModifierAttackEvent): void {
    if (!IsServer()) return;
    if (event.attacker !== this.GetParent() || !this.carrierAttackInProgress) return;

    this.carrierAttackRecords[event.record] = true;
  }

  OnAttackRecordDestroy(event: ModifierAttackEvent): void {
    if (!IsServer()) return;
    delete this.carrierAttackRecords[event.record];
  }

  GetModifierTotalDamageOutgoing_Percentage(event: ModifierAttackEvent): number {
    return getTidehunterAwakenCarrierTotalDamageOutgoingPercentage(
      this.carrierAttackRecords[event.record] === true,
      event.damage_category,
      DamageCategory.ATTACK,
    );
  }
}
