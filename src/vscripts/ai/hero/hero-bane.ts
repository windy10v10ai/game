import { registerModifier } from '../../utils/dota_ts_adapter';
import { BotBaseAIModifier } from './bot-base';

@registerModifier(undefined, 'ai/hero/hero-bane')
export class BaneAIModifier extends BotBaseAIModifier {
  override useNewBuildSystem: boolean = true;
}
