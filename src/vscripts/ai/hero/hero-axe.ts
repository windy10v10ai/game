import { registerModifier } from '../../utils/dota_ts_adapter';
import { BotBaseAIModifier } from './bot-base';

@registerModifier(undefined, 'ai/hero/hero-axe')
export class AxeAIModifier extends BotBaseAIModifier {
  override useNewBuildSystem: boolean = true;
}
