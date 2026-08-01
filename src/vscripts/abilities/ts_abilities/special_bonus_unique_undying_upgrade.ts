import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

const DECAY_ABILITY = 'undying_decay';
const FLESH_GOLEM_MODIFIER = 'modifier_undying_flesh_golem';

/** 尸王觉醒 */
@registerAbility('special_bonus_unique_undying_upgrade')
export class SpecialBonusUniqueUndyingUpgrade extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_undying_upgrade.name;
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_undying_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_undying_upgrade extends BaseModifier {
  private lastTriggerTime = 0;

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
    return DECAY_ABILITY;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_ATTACK_LANDED];
  }

  OnAttackLanded(event: ModifierAttackEvent): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    const target = event.target;
    const awaken = this.GetAbility();
    if (
      event.attacker !== parent ||
      event.no_attack_cooldown ||
      !parent.IsRealHero() ||
      parent.IsIllusion() ||
      parent.PassivesDisabled() ||
      !parent.HasModifier(FLESH_GOLEM_MODIFIER) ||
      !awaken ||
      awaken.IsNull() ||
      awaken.GetLevel() <= 0 ||
      !awaken.IsActivated() ||
      !target ||
      target.IsNull() ||
      target.GetTeamNumber() === parent.GetTeamNumber()
    ) {
      return;
    }

    const decay = parent.FindAbilityByName(DECAY_ABILITY);
    if (!decay || decay.IsNull() || decay.GetLevel() <= 0) return;

    const now = GameRules.GetGameTime();
    const cooldown = awaken.GetSpecialValueFor('trigger_cooldown');
    if (now - this.lastTriggerTime < cooldown) return;
    this.lastTriggerTime = now;

    const previousCursorPosition = parent.GetCursorPosition();
    parent.SetCursorPosition(target.GetAbsOrigin());
    decay.OnSpellStart();
    parent.SetCursorPosition(previousCursorPosition);
  }
}
