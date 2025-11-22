import { registerModifier } from '../../utils/dota_ts_adapter';
import { BotBaseAIModifier } from './bot-base';

@registerModifier()
export class AbaddonAIModifier extends BotBaseAIModifier {
  override useNewBuildSystem: boolean = true;
}
