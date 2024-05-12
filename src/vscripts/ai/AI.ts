import { BaseHeroAIModifier } from "./hero/hero-base";
import { LionAIModifier } from "./hero/hero-lion";
import { LunaAIModifier } from "./hero/hero-luna";
import { ViperAIModifier } from "./hero/hero-viper";
import { FSA } from "./mode/FSA";

export class AI {
  FSA: FSA;
  constructor() {
    this.FSA = new FSA();
  }

  public EnableAI(hero: CDOTA_BaseNPC_Hero) {
    this.appleAIModifier(hero, this.getModifierName(hero));
  }

  private getModifierName(hero: CDOTA_BaseNPC_Hero): string {
    // if hero is npc_dota_hero_lion, return LionAIModifier.name
    if (hero.GetUnitName() === "npc_dota_hero_lion") {
      return LionAIModifier.name;
    }
    if (hero.GetUnitName() === "npc_dota_hero_viper") {
      return ViperAIModifier.name;
    }
    if (hero.GetUnitName() === "npc_dota_hero_luna") {
      return LunaAIModifier.name;
    }

    return BaseHeroAIModifier.name;
  }

  private appleAIModifier(hero: CDOTA_BaseNPC_Hero, modifierName: string) {
    if (hero.HasModifier(modifierName)) {
      hero.RemoveModifierByName(modifierName);
    }
    hero.AddNewModifier(hero, undefined, modifierName, {});
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
