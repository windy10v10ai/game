import { registerModifier } from '../../utils/dota_ts_adapter';
import { BotBaseAIModifier } from './bot-base';

@registerModifier(undefined, 'ai/hero/hero-abaddon')
export class AbaddonAIModifier extends BotBaseAIModifier {
  override useNewBuildSystem: boolean = true;
}
