import { GameEndPlayerDto } from '../../../api/analytics/dto/game-end-dto';
import { GameEndPoint } from './game-end-point';

describe('GameEndPoint', () => {
  describe('GameEndPoint.CalculatePlayerScore', () => {
    it('should calculate score correctly for a player with no stats', () => {
      const player: GameEndPlayerDto = {
        heroName: 'npc_dota_hero_axe',
        steamId: 123456,
        teamId: 2,
        isDisconnected: false,
        level: 1,
        gold: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        damage: 0,
        damageTaken: 0,
        healing: 0,
        lastHits: 0,
        towerKills: 0,
        score: 0,
        battlePoints: 0,
      };

      const score = GameEndPoint.CalculatePlayerScore(player);
      expect(score).toBe(0);
    });

    it('should calculate score correctly for a single player', () => {
      const player: GameEndPlayerDto = {
        heroName: 'npc_dota_hero_axe',
        steamId: 123456,
        teamId: 2,
        isDisconnected: false,
        level: 1,
        gold: 0,
        kills: 120,
        deaths: 5,
        assists: 0,
        damage: 2000000,
        damageTaken: 100000,
        healing: 1000,
        lastHits: 0,
        towerKills: 9,
        score: 0,
        battlePoints: 0,
      };

      const score = GameEndPoint.CalculatePlayerScore(player);
      expect(score).toBe(35);
    });

    it('should calculate score correctly for a team player', () => {
      const player: GameEndPlayerDto = {
        heroName: 'npc_dota_hero_axe',
        steamId: 123456,
        teamId: 2,
        isDisconnected: false,
        level: 1,
        gold: 0,
        kills: 50,
        deaths: 10,
        assists: 100,
        damage: 1000000,
        damageTaken: 100000,
        healing: 20000,
        lastHits: 0,
        towerKills: 2,
        score: 0,
        battlePoints: 0,
      };

      const score = GameEndPoint.CalculatePlayerScore(player);
      expect(score).toBe(36);
    });

    it('should calculate score correctly for a player with extra high stats', () => {
      const player: GameEndPlayerDto = {
        heroName: 'npc_dota_hero_axe',
        steamId: 123456,
        teamId: 2,
        isDisconnected: false,
        level: 1,
        gold: 0,
        kills: 300,
        deaths: 0,
        assists: 10,
        damage: 100000000,
        damageTaken: 10000000,
        healing: 2000000,
        lastHits: 0,
        towerKills: 11,
        score: 0,
        battlePoints: 0,
      };

      const score = GameEndPoint.CalculatePlayerScore(player);
      expect(score).toBe(138);
    });
  });

  describe('GameEndPoint.GetGameTimePoints', () => {
    it('should return correct points for game time equal to 0', () => {
      const gameTime = 0;
      const points = GameEndPoint.GetGameTimePoints(gameTime);
      expect(points).toBe(0);
    });

    it('should return correct points for game time less than 2400', () => {
      const gameTime = 1800;
      const points = GameEndPoint.GetGameTimePoints(gameTime);
      expect(points).toBe(19);
    });

    it('should return correct points for game time equal to 2400', () => {
      const gameTime = 2400;
      const points = GameEndPoint.GetGameTimePoints(gameTime);
      expect(points).toBe(22);
    });

    it('should return correct points for game time greater than 2400', () => {
      const gameTime = 3600;
      const points = GameEndPoint.GetGameTimePoints(gameTime);
      expect(points).toBe(27);
    });
  });
});
