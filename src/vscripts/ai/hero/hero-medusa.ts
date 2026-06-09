import { registerModifier } from '../../utils/dota_ts_adapter';
import { ActionAbility } from '../action/action-ability';
import { BotBaseAIModifier } from './bot-base';

@registerModifier('ai/hero/hero-medusa')
export class MedusaAIModifier extends BotBaseAIModifier {
  override UseAbilityEnemy(): boolean {
    // 秘术异蛇
    if (ActionAbility.CastAbilityOnFindEnemyHero(this, 'medusa_mystic_snake')) {
      return true;
    }

    // 罗网箭阵
    if (ActionAbility.CastAbilityOnFindEnemyHero(this, 'medusa_gorgon_grasp')) {
      return true;
    }

    // 石化凝视
    if (
      ActionAbility.CastAbilityOnFindEnemyHero(this, 'medusa_stone_gaze', {
        target: { count: { gte: 2 } },
      })
    ) {
      return true;
    }

    // 分裂箭已迁移至 specs/medusa_split_shot.ts（dispatcher 自动处理）

    return false;
  }

  override UseAbilityCreep(): boolean {
    // 秘术异蛇
    if (
      ActionAbility.CastAbilityOnFindEnemyCreep(this, 'medusa_mystic_snake', {
        target: { count: { gte: 2 } },
      })
    ) {
      return true;
    }

    // 罗网箭阵
    if (
      ActionAbility.CastAbilityOnFindEnemyCreep(this, 'medusa_gorgon_grasp', {
        target: { count: { gte: 2 } },
      })
    ) {
      return true;
    }

    return false;
  }
}
