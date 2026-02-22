import { registerModifier } from '../../utils/dota_ts_adapter';
import { ActionAbility } from '../action/action-ability';
import { BotBaseAIModifier } from './bot-base';

@registerModifier(undefined, 'ai/hero/hero-medusa')
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

    // 分裂箭 开启
    if (
      ActionAbility.CastAbilityOnFindEnemyHero(this, 'medusa_split_shot', {
        target: { count: { gte: 2 }, range: 900 },
        action: { toggleOn: true },
      })
    ) {
      return true;
    }
    // 分裂箭 关闭
    if (
      ActionAbility.CastAbilityOnFindEnemyHero(this, 'medusa_split_shot', {
        target: { count: { lte: 1 }, range: 900 },
        ability: { level: { lte: 3 } },
        action: { toggleOff: true },
      })
    ) {
      return true;
    }

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

    // 分裂箭 开启
    if (
      ActionAbility.CastAbilityOnFindEnemyCreep(this, 'medusa_split_shot', {
        target: { count: { gte: 2 }, range: 900 },
        action: { toggleOn: true },
      })
    ) {
      return true;
    }
    // 分裂箭 关闭
    if (
      ActionAbility.CastAbilityOnFindEnemyCreep(this, 'medusa_split_shot', {
        target: { count: { lte: 1 }, range: 900 },
        ability: { level: { lte: 3 } },
        action: { toggleOff: true },
      })
    ) {
      return true;
    }

    return false;
  }
}
