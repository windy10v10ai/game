import { BotBaseAIModifier } from '../hero/bot-base';

export class TeamCommander {
  private static instance: TeamCommander;

  private missingCountByTeam: Record<number, number> = {};
  private lastUpdateTimeByTeam: Record<number, number> = {};
  private readonly updateInterval: number = 1;

  private constructor() {}

  static getInstance(): TeamCommander {
    if (!TeamCommander.instance) {
      TeamCommander.instance = new TeamCommander();
    }
    return TeamCommander.instance;
  }

  GetEnemyMissingCount(team: DOTATeam_t): number {
    return this.missingCountByTeam[team] ?? 0;
  }

  UpdateGameState(allHeroes: BotBaseAIModifier[]): void {
    if (allHeroes.length === 0) return;

    const botTeam = allHeroes[0].GetHero().GetTeamNumber();
    const gameTime = GameRules.GetDOTATime(false, true);
    const lastUpdate = this.lastUpdateTimeByTeam[botTeam] ?? -999;

    if (gameTime - lastUpdate < this.updateInterval) {
      return;
    }
    this.lastUpdateTimeByTeam[botTeam] = gameTime;

    let missingCount = 0;
    for (let playerId = 0; playerId < 24; playerId++) {
      if (!PlayerResource.IsValidPlayerID(playerId)) continue;
      if (PlayerResource.GetTeam(playerId) === botTeam) continue;

      const hero = PlayerResource.GetSelectedHeroEntity(playerId);
      if (!hero || !hero.IsAlive()) continue;

      if (!IsLocationVisible(botTeam, hero.GetAbsOrigin())) {
        missingCount++;
      }
    }

    this.missingCountByTeam[botTeam] = missingCount;
  }
}
