import { registerAbilitySpecs } from './ability/specs';
import { BotBaseAIModifier } from './hero/bot-base';
import { registerItemSpecs } from './item/specs';
import { tinker_ai_modifier } from './hero/hero-tinker';
import { BotTeam } from './team/bot-team';

export class AI {
  BotTeam: BotTeam | undefined;
  constructor() {
    registerAbilitySpecs();
    registerItemSpecs();
  }

  public EnableAI(hero: CDOTA_BaseNPC_Hero) {
    this.appleAIModifier(hero, this.getModifierName(hero));
  }

  private getModifierName(hero: CDOTA_BaseNPC_Hero): string {
    if (hero.GetUnitName() === 'npc_dota_hero_tinker') {
      return tinker_ai_modifier.name;
    }

    return BotBaseAIModifier.name;
  }

  private appleAIModifier(hero: CDOTA_BaseNPC_Hero, modifierName: string) {
    if (hero.HasModifier(modifierName)) {
      hero.RemoveModifierByName(modifierName);
    }
    hero.AddNewModifier(hero, undefined, modifierName, {});
  }
}
