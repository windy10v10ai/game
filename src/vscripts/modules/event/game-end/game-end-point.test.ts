import { GameEndPlayerDto } from '../../../api/analytics/dto/game-end-dto';
import { Option } from '../../option';
import { GameEndPoint, normalizeControlTime } from './game-end-point';

describe('GameEndPoint', () => {
  // 创建基础玩家数据
  const createBasePlayer = (overrides: Partial<GameEndPlayerDto> = {}): GameEndPlayerDto => ({
    heroName: 'npc_dota_hero_axe',
    steamId: 123456,
    playerId: 1,
    teamId: 2,
    isDisconnected: false,
    level: 1,
    totalGoldEarned: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
    heroDamage: 0,
    damageTaken: 0,
    healing: 0,
    lastHits: 0,
    towerKills: 0,
    stuns: 0,
    roshanKills: 0,
    score: 0,
    battlePoints: 0,
    awaken: 0,
    ...overrides,
  });

  describe('normalizeControlTime', () => {
    it('应该保留控制时间的绝对值并过滤非有限值', () => {
      expect(normalizeControlTime(4)).toBe(4);
      expect(normalizeControlTime(-4)).toBe(4);
      expect(normalizeControlTime(0)).toBe(0);
      expect(normalizeControlTime(Number.NaN)).toBe(0);
      expect(normalizeControlTime(Number.POSITIVE_INFINITY)).toBe(0);
    });

    it('应该取整到整数秒', () => {
      expect(normalizeControlTime(4.4)).toBe(4);
      expect(normalizeControlTime(4.5)).toBe(5);
      expect(normalizeControlTime(-4.5)).toBe(5);
    });
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
        heroDamage: 2000000,
        damageTaken: 100000,
        healing: 1000,
        towerKills: 9,
      });
      const score = GameEndPoint.CalculatePlayerScore(player);
      expect(score).toBe(37);
    });

    it('应该正确计算团队玩家的分数', () => {
      const player = createBasePlayer({
        kills: 50,
        deaths: 10,
        assists: 100,
        heroDamage: 1000000,
        damageTaken: 100000,
        healing: 20000,
        towerKills: 2,
      });
      const score = GameEndPoint.CalculatePlayerScore(player);
      expect(score).toBe(41);
    });

    it('应该正确计算超高数据玩家的分数', () => {
      const player = createBasePlayer({
        kills: 300,
        assists: 10,
        heroDamage: 100000000,
        damageTaken: 10000000,
        healing: 2000000,
        towerKills: 11,
      });
      const score = GameEndPoint.CalculatePlayerScore(player);
      expect(score).toBe(126);
    });

    it('应该为控制时间增加递减且封顶的分数', () => {
      expect(GameEndPoint.CalculatePlayerScore(createBasePlayer({ stuns: 400 }))).toBe(7);
      expect(GameEndPoint.CalculatePlayerScore(createBasePlayer({ stuns: 1000 }))).toBe(11);
      expect(GameEndPoint.CalculatePlayerScore(createBasePlayer({ stuns: 10000 }))).toBe(25);
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

  describe('GameEndPoint.GetCustomModeMultiplier', () => {
    // build default option
    const defaultOption = {
      radiantGoldXpMultiplier: 1.5,
      direGoldXpMultiplier: 2,
      radiantPlayerNumber: 10,
      direPlayerNumber: 10,
      towerPower: 200,
      startingGoldPlayer: 3000,
      startingGoldBot: 3000,
      respawnTimePercentage: 100,
      maxLevel: 50,
      forceRandomHero: false,
      enablePlayerAttribute: true,
      fixedAbility: 'none',
      gameDifficulty: 0,
    } as Option;
    it('默认选项应该返回1', () => {
      const option = defaultOption;
      const multiplier = GameEndPoint.GetCustomModeMultiplier(option);
      expect(multiplier).toBe(1);
    });

    it('天辉金钱经验倍率=1.2', () => {
      const option = { ...defaultOption, radiantGoldXpMultiplier: 1.2 } as Option;
      const multiplier = GameEndPoint.GetCustomModeMultiplier(option);
      expect(multiplier).toBe(1.1);
    });

    it('天辉金钱经验倍率>=2时', () => {
      const option = { ...defaultOption, radiantGoldXpMultiplier: 2 } as Option;
      const multiplier = GameEndPoint.GetCustomModeMultiplier(option);
      expect(multiplier).toBe(0.5);
    });

    it('天辉金钱经验倍率>=5时', () => {
      const option = { ...defaultOption, radiantGoldXpMultiplier: 5 } as Option;
      const multiplier = GameEndPoint.GetCustomModeMultiplier(option);
      expect(multiplier).toBe(0.2);
    });

    it('夜魇金钱经验倍率>=20时', () => {
      const option = { ...defaultOption, direGoldXpMultiplier: 20 } as Option;
      const multiplier = GameEndPoint.GetCustomModeMultiplier(option);
      expect(multiplier).toBe(2.3);
    });

    it('夜魇金钱经验倍率>=10时', () => {
      const option = { ...defaultOption, direGoldXpMultiplier: 10 } as Option;
      const multiplier = GameEndPoint.GetCustomModeMultiplier(option);
      expect(multiplier).toBe(1.9);
    });

    it('夜魇金钱经验倍率>=5时', () => {
      const option = { ...defaultOption, direGoldXpMultiplier: 5 } as Option;
      const multiplier = GameEndPoint.GetCustomModeMultiplier(option);
      expect(multiplier).toBe(1.5);
    });

    it('夜魇玩家数量为5时应该返回0.5', () => {
      const option = { ...defaultOption, direPlayerNumber: 5 } as Option;
      const multiplier = GameEndPoint.GetCustomModeMultiplier(option);
      expect(multiplier).toBe(0.5);
    });

    it('复活时间百分比<=10时应该返回0.7', () => {
      const option = { ...defaultOption, respawnTimePercentage: 10 } as Option;
      const multiplier = GameEndPoint.GetCustomModeMultiplier(option);
      expect(multiplier).toBe(0.7);
    });

    it('复活时间百分比<=50时应该返回0.9', () => {
      const option = { ...defaultOption, respawnTimePercentage: 50 } as Option;
      const multiplier = GameEndPoint.GetCustomModeMultiplier(option);
      expect(multiplier).toBe(0.9);
    });

    it('防御塔倍率<=150时', () => {
      const option = { ...defaultOption, towerPower: 150 } as Option;
      const multiplier = GameEndPoint.GetCustomModeMultiplier(option);
      expect(multiplier).toBe(0.9);
    });

    it('防御塔倍率>=600时', () => {
      const option = { ...defaultOption, towerPower: 600 } as Option;
      const multiplier = GameEndPoint.GetCustomModeMultiplier(option);
      expect(multiplier).toBe(0.9);
    });

    it('不启用玩家属性应该返回1.2', () => {
      const option = { ...defaultOption, enablePlayerAttribute: false } as Option;
      const multiplier = GameEndPoint.GetCustomModeMultiplier(option);
      expect(multiplier).toBe(1.2);
    });

    it('玩家金钱>=5000时应该-0.1', () => {
      const option = {
        ...defaultOption,
        direGoldXpMultiplier: 10,
        startingGoldPlayer: 5000,
      } as Option;
      const multiplier = GameEndPoint.GetCustomModeMultiplier(option);
      expect(multiplier).toBe(1.8);
    });

    it('电脑金钱<=3000时应该-0.1', () => {
      const option = {
        ...defaultOption,
        direGoldXpMultiplier: 10,
        startingGoldBot: 3000,
      } as Option;
      const multiplier = GameEndPoint.GetCustomModeMultiplier(option);
      expect(multiplier).toBe(1.9);
    });

    it('高难度多个条件组合', () => {
      const option = {
        ...defaultOption,
        radiantGoldXpMultiplier: 1.5,
        direGoldXpMultiplier: 10,
        towerPower: 350,
      } as Option;
      const multiplier = GameEndPoint.GetCustomModeMultiplier(option);
      expect(multiplier).toBe(1.9);
    });

    it('最高难度倍率', () => {
      const option = {
        ...defaultOption,
        radiantGoldXpMultiplier: 1,
        direGoldXpMultiplier: 20,
        towerPower: 400,
        enablePlayerAttribute: false,
      } as Option;
      const multiplier = GameEndPoint.GetCustomModeMultiplier(option);
      expect(multiplier).toBe(2.7);
    });

    it('固定技能时，降低倍率', () => {
      const option = {
        ...defaultOption,
        fixedAbility: 'medusa_split_shot',
      } as Option;
      const multiplier = GameEndPoint.GetCustomModeMultiplier(option);
      expect(multiplier).toBe(0.8);
    });

    it('最低倍率不低于0', () => {
      const option = {
        ...defaultOption,
        radiantGoldXpMultiplier: 5,
        direGoldXpMultiplier: 10,
        direPlayerNumber: 5,
        towerPower: 150,
      } as Option;
      const multiplier = GameEndPoint.GetCustomModeMultiplier(option);
      expect(multiplier).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GameEndPoint.IsExtremeCustomMode', () => {
    const defaultOption = {
      radiantGoldXpMultiplier: 1.5,
      direGoldXpMultiplier: 2,
      radiantPlayerNumber: 10,
      direPlayerNumber: 10,
      towerPower: 200,
      startingGoldPlayer: 3000,
      startingGoldBot: 3000,
      respawnTimePercentage: 100,
      maxLevel: 50,
      forceRandomHero: false,
      enablePlayerAttribute: true,
      fixedAbility: 'none',
      gameDifficulty: 0,
    } as Option;

    it('默认配置不算极端', () => {
      expect(GameEndPoint.IsExtremeCustomMode(defaultOption)).toBe(false);
    });

    it('秒活（复活时间百分比为下拉框最低档10）算极端', () => {
      const option = { ...defaultOption, respawnTimePercentage: 10 } as Option;
      expect(GameEndPoint.IsExtremeCustomMode(option)).toBe(true);
    });

    it('综合积分倍率低于1倍算极端', () => {
      const option = { ...defaultOption, radiantGoldXpMultiplier: 5 } as Option;
      expect(GameEndPoint.GetCustomModeMultiplier(option)).toBeLessThan(1);
      expect(GameEndPoint.IsExtremeCustomMode(option)).toBe(true);
    });

    it('综合积分倍率大于等于1倍且无其他极端项时不算极端', () => {
      const option = { ...defaultOption, direGoldXpMultiplier: 10 } as Option;
      expect(GameEndPoint.GetCustomModeMultiplier(option)).toBeGreaterThanOrEqual(1);
      expect(GameEndPoint.IsExtremeCustomMode(option)).toBe(false);
    });
  });
});
