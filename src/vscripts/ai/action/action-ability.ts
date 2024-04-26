import { BaseHeroAIModifier } from "../hero/hero-base";
import { ActionFind } from "./action-find";

export interface CastCoindition {
  target?: {
    healthPercentLessThan?: number;
    noModifier?: string;
  };
  self?: {
    healthPercentMoreThan?: number;
    healthPercentLessThan?: number;
    manaPercentMoreThan?: number;
    abilityLevel?: number;
    hasScepter?: boolean;
    hasShard?: boolean;
  };
}

export class ActionAbility {
  static CastAbilityOnFindEnemyHero(
    ai: BaseHeroAIModifier,
    abilityName: string,
    condition?: CastCoindition,
  ): boolean {
    return this.CastAbilityOnFindEnemy(ai, abilityName, condition, UnitTargetType.HERO);
  }

  static CastAbilityOnFindEnemyCreep(
    ai: BaseHeroAIModifier,
    abilityName: string,
    condition?: CastCoindition,
  ): boolean {
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

    return this.CastAbilityOnFindEnemy(
      ai,
      abilityName,
      condition,
      UnitTargetType.CREEP,
      // 排除远古单位
      UnitTargetFlags.NOT_ANCIENTS,
    );
  }

  protected static CastAbilityOnFindEnemy(
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
    const target = this.findOneVisibleUnits(enemies, hero);

    if (!target) {
      return false;
    }

    if (condition?.target) {
      if (this.IsConditionTargetBreak(condition, target)) {
        return false;
      }
    }

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
    } else if (this.IsAbilityBehavior(ability, AbilityBehavior.NO_TARGET)) {
      print(`[AI] CastAbilityOnEnemy ${abilityName} no target`);
      hero.CastAbilityNoTarget(ability, hero.GetPlayerOwnerID());
      return true;
    } else {
      print(`[AI] ERROR CastAbilityOnEnemy ${abilityName} not found behavior`);
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

  /**
   * 检测是否在战争迷雾中
   * @returns Check FoW to get an entity is visible
   */
  private static findOneVisibleUnits(
    units: CDOTA_BaseNPC[],
    self: CDOTA_BaseNPC_Hero,
  ): CDOTA_BaseNPC | undefined {
    for (const unit of units) {
      if (unit.IsAlive() && unit.CanEntityBeSeenByMyTeam(self)) {
        return unit;
      }
    }
    return undefined;
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
      if (condition.self.healthPercentLessThan) {
        if (self.GetHealthPercent() > condition.self.healthPercentLessThan) {
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
      if (condition.self.hasShard) {
        if (!self.HasModifier("modifier_item_aghanims_shard")) {
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
