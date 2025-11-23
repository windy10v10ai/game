import { BotBaseAIModifier } from './hero/bot-base';
import { AbaddonAIModifier } from './hero/hero-abaddon';
import { AxeAIModifier } from './hero/hero-axe';
import { BaneAIModifier } from './hero/hero-bane';
import { BountyHunterAIModifier } from './hero/hero-bounty-hunter';
import { DrowRangerAIModifier } from './hero/hero-drow-ranger';
import { LionAIModifier } from './hero/hero-lion';
import { LunaAIModifier } from './hero/hero-luna';
import { MedusaAIModifier } from './hero/hero-medusa';
import { NecrolyteAIModifier } from './hero/hero-necrolyte';
import { ShadowShamanAIModifier } from './hero/hero-shadow-shaman';
import { SkeletonAIModifier } from './hero/hero-skeleton';
import { SniperAIModifier } from './hero/hero-sniper';
import { ViperAIModifier } from './hero/hero-viper';
import { FSA } from './mode/FSA';

export class AI {
  FSA: FSA;
  constructor() {
    this.FSA = new FSA();
  }

  public EnableAI(hero: CDOTA_BaseNPC_Hero) {
    this.appleAIModifier(hero, this.getModifierName(hero));
  }

  private getModifierName(hero: CDOTA_BaseNPC_Hero): string {
    if (hero.GetUnitName() === 'npc_dota_hero_abaddon') {
      return AbaddonAIModifier.name;
    }
    if (hero.GetUnitName() === 'npc_dota_hero_axe') {
      return AxeAIModifier.name;
    }
    if (hero.GetUnitName() === 'npc_dota_hero_bane') {
      return BaneAIModifier.name;
    }
    if (hero.GetUnitName() === 'npc_dota_hero_bounty_hunter') {
      return BountyHunterAIModifier.name;
    }
    if (hero.GetUnitName() === 'npc_dota_hero_lion') {
      return LionAIModifier.name;
    }
    if (hero.GetUnitName() === 'npc_dota_hero_viper') {
      return ViperAIModifier.name;
    }
    if (hero.GetUnitName() === 'npc_dota_hero_luna') {
      return LunaAIModifier.name;
    }
    if (hero.GetUnitName() === 'npc_dota_hero_sniper') {
      return SniperAIModifier.name;
    }
    if (hero.GetUnitName() === 'npc_dota_hero_medusa') {
      return MedusaAIModifier.name;
    }
    if (hero.GetUnitName() === 'npc_dota_hero_drow_ranger') {
      return DrowRangerAIModifier.name;
    }
    if (hero.GetUnitName() === 'npc_dota_hero_skeleton_king') {
      return SkeletonAIModifier.name;
    }
    if (hero.GetUnitName() === 'npc_dota_hero_shadow_shaman') {
      return ShadowShamanAIModifier.name;
    }
    if (hero.GetUnitName() === 'npc_dota_hero_necrolyte') {
      return NecrolyteAIModifier.name;
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
