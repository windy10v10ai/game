import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';

@registerModifier('modifiers/global/modifier_hide_health_bar')
export class modifier_hide_health_bar extends BaseModifier {
  IsHidden(): boolean {
    return true;
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

  GetDisableHealthBar(): boolean {
    return true;
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return {
      [ModifierState.NO_HEALTH_BAR]: true,
    };
  }
}
