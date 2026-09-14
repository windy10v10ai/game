import { CastCoindition, DeepMerge } from '../action/cast-condition';
import { TryCastBySpec } from '../action/target-dispatch';
import type { BotBaseAIModifier } from '../hero/bot-base';
import { AbilityRegistry } from './ability-registry';
import { AbilitySpec, TargetSide } from './ability-spec';
import { GenericAbilityFallback } from './generic-ability-fallback';

/**
 * 统一的 bot 技能 AI 入口。
 *
 * 由 bot-base ActionMode 内各 ActionXxx 在 ItemDispatcher.Run 之后调用：
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
      manaPercent: { gte: 40 },
      healthPercent: { gte: 40 },
    },
    noEnemyHeroInRange: 900,
  },
  ability: { level: { gte: 3 } },
};

/**
 * 合并结果只由两个模块级常量决定，跨 tick 恒定；逐 tick 重算既是白做功，
 * 又要为中间对象反复触发 Lua 垃圾回收，因此按 spec 缓存。
 */
const creepConditionCache = new Map<AbilitySpec, CastCoindition>();

function GetCreepCondition(spec: AbilitySpec): CastCoindition {
  const cached = creepConditionCache.get(spec);
  if (cached) {
    return cached;
  }
  const merged = DeepMerge(CREEP_DEFAULT_CONDITION, spec.condition);
  creepConditionCache.set(spec, merged);
  return merged;
}

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
      if (specs) {
        for (const spec of specs) {
          const condition =
            spec.targetSide === TargetSide.EnemyCreep ? GetCreepCondition(spec) : spec.condition;
          if (TryCastBySpec(ai, ability, spec.targetSide, condition)) {
            return true;
          }
        }
        continue;
      }

      if (GenericAbilityFallback.TryCast(ai, ability)) {
        return true;
      }
    }

    return false;
  }
}
