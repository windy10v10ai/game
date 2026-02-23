import { registerModifier } from '../../utils/dota_ts_adapter';
import { BotBaseAIModifier } from './bot-base';

@registerModifier('ai/hero/hero-bounty-hunter')
export class BountyHunterAIModifier extends BotBaseAIModifier {
  override useNewBuildSystem: boolean = true;
}
