import { GameEndPlayerDto } from '../../../api/analytics/dto/game-end-dto';
import { GameEndPoint } from './game-end-point';

export function IsInToolsMode(): boolean {
  return true;
}

describe('GameEndPoint', () => {
  // 创建基础玩家数据
  const createBasePlayer = (overrides: Partial<GameEndPlayerDto> = {}): GameEndPlayerDto => ({
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
    facetId: 1,
    ...overrides,
  });

  describe('GameEndPoint.CalculatePlayerScore', () => {
    it('应该正确计算无数据玩家的分数', () => {
      const player = createBasePlayer();
      const score = GameEndPoint.CalculatePlayerScore(player);
      expect(score).toBe(0);
    });

    it('应该正确计算单人玩家的分数', () => {
      const player = createBasePlayer({
        kills: 120,
        deaths: 5,
        damage: 2000000,
        damageTaken: 100000,
        healing: 1000,
        towerKills: 9,
      });
      const score = GameEndPoint.CalculatePlayerScore(player);
      expect(score).toBe(36);
    });

    it('应该正确计算团队玩家的分数', () => {
      const player = createBasePlayer({
        kills: 50,
        deaths: 10,
        assists: 100,
        damage: 1000000,
        damageTaken: 100000,
        healing: 20000,
        towerKills: 2,
      });
      const score = GameEndPoint.CalculatePlayerScore(player);
      expect(score).toBe(40);
    });

    it('应该正确计算超高数据玩家的分数', () => {
      const player = createBasePlayer({
        kills: 300,
        assists: 10,
        damage: 100000000,
        damageTaken: 10000000,
        healing: 2000000,
        towerKills: 11,
      });
      const score = GameEndPoint.CalculatePlayerScore(player);
      expect(score).toBe(142);
    });
  });

  describe('GameEndPoint.GetGameTimePoints', () => {
    it('10分钟游戏得分', () => {
      const points = GameEndPoint.GetGameTimePoints(600); // 10分钟
      expect(points).toBe(9);
    });

    it('30分钟游戏得分', () => {
      const points = GameEndPoint.GetGameTimePoints(1800); // 30分钟
      expect(points).toBe(16);
    });

    it('60分钟游戏得分', () => {
      const points = GameEndPoint.GetGameTimePoints(3600); // 60分钟
      expect(points).toBe(23);
    });
  });

  describe('GameEndPoint.GetParticipationRateMultiplier', () => {
    it('团队杀为0的情况获得完整时间分', () => {
      const player = createBasePlayer({
        kills: 0,
        deaths: 0,
        assists: 0,
      });
      const multiplier = GameEndPoint.GetParticipationRateMultiplier(player, 0);
      expect(multiplier).toBe(1);
    });

    it('参战率低于5%的玩家应该获得0分', () => {
      const player = createBasePlayer({
        kills: 2,
        deaths: 1,
        assists: 2,
      });
      const multiplier = GameEndPoint.GetParticipationRateMultiplier(player, 100); // 总击杀100，玩家参与3次，参战率3%
      expect(multiplier).toBe(0);
    });

    it('参战率低于10%的玩家应该获得一半时间分', () => {
      const player = createBasePlayer({
        kills: 2,
        deaths: 1,
        assists: 7,
      });
      const multiplier = GameEndPoint.GetParticipationRateMultiplier(player, 100); // 总击杀100，玩家参与10次，参战率10%
      expect(multiplier).toBe(0.5);
    });

    it('参战率正好等于10%的玩家应该获得完整时间分', () => {
      const player = createBasePlayer({
        kills: 5,
        deaths: 1,
        assists: 5,
      });
      const multiplier = GameEndPoint.GetParticipationRateMultiplier(player, 100); // 总击杀100，玩家参与10次，参战率10%
      expect(multiplier).toBe(1);
    });

    it('参战率高于10%的玩家应该获得完整时间分', () => {
      const player = createBasePlayer({
        kills: 20,
        deaths: 8,
        assists: 50,
      });
      const multiplier = GameEndPoint.GetParticipationRateMultiplier(player, 100); // 总击杀100，玩家参与43次，参战率43%
      expect(multiplier).toBe(1);
    });
  });
});
