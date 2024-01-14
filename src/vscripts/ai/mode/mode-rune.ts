import { BaseHeroAIModifier } from "../hero/hero-base";
import { ModeBase } from "./mode-base";
import { ModeEnum } from "./mode-enum";

export class ModeRune extends ModeBase {
  mode: ModeEnum = ModeEnum.RUNE;

  GetDesire(heroAI: BaseHeroAIModifier): number {
    const currentTime = heroAI.gameTime;
    if (currentTime > 0) {
      return 0;
    } else {
      return 0.6;
    }
  }
}
