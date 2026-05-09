import { BotBaseAIModifier } from '../hero/bot-base';
import { ModeBase } from './mode-base';
import { ModeEnum } from './mode-enum';

export class ModeLaning extends ModeBase {
  mode: ModeEnum = ModeEnum.LANING;

  GetDesire(heroAI: BotBaseAIModifier): number {
    let desire = 0;
    if (heroAI.GetHero().GetLevel() < heroAI.PushLevel) {
      desire += 0.55;
    } else {
      // 不增加
    }

    // 推进阶段后，Bot 大幅压低对线欲望
    if (GameRules.AI.BotTeam?.isAfterPhaseStart()) {
      desire *= 0.08;
      desire = Math.min(desire, 0.08);
    }

    desire = Math.min(desire, 0.7);
    desire = Math.max(desire, 0);
    return desire;
  }
}
