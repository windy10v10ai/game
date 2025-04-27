import { BotBaseAIModifier } from '../hero/bot-base';
import { ModeEnum } from './mode-enum';

export abstract class ModeBase {
  abstract mode: ModeEnum;

  abstract GetDesire(heroAI: BotBaseAIModifier): number;
}
