export interface TidehunterAnchorSmashAwakenCarrierEvent {
  attackerMatches: boolean;
  awakenAbilityActive: boolean;
  carrierAttackInProgress: boolean;
  inflictorAbilityName?: string;
  damageFlags: number;
  reflectionFlag: number;
  damage: number;
  targetIsValid: boolean;
}

const ANCHOR_SMASH_ABILITY = 'tidehunter_anchor_smash';

/**
 * Kraken Shell's native Anchor Smash talent reports its damage as reflected Anchor Smash damage.
 * The awakening reuses that native trigger and adds only a zero-normal-damage attack to carry procs.
 */
export function shouldTriggerTidehunterAwakenProcCarrier(
  event: TidehunterAnchorSmashAwakenCarrierEvent,
): boolean {
  return (
    event.attackerMatches &&
    event.awakenAbilityActive &&
    !event.carrierAttackInProgress &&
    event.inflictorAbilityName === ANCHOR_SMASH_ABILITY &&
    (event.damageFlags & event.reflectionFlag) === event.reflectionFlag &&
    event.damage > 0 &&
    event.targetIsValid
  );
}

/**
 * Suppress only the carrier record's ordinary attack damage. Spell-like damage created by attack
 * effects must remain so the synthetic attack behaves like Anchor Smash for proc purposes.
 */
export function getTidehunterAwakenCarrierTotalDamageOutgoingPercentage(
  isCarrierRecord: boolean,
  damageCategory: number | undefined,
  attackDamageCategory: number,
): number {
  return isCarrierRecord && damageCategory === attackDamageCategory ? -100 : 0;
}
