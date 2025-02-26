import { BaseHeroAIModifier } from '../hero/hero-base';
import { ActionFind } from './action-find';
import {
  CastCoindition,
  CheckAbilityConditionFailure,
  CheckUnitConditionFailure,
  DeepMerge,
  FilterTargetWithCondition,
} from './cast-condition';

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
    const defaultCondition: CastCoindition = {
      self: {
        unitCondition: {
          manaPercent: { gte: 50 },
          healthPercent: { gte: 50 },
        },
      },
      ability: {
        level: { gte: 3 },
      },
    };

    const mergedCondition = DeepMerge(defaultCondition, condition);

    return this.CastAbilityOnFindEnemy(
      ai,
      abilityName,
      mergedCondition,
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

    // 检查施法者 是否满足指定条件
    if (CheckUnitConditionFailure(hero, condition?.self?.unitCondition)) {
      return false;
    }
    // 检查技能 是否满足指定条件
    if (CheckAbilityConditionFailure(ability, condition?.ability)) {
      return false;
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
    const target = FilterTargetWithCondition(condition, enemies, hero);

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
