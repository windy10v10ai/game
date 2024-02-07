import { BaseHeroAIModifier } from "../hero/hero-base";
import { ModeBase } from "./mode-base";
import { ModeEnum } from "./mode-enum";

export class ModePush extends ModeBase {
  mode: ModeEnum = ModeEnum.PUSH;

  GetDesire(heroAI: BaseHeroAIModifier): number {
    // if time is less than 0:00, return 0
    const currentTime = heroAI.gameTime;
    let desire = 0;
    // 每过一分钟，增加0.05的desire
    desire = Math.floor(currentTime / 60) * 0.03;

    const heroLevel = heroAI.GetHero().GetLevel();
    if (heroLevel >= heroAI.PushLevel) {
      desire += 0.5;
      desire += 0.01 * (heroLevel - heroAI.PushLevel);
    }

    desire = Math.min(desire, 0.75);

    return desire;
  }
}
