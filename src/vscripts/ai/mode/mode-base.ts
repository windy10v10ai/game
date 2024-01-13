import { BaseHeroAIModifier } from "../hero/hero-base";
import { ModeEnum } from "./mode-enum";

export abstract class ModeBase {
  abstract mode: ModeEnum;

  abstract GetDesire(heroAI: BaseHeroAIModifier): number;
}
