import { BaseHeroAIModifier } from "../hero/hero-base";
import { ModeBase } from "./mode-base";
import { ModeEnum } from "./mode-enum";

export class ModeLaning extends ModeBase {
  mode: ModeEnum = ModeEnum.LANING;

  GetDesire(heroAI: BaseHeroAIModifier): number {
    // if time is less than 0:00, return 0
    const currentTime = heroAI.gameTime;
    let desire = 0;
    if (currentTime < 1) {
      desire = 0;
    } else if (heroAI.GetHero().GetLevel() < heroAI.PushLevel) {
      desire += 0.55;
    } else {
      // 不增加
    }

    desire = Math.min(desire, 0.7);
    desire = Math.max(desire, 0);
    return desire;
  }
}
