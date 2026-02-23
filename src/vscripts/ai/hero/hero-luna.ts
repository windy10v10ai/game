import { registerModifier } from '../../utils/dota_ts_adapter';
import { ActionAbility } from '../action/action-ability';
import { BotBaseAIModifier } from './bot-base';

@registerModifier('ai/hero/hero-luna')
export class LunaAIModifier extends BotBaseAIModifier {
  override UseAbilityEnemy(): boolean {
    // 环绕月刃
    if (
      ActionAbility.CastAbilityOnFindEnemyHero(this, 'luna_lunar_orbit', {
        target: { range: 200 },
        self: { unitCondition: { healthPercent: { lte: 95 } } },
      })
    ) {
      return true;
    }
    return false;
  }
}
