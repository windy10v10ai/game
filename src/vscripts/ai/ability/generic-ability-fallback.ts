import { GetAbilityBehaviorBits, HasAbilityBehavior } from '../action/cast-condition';
import { TryCastBySpec } from '../action/target-dispatch';
import type { BotBaseAIModifier } from '../hero/bot-base';
import { TargetSide } from './ability-spec';

/** 为未登记技能提供只面向敌方英雄的最低施法能力。 */
export class GenericAbilityFallback {
  static TryCast(ai: BotBaseAIModifier, ability: CDOTABaseAbility): boolean {
    if (!this.CanCast(ability)) {
      return false;
    }

    if (!TryCastBySpec(ai, ability, TargetSide.EnemyHero, undefined)) {
      return false;
    }

    // print(`[AI] GenericAbility ${ability.GetName()}`);
    return true;
  }

  private static CanCast(ability: CDOTABaseAbility): boolean {
    if (ability.GetLevel() < 2 || !ability.IsFullyCastable() || ability.IsHidden()) {
      return false;
    }
    if (ability.GetAbilityType() === AbilityTypes.ULTIMATE) {
      return false;
    }

    const behavior = GetAbilityBehaviorBits(ability);
    if (this.HasUnsupportedBehavior(behavior)) {
      return false;
    }
    if (HasAbilityBehavior(behavior, AbilityBehavior.UNIT_TARGET)) {
      return this.CanTargetEnemyHero(ability);
    }
    if (HasAbilityBehavior(behavior, AbilityBehavior.POINT)) {
      return this.CanUseEnemyHeroPosition(ability);
    }
    return false;
  }

  private static HasUnsupportedBehavior(behavior: number): boolean {
    return (
      HasAbilityBehavior(behavior, AbilityBehavior.NO_TARGET) ||
      HasAbilityBehavior(behavior, AbilityBehavior.CHANNELLED) ||
      HasAbilityBehavior(behavior, AbilityBehavior.TOGGLE) ||
      HasAbilityBehavior(behavior, AbilityBehavior.AUTOCAST) ||
      HasAbilityBehavior(behavior, AbilityBehavior.ATTACK) ||
      HasAbilityBehavior(behavior, AbilityBehavior.VECTOR_TARGETING) ||
      HasAbilityBehavior(behavior, AbilityBehavior.OPTIONAL_UNIT_TARGET) ||
      HasAbilityBehavior(behavior, AbilityBehavior.OPTIONAL_POINT) ||
      HasAbilityBehavior(behavior, AbilityBehavior.OPTIONAL_NO_TARGET) ||
      HasAbilityBehavior(behavior, AbilityBehavior.ITEM) ||
      HasAbilityBehavior(behavior, AbilityBehavior.PASSIVE) ||
      HasAbilityBehavior(behavior, AbilityBehavior.HIDDEN) ||
      HasAbilityBehavior(behavior, AbilityBehavior.NOT_LEARNABLE)
    );
  }

  private static CanTargetEnemyHero(ability: CDOTABaseAbility): boolean {
    const targetTeam = ability.GetAbilityTargetTeam();
    if (targetTeam !== UnitTargetTeam.ENEMY && targetTeam !== UnitTargetTeam.BOTH) {
      return false;
    }

    return this.HasHeroTargetType(ability.GetAbilityTargetType());
  }

  private static CanUseEnemyHeroPosition(ability: CDOTABaseAbility): boolean {
    const targetTeam = ability.GetAbilityTargetTeam();
    if (
      targetTeam !== UnitTargetTeam.ENEMY &&
      targetTeam !== UnitTargetTeam.BOTH &&
      targetTeam !== UnitTargetTeam.NONE
    ) {
      return false;
    }

    const targetType = ability.GetAbilityTargetType();
    return targetType === UnitTargetType.NONE || this.HasHeroTargetType(targetType);
  }

  private static HasHeroTargetType(targetType: DOTA_UNIT_TARGET_TYPE): boolean {
    return (targetType & UnitTargetType.HERO) !== 0 && (targetType & UnitTargetType.CUSTOM) === 0;
  }
}
