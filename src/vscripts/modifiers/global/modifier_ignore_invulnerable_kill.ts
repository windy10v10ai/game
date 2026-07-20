import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';

@registerModifier('modifiers/global/modifier_ignore_invulnerable_kill')
export class modifier_ignore_invulnerable_kill extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  IsPurgeException(): boolean {
    return false;
  }

  GetAttributes(): ModifierAttribute {
    return ModifierAttribute.IGNORE_INVULNERABLE;
  }
}
