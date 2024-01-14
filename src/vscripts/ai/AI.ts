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

  // public InitTeamStrategy() {
  //   const base = this.FindEnemyBase();
  //   if (base) {
  //     // add modofiier to base
  //     print("[AI] InitTeamStrategy AddNewModifier TeamStrategy.");
  //     base.AddNewModifier(base, undefined, TeamStrategy.name, {});
  //   } else {
  //     // retry
  //     Timers.CreateTimer(1, () => {
  //       this.InitTeamStrategy();
  //     });
  //   }
  // }

  // // Find npc_dota_badguys_fort
  // public FindEnemyBase(): CDOTA_BaseNPC | undefined {
  //   const bases = Entities.FindAllByClassname("npc_dota_badguys_fort");
  //   if (bases.length > 0) {
  //     return bases[0] as CDOTA_BaseNPC;
  //   }
  //   return undefined;
  // }
}
