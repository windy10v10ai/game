import { PlayerHelper } from '../helper/player-helper';
import { HeroFacetConfig } from './hero-facet-config';

export class HeroPick {
static PickHumanHeroes() {
  PlayerHelper.ForEachPlayer((playerId) => {
    if (PlayerHelper.IsHumanPlayerByPlayerId(playerId)) {
      // 只有当 sameHeroSelection 为 true 时才强制随机
      if (GameRules.Option.sameHeroSelection) {
        // 强制随机模式:忽略玩家选择,直接随机
        PlayerResource.GetPlayer(playerId)?.MakeRandomHeroSelection();
      } else {
        // 正常模式:只为未选择的玩家随机
        if (!PlayerResource.HasSelectedHero(playerId)) {
          PlayerResource.GetPlayer(playerId)?.MakeRandomHeroSelection();
        }
      }
    }
  });
}

  static PickBotHeroes() {
    math.randomseed(GameRules.GetGameTime());

    const nameList = HeroPick.BotNameList;

    const radiantPlayerNumberCurrent = PlayerResource.GetPlayerCountForTeam(DotaTeam.GOODGUYS);
    const direPlayerNumberCurrent = PlayerResource.GetPlayerCountForTeam(DotaTeam.BADGUYS);

    const radiantBotNumber = GameRules.Option.radiantPlayerNumber - radiantPlayerNumberCurrent;
    const direBotNumberNumber = GameRules.Option.direPlayerNumber - direPlayerNumberCurrent;

    print(`radiantBotNumber: ${radiantBotNumber}`);
    print(`direBotNumberNumber: ${direBotNumberNumber}`);

    // 移除玩家已经选择的英雄
    PlayerHelper.ForEachPlayer((playerId) => {
      if (PlayerHelper.IsHumanPlayerByPlayerId(playerId)) {
        const heroName = PlayerResource.GetSelectedHeroName(playerId);
        const index = nameList.indexOf(heroName);
        if (index >= 0) {
          nameList.splice(index, 1);
        }
      }
    });

    const player = PlayerResource.GetPlayer(0) as CDOTAPlayerController;
    for (let i = 0; i < direBotNumberNumber; i++) {
      const heroName = HeroPick.GetHeroName(nameList);
      const facetId = HeroFacetConfig.getRandomFacetId(heroName);
      if (i === 0) {
        // 第一个bot使用教程，不然所有bot都不会动
        Tutorial.AddBot(heroName, '', 'unfair', false);
      } else {
        DebugCreateHeroWithVariant(
          player,
          heroName,
          facetId,
          DotaTeam.BADGUYS,
          false,
          (_hero: CDOTA_BaseNPC_Hero) => {},
        );
      }
    }

    for (let i = 0; i < radiantBotNumber; i++) {
      const heroName = HeroPick.GetHeroName(nameList);
      const facetId = HeroFacetConfig.getRandomFacetId(heroName);

      DebugCreateHeroWithVariant(
        player,
        heroName,
        facetId,
        DotaTeam.GOODGUYS,
        false,
        (_hero: CDOTA_BaseNPC_Hero) => {},
      );
    }

    GameRules.GetGameModeEntity().SetBotThinkingEnabled(true);
    Tutorial.StartTutorialMode();

    // 添加初始金钱 bot
    PlayerHelper.ForEachPlayer((playerId) => {
      if (PlayerHelper.IsBotPlayerByPlayerId(playerId)) {
        const startGold = GameRules.Option.startingGoldBot;
        PlayerResource.SetGold(playerId, startGold - 600, true);
      }
    });
  }

  static GetHeroName(nameList: string[]): string {
    if (nameList.length === 0) {
      // 如果没有英雄了，就随机一个，不过这个应该不会发生
      print('[ERROR] nameList is empty');
      return 'npc_dota_hero_nevermore';
    }
    // 开发模式英雄顺序固定
    const i = IsInToolsMode() ? 0 : RandomInt(0, nameList.length - 1);
    const name = nameList[i];
    nameList.splice(i, 1);
    return name;
  }

  static BotNameList = [
    //"npc_dota_hero_invoker",
    //"npc_dota_hero_antimage", // 不会放技能，只会物品和A人
    //"npc_dota_hero_spirit_breaker", // 不会放技能，只会物品和A人
    //"npc_dota_hero_silencer", // 不会放技能，只会物品和A人
    //"npc_dota_hero_mirana", // 不会放技能，只会物品和A人
    //"npc_dota_hero_furion", // 不会放技能，只会物品和A人
    //"npc_dota_hero_huskar", // 不会放技能，只会物品和A人
    //"npc_dota_hero_batrider",
    //"npc_dota_hero_obsidian_destroyer",
    //"npc_dota_hero_enchantress",
    //"npc_dota_hero_snapfire",
    //"npc_dota_hero_broodmother",
    //"npc_dota_hero_lycan",
    //"npc_dota_hero_arc_warden",
    //"npc_dota_hero_ancient_apparition",
    //"npc_dota_hero_treant",
    //"npc_dota_hero_rubick",
    //"npc_dota_hero_shredder",
    //"npc_dota_hero_razor", // 在泉水站着完全不动
    //"npc_dota_hero_tidehunter", // 在泉水站着完全不动
    'npc_dota_hero_abaddon',
    'npc_dota_hero_axe',
    'npc_dota_hero_bane',
    'npc_dota_hero_bounty_hunter',
    'npc_dota_hero_bloodseeker',
    'npc_dota_hero_bristleback',
    'npc_dota_hero_chaos_knight',
    'npc_dota_hero_crystal_maiden',
    'npc_dota_hero_dazzle',
    'npc_dota_hero_death_prophet',
    'npc_dota_hero_dragon_knight',
    'npc_dota_hero_drow_ranger',
    'npc_dota_hero_earthshaker',
    'npc_dota_hero_jakiro',
    'npc_dota_hero_juggernaut',
    'npc_dota_hero_kunkka',
    'npc_dota_hero_lich',
    'npc_dota_hero_lina',
    'npc_dota_hero_lion',
    'npc_dota_hero_luna',
    'npc_dota_hero_medusa',
    'npc_dota_hero_meepo',
    'npc_dota_hero_necrolyte',
    'npc_dota_hero_nevermore',
    'npc_dota_hero_ogre_magi',
    'npc_dota_hero_omniknight',
    'npc_dota_hero_oracle',
    'npc_dota_hero_phantom_assassin',
    'npc_dota_hero_pudge',
    'npc_dota_hero_riki',
    'npc_dota_hero_sand_king',
    'npc_dota_hero_shadow_shaman',
    'npc_dota_hero_skywrath_mage',
    'npc_dota_hero_sniper',
    'npc_dota_hero_spectre',
    'npc_dota_hero_sven',
    'npc_dota_hero_tinker',
    'npc_dota_hero_tiny',
    'npc_dota_hero_vengefulspirit',
    'npc_dota_hero_viper',
    'npc_dota_hero_warlock',
    'npc_dota_hero_windrunner',
    'npc_dota_hero_witch_doctor',
    'npc_dota_hero_skeleton_king',
    'npc_dota_hero_zuus',
  ];
}
