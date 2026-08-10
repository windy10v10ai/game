import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';

/** 近战英雄状态抗性加成，与 KV 的 modifier_global_melee_resistance（魔抗）并列挂载，自身保持隐藏不重复显示图标 */
@registerModifier('modifiers/global/melee_status_resistance')
export class modifier_global_melee_status_resistance extends BaseModifier {
  private static readonly STATUS_RESISTANCE_BONUS = 20;

  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  IsPurgeException(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  AllowIllusionDuplicate(): boolean {
    return true;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.STATUS_RESISTANCE_STACKING];
  }

  GetModifierStatusResistanceStacking(): number {
    return modifier_global_melee_status_resistance.STATUS_RESISTANCE_BONUS;
  }
}
