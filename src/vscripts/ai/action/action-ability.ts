import { BaseHeroAIModifier } from "../hero/hero-base";
import { ActionFind } from "./action-find";

export interface CastCoindition {
  target?: {
    healthPercentLessThan?: number;
    noModifier?: string;
  };
  self?: {
    healthPercentMoreThan?: number;
    manaPercentMoreThan?: number;
    abilityLevel?: number;
    hasScepter?: boolean;
  };
}

export class ActionAbility {
  static CastAbilityOnEnemyHero(
    ai: BaseHeroAIModifier,
    abilityName: string,
    condition?: CastCoindition,
  ): boolean {
    return this.CastAbilityOnEnemy(ai, abilityName, condition, UnitTargetType.HERO);
  }

  static CastAbilityOnEnemyCreep(
    ai: BaseHeroAIModifier,
    abilityName: string,
    condition?: CastCoindition,
  ): boolean {
    // set default condition, manaPercentMoreThan: 50
    const defaultSelf = {
      manaPercentMoreThan: 50,
      healthPercentMoreThan: 50,
      abilityLevel: 3,
    };
    if (!condition) {
      condition = {
        self: defaultSelf,
      };
    } else {
      if (!condition.self) {
        condition.self = defaultSelf;
      } else {
        if (!condition.self.manaPercentMoreThan) {
          condition.self.manaPercentMoreThan = defaultSelf.manaPercentMoreThan;
        }
        if (!condition.self.healthPercentMoreThan) {
          condition.self.healthPercentMoreThan = defaultSelf.healthPercentMoreThan;
        }
        if (!condition.self.abilityLevel) {
          condition.self.abilityLevel = defaultSelf.abilityLevel;
        }
      }
    }

    return this.CastAbilityOnEnemy(
      ai,
      abilityName,
      condition,
      UnitTargetType.CREEP,
      // 排除远古单位
      UnitTargetFlags.NOT_ANCIENTS,
    );
  }

  protected static CastAbilityOnEnemy(
    ai: BaseHeroAIModifier,
    abilityName: string,
    condition: CastCoindition | undefined,
    typeFilter: UnitTargetType,
    flagFilterExtra?: UnitTargetFlags,
  ): boolean {
    const hero = ai.GetHero();
    const ability = hero.FindAbilityByName(abilityName);
    if (!ability) {
      return false;
    }

    if (!ability.IsFullyCastable()) {
      return false;
    }

    if (condition?.self) {
      if (this.IsConditionSelfBreak(condition, hero, ability)) {
        return false;
      }
    }

    if (typeFilter === UnitTargetType.HERO) {
      if (ai.FindNearestEnemyHero() === undefined) {
        return false;
      }
    } else if (typeFilter === UnitTargetType.CREEP) {
      if (ai.FindNearestEnemyCreep() === undefined) {
        return false;
      } else if (ai.FindNearestEnemyCreep()!.IsAncient()) {
        return false;
      }
    }

    let flagFilter = UnitTargetFlags.NONE;

    if (flagFilterExtra) {
      flagFilter = flagFilter + flagFilterExtra;
    }
    const enemies = ActionFind.FindEnemies(
      hero,
      this.GetFullCastRange(hero, ability),
      typeFilter,
      flagFilter,
      FindOrder.ANY,
    );
    if (enemies.length === 0) {
      return false;
    }
    const target = enemies[0];

    if (condition?.target) {
      if (this.IsConditionTargetBreak(condition, target)) {
        return false;
      }
    }

    print(`[AI] CastAbilityOnEnemy ${abilityName} on ${target.GetUnitName()}`);
    if (this.IsAbilityBehavior(ability, AbilityBehavior.UNIT_TARGET)) {
      print(`[AI] CastAbilityOnEnemy ${abilityName} on target`);
      hero.CastAbilityOnTarget(target, ability, hero.GetPlayerOwnerID());
      return true;
    } else if (this.IsAbilityBehavior(ability, AbilityBehavior.POINT)) {
      print(`[AI] CastAbilityOnEnemy ${abilityName} on point`);
      hero.CastAbilityOnPosition(target.GetAbsOrigin(), ability, hero.GetPlayerOwnerID());
      return true;
    } else if (this.IsAbilityBehavior(ability, AbilityBehavior.AOE)) {
      print(`[AI] CastAbilityOnEnemy ${abilityName} on position`);
      hero.CastAbilityOnPosition(target.GetAbsOrigin(), ability, hero.GetPlayerOwnerID());
      return true;
    }

    return false;
  }

  /**
   * @return 施法距离 + 施法距离加成
   */
  public static GetFullCastRange(self: CDOTA_BaseNPC_Hero, ability: CDOTABaseAbility): number {
    const range = ability.GetCastRange(self.GetAbsOrigin(), undefined);
    const castRangeIncrease = self.GetCastRangeBonus();
    return range + castRangeIncrease;
  }

  private static IsAbilityBehavior(ability: CDOTABaseAbility, behavior: AbilityBehavior): boolean {
    const abilityBehavior = ability.GetBehavior() as number;
    // check is behavior bit set in abilityBehavior
    const isBitSet = (abilityBehavior & behavior) === behavior;
    return !!isBitSet;
  }

  private static IsConditionSelfBreak(
    condition: CastCoindition,
    self: CDOTA_BaseNPC_Hero,
    ability: CDOTABaseAbility,
  ): boolean {
    if (condition.self) {
      if (condition.self.healthPercentMoreThan) {
        if (self.GetHealthPercent() < condition.self.healthPercentMoreThan) {
          return true;
        }
      }
      if (condition.self.manaPercentMoreThan) {
        if (self.GetManaPercent() < condition.self.manaPercentMoreThan) {
          return true;
        }
      }
      if (condition.self.abilityLevel) {
        if (ability && ability.GetLevel() < condition.self.abilityLevel) {
          return true;
        }
      }
      if (condition.self.hasScepter) {
        if (!self.HasScepter()) {
          return true;
        }
      }
    }

    return false;
  }

  private static IsConditionTargetBreak(condition: CastCoindition, target: CDOTA_BaseNPC): boolean {
    if (condition.target) {
      if (condition.target.healthPercentLessThan) {
        if (target.GetHealthPercent() > condition.target.healthPercentLessThan) {
          return true;
        }
      }
      if (condition.target.noModifier) {
        if (target.HasModifier(condition.target.noModifier)) {
          return true;
        }
      }
    }

    return false;
  }
}
