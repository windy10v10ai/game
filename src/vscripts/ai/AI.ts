import { BaseHeroAIModifier } from "./hero/hero-base";
import { FSA } from "./mode/FSA";

export class AI {
  FSA: FSA;
  constructor() {
    this.FSA = new FSA();
  }

  // enable AI for hero
  public EnableAI(hero: CDOTA_BaseNPC_Hero) {
    if (hero.HasModifier(BaseHeroAIModifier.name)) {
      // remove old modifier
      print(`[AI] EnableAI RemoveModifierByName ${hero.GetUnitName()}`);
      hero.RemoveModifierByName(BaseHeroAIModifier.name);
    }
    hero.AddNewModifier(hero, undefined, BaseHeroAIModifier.name, {});
  }
}
