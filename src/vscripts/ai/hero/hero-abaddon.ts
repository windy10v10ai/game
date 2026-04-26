import { registerModifier } from '../../utils/dota_ts_adapter';
import { BotBaseAIModifier } from './bot-base';

@registerModifier('ai/hero/hero-abaddon')
export class AbaddonAIModifier extends BotBaseAIModifier {
  override useNewBuildSystem: boolean = true;
}
