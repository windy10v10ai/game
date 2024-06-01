import { BaseHeroAIModifier } from "../hero/hero-base";
import { ActionFind } from "./action-find";

/**
 * 施法条件，必须满足所有条件才能施法
 */
export interface CastCoindition {
  target?: {
    /**
     * 敌人血量百分比 小于等于 该值，1-100的数字
     */
    healthPercentLessThan?: number;
    /**
     * 敌人没有这个modifier
     */
    noModifier?: string;
    /**
     * 敌人在范围内时
     */
    range?: number;
    /**
     * 敌人数量大于等于该值
     */
    count?: number;
    /**
     * 敌人数量小于等于该值
     */
    countLessThan?: number;
  };
  self?: {
    /**
     * 当前血量百分比 大于等于 该值，1-100的数字
     */
    healthPercentMoreThan?: number;
    /**
     * 当前血量百分比 小于等于 该值，1-100的数字
     */
    healthPercentLessThan?: number;
    /**
     * 当前魔法百分比 大于等于 该值，1-100的数字
     */
    manaPercentMoreThan?: number;
    hasScepter?: boolean;
    hasShard?: boolean;
  };
  ability?: {
    /**
     * 技能等级大于等于该值
     */
    level?: number;
    /**
     * 技能等级小于等于该值
     */
    levelLessThan?: number;
    /**
     * 技能剩余次数大于等于该值
     */
    charges?: number;
  };
  action?: {
    /**
     * 满足条件后，开启技能
     */
    toggleOn?: boolean;
    /**
     * 满足条件后，关闭技能
     */
    toggleOff?: boolean;
    /**
     * 满足条件后，开启自动施法
     */
    autoCastOn?: boolean;
  };
  debug?: boolean;
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
    };
    const defaultAbility = {
      level: 3,
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
      }
      if (!condition.ability) {
        condition.ability = defaultAbility;
      } else {
        if (!condition.ability.level) {
          condition.ability.level = defaultAbility.level;
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

    // 判断施法条件是否满足
    if (condition?.self) {
      if (this.IsConditionSelfBreak(condition, hero)) {
        // FIXME debug
        if (condition?.debug) {
          print(`[AI] CastAbilityOnEnemy ${abilityName} self break`);
        }
        return false;
      }
    }
    if (condition?.ability) {
      if (this.IsConditionAbilityBreak(condition, ability)) {
        // FIXME debug
        if (condition?.debug) {
          print(`[AI] CastAbilityOnEnemy ${abilityName} ability break`);
        }
        return false;
      }
    }

    // 寻找是否目标
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
    const findRange = condition?.target?.range ?? this.GetFullCastRange(hero, ability);
    // FIXME debug
    if (condition?.debug) {
      print(`[AI] CastAbilityOnEnemy ${abilityName} findRange ${findRange}`);
    }
    const enemies = ActionFind.FindEnemies(hero, findRange, typeFilter, flagFilter, FindOrder.ANY);
    const target = this.FindTargetWithCondition(condition, enemies, hero);

    if (!target) {
      // FIXME debug
      if (condition?.debug) {
        print(`[AI] CastAbilityOnEnemy ${abilityName} target not found`);
      }
      return false;
    }

    // 指定技能行为时，优先执行技能行为
    if (condition?.action) {
      return this.doAction(condition, ability);
    }

    // 未指定技能行为时，执行默认技能行为
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
   *
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

  private static IsConditionAbilityBreak(
    condition: CastCoindition,
    ability: CDOTABaseAbility,
  ): boolean {
    if (condition.ability) {
      if (condition.ability.level) {
        if (ability.GetLevel() < condition.ability.level) {
          return true;
        }
      }
      if (condition.ability.charges) {
        const charges = ability.GetCurrentAbilityCharges();
        if (charges < condition.ability.charges) {
          return true;
        }
      }
    }

    return false;
  }

  private static FindTargetWithCondition(
    condition: CastCoindition | undefined,
    units: CDOTA_BaseNPC[],
    self: CDOTA_BaseNPC_Hero,
  ): CDOTA_BaseNPC | undefined {
    if (condition?.target?.count) {
      if (units.length < condition.target.count) {
        // FIXME debug
        if (condition?.debug) {
          print(`[AI] FindTargetWithCondition count ${units.length} < ${condition.target.count}`);
        }
        return undefined;
      }
    }
    if (condition?.target?.countLessThan) {
      if (units.length > condition.target.countLessThan) {
        return undefined;
      }
    }

    for (const unit of units) {
      // 检测是否在战争迷雾中
      if (unit.IsAlive() && unit.CanEntityBeSeenByMyTeam(self)) {
        return unit;
      }

      if (condition?.target) {
        if (condition.target.healthPercentLessThan) {
          if (unit.GetHealthPercent() > condition.target.healthPercentLessThan) {
            continue;
          }
        }
        if (condition.target.noModifier) {
          if (unit.HasModifier(condition.target.noModifier)) {
            continue;
          }
        }
      }
    }

    return undefined;
  }

  private static doAction(condition: CastCoindition, ability: CDOTABaseAbility): boolean {
    if (condition?.action) {
      if (condition?.action?.toggleOn) {
        if (!ability.GetToggleState()) {
          print(`[AI] toggleOn ${ability.GetName()}`);
          ability.ToggleAbility();
          return true;
        }
      }
      if (condition?.action?.toggleOff) {
        if (ability.GetToggleState()) {
          print(`[AI] toggleOff ${ability.GetName()}`);
          ability.ToggleAbility();
          return true;
        }
      }
      if (condition?.action?.autoCastOn) {
        if (!ability.GetAutoCastState()) {
          print(`[AI] autoCastOn ${ability.GetName()}`);
          ability.ToggleAutoCast();
          return true;
        }
      }
    }
    return false;
  }
}
