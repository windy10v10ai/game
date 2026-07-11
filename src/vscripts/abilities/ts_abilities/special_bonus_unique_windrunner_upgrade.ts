import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

/**
 * 风行者 风行-觉醒：施放风行时借用隐刺的隐身效果，限时生效。
 */
@registerAbility('special_bonus_unique_windrunner_upgrade')
export class SpecialBonusUniqueWindrunnerUpgrade extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return 'modifier_special_bonus_unique_windrunner_upgrade';
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_windrunner_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_windrunner_upgrade extends BaseModifier {
  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_ABILITY_FULLY_CAST];
  }

  OnAbilityFullyCast(event: ModifierAbilityEvent): void {
    if (!IsServer()) return;
    const parent = this.GetParent();
    if (event.unit !== parent) return;

    const ability = event.ability;
    if (ability.GetAbilityName() !== 'windrunner_windrun') return;

    const duration = ability.GetSpecialValueFor('AbilityDuration');
    if (duration <= 0) return;

    const selfAbility = this.GetAbility();
    const fadeDelay = selfAbility?.GetSpecialValueFor('fade_delay') ?? 0;

    const invis = parent.AddNewModifier(parent, selfAbility, 'modifier_riki_backstab', {
      duration,
      fade_delay: fadeDelay,
    });
    if (!invis) return;

    Timers.CreateTimer(duration, () => {
      if (invis.IsNull()) return;
      invis.Destroy();
    });
  }
}
