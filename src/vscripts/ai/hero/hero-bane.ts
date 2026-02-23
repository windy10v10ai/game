import { registerModifier } from '../../utils/dota_ts_adapter';
import { BotBaseAIModifier } from './bot-base';

@registerModifier('ai/hero/hero-bane')
export class BaneAIModifier extends BotBaseAIModifier {
  override useNewBuildSystem: boolean = true;
}
