import { GameEndPlayerDto } from '../../../api/analytics/dto/game-end-dto';
import { GameEndHelper } from './game-end-helper';

describe('GameEndHelper', () => {
  describe('GameEndHelper.CalculatePlayerScore', () => {
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

      const score = GameEndHelper.CalculatePlayerScore(player);
      expect(score).toBe(0);
    });

    it('should calculate score correctly for a player with some stats', () => {
      const player: GameEndPlayerDto = {
        heroName: 'npc_dota_hero_axe',
        steamId: 123456,
        teamId: 2,
        isDisconnected: false,
        level: 1,
        gold: 0,
        kills: 10,
        deaths: 5,
        assists: 8,
        damage: 5000,
        damageTaken: 3000,
        healing: 1000,
        lastHits: 0,
        towerKills: 3,
        score: 0,
        battlePoints: 0,
      };

      const score = GameEndHelper.CalculatePlayerScore(player);
      expect(score).toBe(11);
    });

    it('should calculate score correctly for a player with high stats', () => {
      const player: GameEndPlayerDto = {
        heroName: 'npc_dota_hero_axe',
        steamId: 123456,
        teamId: 2,
        isDisconnected: false,
        level: 1,
        gold: 0,
        kills: 100,
        deaths: 5,
        assists: 120,
        damage: 2000000,
        damageTaken: 500000,
        healing: 200000,
        lastHits: 0,
        towerKills: 3,
        score: 0,
        battlePoints: 0,
      };

      const score = GameEndHelper.CalculatePlayerScore(player);
      expect(score).toBe(56);
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

      const score = GameEndHelper.CalculatePlayerScore(player);
      expect(score).toBe(154);
    });
  });

  describe('GameEndHelper.GetGameTimePoints', () => {
    it('should return correct points for game time equal to 0', () => {
      const gameTime = 0;
      const points = GameEndHelper.GetGameTimePoints(gameTime);
      expect(points).toBe(0);
    });

    it('should return correct points for game time less than 2400', () => {
      const gameTime = 1800;
      const points = GameEndHelper.GetGameTimePoints(gameTime);
      expect(points).toBe(23);
    });

    it('should return correct points for game time equal to 2400', () => {
      const gameTime = 2400;
      const points = GameEndHelper.GetGameTimePoints(gameTime);
      expect(points).toBe(27);
    });

    it('should return correct points for game time greater than 2400', () => {
      const gameTime = 3600;
      const points = GameEndHelper.GetGameTimePoints(gameTime);
      expect(points).toBe(33);
    });
  });
});
