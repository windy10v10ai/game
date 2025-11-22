import { registerModifier } from '../../utils/dota_ts_adapter';
import { BotBaseAIModifier } from './bot-base';

@registerModifier()
export class AxeAIModifier extends BotBaseAIModifier {
  override useNewBuildSystem: boolean = true;
}
