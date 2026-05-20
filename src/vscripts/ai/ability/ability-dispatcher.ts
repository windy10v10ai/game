import {
  CastCoindition,
  CheckAbilityConditionFailure,
  CheckNumberRangeFailure,
  CheckUnitConditionFailure,
  DeepMerge,
  FilterTargetWithCondition,
  NumberRange,
} from '../action/cast-condition';
import type { BotBaseAIModifier } from '../hero/bot-base';
import { CastAbilityOnTargetByBehavior, GetFullCastRange } from './ability-cast';
import { AbilityRegistry } from './ability-registry';
import { AbilitySpec, TargetSide } from './ability-spec';

/**
 * 统一的 bot 技能 AI 入口。
 *
 * 由 bot-base ActionMode 内各 ActionXxx 顶部调用：
 *   if (AbilityDispatcher.Run(this)) return true;
 *
 * 工作流：
 *   1. 遍历 hero 当前拥有的全部技能（含 lottery 新加的）
 *   2. 对每个技能查 AbilityRegistry 拿 spec 列表
 *   3. 按 spec 注册顺序逐条尝试：施法者/技能条件 → 候选目标（直接读 bot-base 预搜缓存）→ 目标筛选 → cast
 *   4. 命中即返回 true，本 tick 结束
 *
 * 关键性能优化：候选目标全部读自 ai.aroundEnemyHeroes / aroundEnemyCreeps / aroundFriendlyHeroes，
 * 整轮 dispatch 不再发起任何 FindUnitsInRadius 调用。
 */
/**
 * 对小兵施法时自动套用的默认条件（等同旧 CastAbilityOnFindEnemyCreep 的 defaultCondition）。
 * spec 中显式指定的同路径值会通过 DeepMerge 覆盖这里的默认值。
 */
const CREEP_DEFAULT_CONDITION: CastCoindition = {
  self: {
    unitCondition: {
      manaPercent: { gte: 50 },
      healthPercent: { gte: 50 },
    },
    noEnemyHeroInRange: 900,
  },
  ability: { level: { gte: 3 } },
};

export class AbilityDispatcher {
  static Run(ai: BotBaseAIModifier): boolean {
    const hero = ai.GetHero();

    const abilityCount = hero.GetAbilityCount();
    for (let i = 0; i < abilityCount; i++) {
      const ability = hero.GetAbilityByIndex(i);
      if (!ability) {
        continue;
      }
      if (!ability.IsFullyCastable()) {
        continue;
      }

      const specs = AbilityRegistry.get(ability.GetName());
      if (!specs) {
        continue;
      }

      for (const spec of specs) {
        if (this.tryCast(ai, ability, spec)) {
          return true;
        }
      }
    }

    return false;
  }

  private static tryCast(
    ai: BotBaseAIModifier,
    ability: CDOTABaseAbility,
    spec: AbilitySpec,
  ): boolean {
    const hero = ai.GetHero();
    const condition =
      spec.targetSide === TargetSide.EnemyCreep
        ? DeepMerge(CREEP_DEFAULT_CONDITION, spec.condition)
        : spec.condition;

    if (CheckUnitConditionFailure(hero, condition?.self?.unitCondition)) {
      return false;
    }
    if (CheckAbilityConditionFailure(ability, condition?.ability)) {
      return false;
    }

    const noHeroRange = condition?.self?.noEnemyHeroInRange;
    if (noHeroRange !== undefined) {
      for (const enemy of ai.aroundEnemyHeroes) {
        if (enemy.IsAlive() && hero.GetRangeToUnit(enemy) <= noHeroRange) {
          return false;
        }
      }
    }

    const friendlyCreepNearby = condition?.self?.friendlyCreepNearby;
    if (friendlyCreepNearby !== undefined) {
      const range = friendlyCreepNearby.range ?? 900;
      const creeps = FindUnitsInRadius(
        hero.GetTeamNumber(),
        hero.GetAbsOrigin(),
        undefined,
        range,
        UnitTargetTeam.FRIENDLY,
        UnitTargetType.BASIC,
        UnitTargetFlags.NONE,
        FindOrder.ANY,
        false,
      );
      if (CheckNumberRangeFailure(creeps.length, friendlyCreepNearby.count)) {
        return false;
      }
    }

    const target = this.pickTarget(ai, ability, spec.targetSide, condition);
    if (!target) {
      return false;
    }

    if (condition?.debug) {
      print(`[AI] Dispatcher hit ${ability.GetName()} side=${spec.targetSide}`);
    }

    return CastAbilityOnTargetByBehavior(hero, ability, target);
  }

  private static pickTarget(
    ai: BotBaseAIModifier,
    ability: CDOTABaseAbility,
    targetSide: TargetSide,
    condition: CastCoindition | undefined,
  ): CDOTA_BaseNPC | undefined {
    const hero = ai.GetHero();

    if (targetSide === TargetSide.Self) {
      // 自身条件已在 tryCast 顶部检查
      return hero;
    }

    const candidates = this.candidatesFor(ai, targetSide);
    const filledCondition = this.fillRangeFromCastRange(condition, hero, ability);
    return FilterTargetWithCondition(filledCondition, candidates, hero, ability);
  }

  /**
   * 当 spec 未显式指定 target.range.lte 时，自动补上技能的有效搜索距离：
   * - 若 spec 设置了 target.rangeFromAbilityValue，则读取 ability.GetSpecialValueFor(key) 作为上限
   *   （适用于 NO_TARGET AoE 技能，如 axe_berserkers_call，cast range = 0 但实际作用域由 KV AbilityValues 定义）
   * - 否则使用 AbilityCastRange + 施法距离加成
   */
  private static fillRangeFromCastRange(
    condition: CastCoindition | undefined,
    hero: CDOTA_BaseNPC_Hero,
    ability: CDOTABaseAbility,
  ): CastCoindition {
    const existing = condition?.target?.range;
    if (existing?.lte !== undefined) {
      return condition!;
    }
    // 避免使用对象 spread —— TSTL 的 __TS__ObjectAssign 接到 nil 会崩。
    const specialValueKey = condition?.target?.rangeFromAbilityValue;
    const castRange = specialValueKey
      ? ability.GetSpecialValueFor(specialValueKey)
      : GetFullCastRange(hero, ability);
    const range: NumberRange = { lte: castRange };
    if (existing?.gte !== undefined) {
      range.gte = existing.gte;
    }
    const target = condition?.target ?? {};
    target.range = range;
    return {
      target,
      self: condition?.self,
      ability: condition?.ability,
      action: condition?.action,
      debug: condition?.debug,
    };
  }

  /**
   * 取候选列表 —— 直接消费 bot-base 预搜结果，不再发起新的范围搜索。
   * aroundFriendlyHeroes 来自 FindUnitsInRadius(TEAM_FRIENDLY)，已包含自己，
   * 且按 FindOrder.CLOSEST 排序，距离 0 的自己天然位于首位。
   */
  private static candidatesFor(ai: BotBaseAIModifier, side: TargetSide): CDOTA_BaseNPC[] {
    if (side === TargetSide.EnemyHero) {
      return ai.aroundEnemyHeroes;
    }
    if (side === TargetSide.EnemyCreep) {
      return ai.aroundEnemyCreeps;
    }
    if (side === TargetSide.EnemyBuilding) {
      return ai.aroundEnemyBuildings;
    }
    if (side === TargetSide.FriendlyHero) {
      return ai.aroundFriendlyHeroes;
    }
    return [];
  }
}
