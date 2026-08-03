import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { applyAwakenMagicImmunity } from './shared/awaken-magic-immunity';

const SHALLOW_GRAVE_ABILITY = 'dazzle_shallow_grave';

/** 戴泽 薄葬-觉醒：薄葬期间目标获得魔免。 */
@registerAbility('special_bonus_unique_dazzle_upgrade')
export class SpecialBonusUniqueDazzleUpgrade extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_dazzle_upgrade.name;
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_dazzle_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_dazzle_upgrade extends BaseModifier {
  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  GetTexture(): string {
    return SHALLOW_GRAVE_ABILITY;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_ABILITY_FULLY_CAST];
  }

  OnAbilityFullyCast(event: ModifierAbilityEvent): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    const ability = event.ability;
    if (event.unit !== parent || ability.GetAbilityName() !== SHALLOW_GRAVE_ABILITY) return;

    const target = ability.GetCursorTarget();
    if (!target || target.IsNull() || !target.IsAlive()) return;
    if (target.GetTeamNumber() !== parent.GetTeamNumber()) return;

    const awakenAbility = this.GetAbility();
    if (!awakenAbility || awakenAbility.IsNull() || awakenAbility.GetLevel() <= 0) return;

    const duration = ability.GetSpecialValueFor('duration');
    if (duration <= 0) return;

    applyAwakenMagicImmunity(target, awakenAbility, duration);
  }
}
