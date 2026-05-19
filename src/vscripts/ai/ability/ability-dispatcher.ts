import {
  CastCoindition,
  CheckAbilityConditionFailure,
  CheckUnitConditionFailure,
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
    const condition = spec.condition;

    if (CheckUnitConditionFailure(hero, condition?.self?.unitCondition)) {
      return false;
    }
    if (CheckAbilityConditionFailure(ability, condition?.ability)) {
      return false;
    }

    const target = this.pickTarget(ai, ability, spec);
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
    spec: AbilitySpec,
  ): CDOTA_BaseNPC | undefined {
    const hero = ai.GetHero();

    if (spec.targetSide === TargetSide.Self) {
      // 自身条件已在 tryCast 顶部检查
      return hero;
    }

    const candidates = this.candidatesFor(ai, spec.targetSide);
    const condition = this.fillRangeFromCastRange(spec.condition, hero, ability);
    return FilterTargetWithCondition(condition, candidates, hero, ability);
  }

  /**
   * 当 spec 未显式指定 target.range.lte 时，自动补上技能的有效施法距离 ——
   * 让大多数 spec 不必关心半径，dispatcher 用 KV 中的 AbilityCastRange + 施法距离加成。
   * 仅在 spec 想要"超出施法距离也算合法目标"等特殊场景才需要显式覆盖。
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
    const castRange = GetFullCastRange(hero, ability);
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
    if (side === TargetSide.FriendlyHero) {
      return ai.aroundFriendlyHeroes;
    }
    return [];
  }
}
