import { BaseHeroAIModifier } from '../hero/hero-base';
import { ModeBase } from './mode-base';
import { ModeEnum } from './mode-enum';

export class ModeLaning extends ModeBase {
  mode: ModeEnum = ModeEnum.LANING;

  GetDesire(heroAI: BaseHeroAIModifier): number {
    let desire = 0;
    if (heroAI.GetHero().GetLevel() < heroAI.PushLevel) {
      desire += 0.55;
    } else {
      // 不增加
    }

    desire = Math.min(desire, 0.7);
    desire = Math.max(desire, 0);
    return desire;
  }
}
