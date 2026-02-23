import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';

@registerModifier('modifiers/global/intelect_magic_resist')
export class modifier_intelect_magic_resist extends BaseModifier {
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
    return [ModifierFunction.MAGICAL_RESISTANCE_DIRECT_MODIFICATION];
  }

  GetModifierMagicalResistanceDirectModification(): number {
    const hero = this.GetParent() as CDOTA_BaseNPC_Hero;
    return hero.GetIntellect(true) * -0.05;
  }
}
