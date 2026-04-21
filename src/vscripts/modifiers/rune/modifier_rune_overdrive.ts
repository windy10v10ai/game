import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';

LinkLuaModifier('modifier_rune_overdrive', 'modifiers/rune/modifier_rune_overdrive', LuaModifierMotionType.NONE);

export const OVERDRIVE_DURATION = 20;
export const OVERDRIVE_MOVE_SPEED = 900;
export const OVERDRIVE_ATTACK_SPEED = 300;

@registerModifier('modifiers/rune/modifier_rune_overdrive')
export class modifier_rune_overdrive extends BaseModifier {
  IsHidden(): boolean { return false; }
  IsPurgable(): boolean { return false; }
  IsDebuff(): boolean { return false; }

  GetEffectName(): string { return 'particles/items2_fx/haste.vpcf'; }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.MOVESPEED_ABSOLUTE_MAX,
      ModifierFunction.MOVESPEED_ABSOLUTE,
      ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
    ];
  }

  GetModifierMoveSpeed_AbsoluteMax(): number { return OVERDRIVE_MOVE_SPEED; }
  GetModifierMoveSpeed_Absolute(): number { return OVERDRIVE_MOVE_SPEED; }
  GetModifierAttackSpeedBonus_Constant(): number { return OVERDRIVE_ATTACK_SPEED; }
}
