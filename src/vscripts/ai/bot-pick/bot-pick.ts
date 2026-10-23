import { IS_DEBUG_RUN } from '../../modules/debug/perf-config';
import { PlayerHelper } from '../../modules/helper/player-helper';
import { BotHeroEntry, GetRoleCaps, HeroRole, PickBalancedHeroIndex } from './balanced-pick';
import { BOT_HERO_POOL } from './bot-hero-pool';

// 禁用列表里的英雄名可能不带前缀，比较前统一去掉
function ShortName(heroName: string): string {
  return heroName.replace('npc_dota_hero_', '');
}

/** 选英雄阶段结束后按队伍空位补电脑，并按定位平衡每队阵容。 */
export class BotPick {
  static HeroPool: BotHeroEntry[] = [...BOT_HERO_POOL];

  static PickBotHeroes() {
    const bannedHeroes = GameRules.GetBannedHeroes();
    print(`[BotPick] bannedHeroes=${bannedHeroes.join(',')}`);

    const pickedNames = new Set<string>(bannedHeroes.map(ShortName));
    const teamRoles: Record<number, HeroRole[][]> = {
      [DotaTeam.GOODGUYS]: [],
      [DotaTeam.BADGUYS]: [],
    };
    PlayerHelper.ForEachPlayer((playerId) => {
      if (!PlayerHelper.IsHumanPlayerByPlayerId(playerId)) return;
      const heroName = PlayerResource.GetSelectedHeroName(playerId);
      pickedNames.add(ShortName(heroName));
      const entry = BotPick.HeroPool.find((hero) => hero.name === heroName);
      const team = PlayerResource.GetTeam(playerId);
      if (entry && teamRoles[team]) {
        teamRoles[team].push(entry.roles);
      }
    });
    const candidates = BotPick.HeroPool.filter((hero) => !pickedNames.has(ShortName(hero.name)));

    const isSinglePlayer = PlayerHelper.GetHumamPlayerCount() === 1;
    const teams = [
      { team: DotaTeam.BADGUYS, size: GameRules.Option.direPlayerNumber },
      { team: DotaTeam.GOODGUYS, size: GameRules.Option.radiantPlayerNumber },
    ];
    for (const { team, size } of teams) {
      const botNumber = size - PlayerResource.GetPlayerCountForTeam(team);
      const caps = GetRoleCaps(size, isSinglePlayer);
      const picked: string[] = [];
      for (let i = 0; i < botNumber; i++) {
        const hero = BotPick.TakeHero(candidates, teamRoles[team], caps);
        teamRoles[team].push(hero.roles);
        picked.push(ShortName(hero.name));
        Tutorial.AddBot(hero.name, '', 'unfair', team === DotaTeam.GOODGUYS);
      }
      print(
        `[BotPick] team=${team} size=${size} single=${isSinglePlayer} heroes=${picked.join(',')}`,
      );
    }

    GameRules.GetGameModeEntity().SetBotThinkingEnabled(true);
    Tutorial.StartTutorialMode();

    PlayerHelper.ForEachPlayer((playerId) => {
      if (PlayerHelper.IsBotPlayerByPlayerId(playerId)) {
        const startGold = GameRules.Option.startingGoldBot;
        PlayerResource.SetGold(playerId, startGold - 600, true);
      }
    });
  }

  private static TakeHero(
    candidates: BotHeroEntry[],
    teamRoles: HeroRole[][],
    caps: ReturnType<typeof GetRoleCaps>,
  ): BotHeroEntry {
    if (candidates.length === 0) {
      print('[ERROR] bot hero candidates is empty');
      return { name: 'npc_dota_hero_nevermore', roles: [] };
    }
    // 开发模式按名单顺序取，性能测试靠它固定出场英雄
    const index = IS_DEBUG_RUN
      ? 0
      : PickBalancedHeroIndex(candidates, teamRoles, caps, (max) => RandomInt(0, max - 1));
    return candidates.splice(index, 1)[0];
  }
}
