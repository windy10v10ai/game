import { registerModifier } from '../../utils/dota_ts_adapter';
import { ActionAbility } from '../action/action-ability';
import { BotBaseAIModifier } from './bot-base';

@registerModifier()
export class LionAIModifier extends BotBaseAIModifier {
  override UseAbilityEnemy(): boolean {
    // 变羊
    if (ActionAbility.CastAbilityOnFindEnemyHero(this, 'lion_voodoo')) {
      return true;
    }
    // 裂地尖刺
    if (ActionAbility.CastAbilityOnFindEnemyHero(this, 'lion_impale')) {
      return true;
    }

    // 死亡一指
    if (
      ActionAbility.CastAbilityOnFindEnemyHero(this, 'lion_finger_of_death', {
        target: { unitCondition: { healthPercent: { lte: 95 } } },
      })
    ) {
      return true;
    }

    // 法力吸取
    if (ActionAbility.CastAbilityOnFindEnemyHero(this, 'lion_mana_drain')) {
      return true;
    }
    return false;
  }

  override UseAbilityCreep(): boolean {
    // 裂地尖刺
    if (
      ActionAbility.CastAbilityOnFindEnemyCreep(this, 'lion_impale', {
        ability: { level: { gte: 4 } },
      })
    ) {
      return true;
    }

    return false;
  }
}
