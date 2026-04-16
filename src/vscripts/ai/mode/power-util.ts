/**
 * Unit combat power estimation helpers.
 *
 * Adjusts the raw HP × level metric with resource-state multipliers so that a
 * mana-burned hero or an ultimate-on-cooldown hero is correctly rated as less
 * threatening than their stats alone suggest.
 */
export class PowerUtil {
  /** Multiplier applied when the unit's ultimate (ability index 5) is on cooldown. */
  static readonly ULT_ON_COOLDOWN_MULTIPLIER = 0.7;

  /**
   * Estimates the current combat power of a single unit.
   *
   * Formula: (hpPercent / 100) * level * manaRatio * ultMultiplier
   *
   * - manaRatio = mana / maxMana; defaults to 1.0 for manaless heroes (maxMana = 0)
   * - ultMultiplier = 1.0 if ability at index 5 is ready (or absent), 0.7 if on cooldown
   */
  static CalculatePowerUnit(unit: CDOTA_BaseNPC): number {
    const basePower = (unit.GetHealthPercent() / 100) * unit.GetLevel();
    const maxMana = unit.GetMaxMana();
    const manaRatio = maxMana > 0 ? unit.GetMana() / maxMana : 1;
    const ult = unit.GetAbilityByIndex(5);
    const ultReady = !ult || ult.GetCooldownTimeRemaining() === 0;
    return basePower * manaRatio * (ultReady ? 1.0 : PowerUtil.ULT_ON_COOLDOWN_MULTIPLIER);
  }
}
