import { GetAbilityBehaviorBits } from '../action/cast-condition';
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

    print(`[AI] GenericAbility ${ability.GetName()}`);
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
    if (this.HasBehavior(behavior, AbilityBehavior.UNIT_TARGET)) {
      return this.CanTargetEnemyHero(ability);
    }
    if (this.HasBehavior(behavior, AbilityBehavior.POINT)) {
      return this.CanUseEnemyHeroPosition(ability);
    }
    return false;
  }

  private static HasUnsupportedBehavior(behavior: number): boolean {
    return (
      this.HasBehavior(behavior, AbilityBehavior.NO_TARGET) ||
      this.HasBehavior(behavior, AbilityBehavior.CHANNELLED) ||
      this.HasBehavior(behavior, AbilityBehavior.TOGGLE) ||
      this.HasBehavior(behavior, AbilityBehavior.AUTOCAST) ||
      this.HasBehavior(behavior, AbilityBehavior.ATTACK) ||
      this.HasBehavior(behavior, AbilityBehavior.VECTOR_TARGETING) ||
      this.HasBehavior(behavior, AbilityBehavior.OPTIONAL_UNIT_TARGET) ||
      this.HasBehavior(behavior, AbilityBehavior.OPTIONAL_POINT) ||
      this.HasBehavior(behavior, AbilityBehavior.OPTIONAL_NO_TARGET) ||
      this.HasBehavior(behavior, AbilityBehavior.ITEM) ||
      this.HasBehavior(behavior, AbilityBehavior.PASSIVE) ||
      this.HasBehavior(behavior, AbilityBehavior.HIDDEN) ||
      this.HasBehavior(behavior, AbilityBehavior.NOT_LEARNABLE)
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

  private static HasBehavior(behavior: number, flag: AbilityBehavior): boolean {
    return (behavior & flag) === flag;
  }
}
