import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';

LinkLuaModifier('modifier_rune_spell_frenzy', 'modifiers/rune/modifier_rune_spell_frenzy', LuaModifierMotionType.NONE);

export const SPELL_FRENZY_DURATION = 15;
export const SPELL_FRENZY_CDR_PCT = 80;

@registerModifier('modifiers/rune/modifier_rune_spell_frenzy')
export class modifier_rune_spell_frenzy extends BaseModifier {
  IsHidden(): boolean { return false; }
  IsPurgable(): boolean { return false; }
  IsDebuff(): boolean { return false; }

  GetEffectName(): string { return 'particles/items2_fx/arcane_rune.vpcf'; }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.COOLDOWN_PERCENTAGE];
  }

  GetModifierPercentageCooldown(): number { return SPELL_FRENZY_CDR_PCT; }
}
