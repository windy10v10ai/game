import { registerModifier } from '../../utils/dota_ts_adapter';
import { BotBaseAIModifier } from './bot-base';

@registerModifier('ai/hero/hero-shadow-shaman')
export class ShadowShamanAIModifier extends BotBaseAIModifier {
  override UseAbilityEnemy(): boolean {
    return false;
  }

  override UseAbilityCreep(): boolean {
    return false;
  }
}
