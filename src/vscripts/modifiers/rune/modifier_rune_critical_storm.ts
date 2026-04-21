import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';

LinkLuaModifier('modifier_rune_critical_storm', 'modifiers/rune/modifier_rune_critical_storm', LuaModifierMotionType.NONE);

export const CRITICAL_STORM_DURATION = 15;
// +400% bonus on top of 100% base = 5x total damage
export const CRITICAL_STORM_BONUS_DAMAGE_PCT = 400;

@registerModifier('modifiers/rune/modifier_rune_critical_storm')
export class modifier_rune_critical_storm extends BaseModifier {
  IsHidden(): boolean { return false; }
  IsPurgable(): boolean { return false; }
  IsDebuff(): boolean { return false; }

  GetEffectName(): string { return 'particles/items2_fx/double_damage.vpcf'; }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.PREATTACK_CRITICALSTRIKE];
  }

  // Called every attack — always returning non-zero means 100% crit chance
  GetModifierPreAttack_CriticalStrike(): number {
    return CRITICAL_STORM_BONUS_DAMAGE_PCT;
  }
}
