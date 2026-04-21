import { BotBaseAIModifier } from '../hero/bot-base';
import { ModeEnum } from './mode-enum';

export abstract class ModeBase {
  abstract mode: ModeEnum;
  hysteresisBonus: number = 0.1;

  abstract GetDesire(heroAI: BotBaseAIModifier): number;
}
