import { CastCoindition, DeepMerge } from '../action/cast-condition';
import { TryCastBySpec } from '../action/target-dispatch';
import type { BotBaseAIModifier } from '../hero/bot-base';
import { AbilityRegistry } from './ability-registry';
import { TargetSide } from './ability-spec';

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
      manaPercent: { gte: 40 },
      healthPercent: { gte: 40 },
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
        const condition =
          spec.targetSide === TargetSide.EnemyCreep
            ? DeepMerge(CREEP_DEFAULT_CONDITION, spec.condition)
            : spec.condition;
        if (TryCastBySpec(ai, ability, spec.targetSide, condition)) {
          return true;
        }
      }
    }

    return false;
  }
}
