import { GoldXPFilter } from './gold-xp-filter';
import { PlayerHelper } from '../helper/player-helper';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let global: any;
global.GameRules = {
  GetGameModeEntity: jest.fn().mockReturnValue({
    SetModifyGoldFilter: jest.fn(),
    SetModifyExperienceFilter: jest.fn(),
  }),
};
describe('GoldFilter', () => {
  let goldFilter: GoldXPFilter;

  beforeEach(() => {
    goldFilter = new GoldXPFilter();
  });

  describe('filterHeroKillGoldByMultiplier', () => {
    it('should return the same multiplier if it is less than or equal to 1', () => {
      expect(goldFilter.filterHeroKillGoldByMultiplier(0.5)).toBe(0.5);
      expect(goldFilter.filterHeroKillGoldByMultiplier(1)).toBe(1);
    });

    it('should reduce the multiplier correctly when it is greater than 1', () => {
      expect(goldFilter.filterHeroKillGoldByMultiplier(1.5)).toBeLessThan(1.5);
      expect(goldFilter.filterHeroKillGoldByMultiplier(1.5)).toBeGreaterThan(1);

      expect(goldFilter.filterHeroKillGoldByMultiplier(10)).toBeLessThan(10);
      expect(goldFilter.filterHeroKillGoldByMultiplier(10)).toBeGreaterThan(2);
    });
  });

  describe('filterHeroKillGold', () => {
    it.each([
      [0, 0],
      [400, 400],
      [1600, 1000],
      [3200, 1400],
      [6000, 1750],
    ])('should reduce the gold correctly when the multiplier is %f', (gold, expected) => {
      expect(goldFilter.filterHeroKillGold(gold)).toBe(expected);
    });
  });

  describe('kill share reward', () => {
    const RADIANT = 2 as DotaTeam;
    const DIRE = 3 as DotaTeam;
    const HERO_KILL_XP = 1;
    const CREEP_KILL_XP = 2;
    const HERO_KILL_GOLD = 12;

    function setup(team: DotaTeam, multiplayer: boolean, kills: number, teamKills: number): void {
      global.ModifyXpReason = { HERO_KILL: HERO_KILL_XP, CREEP_KILL: CREEP_KILL_XP };
      global.ModifyGoldReason = { HERO_KILL: HERO_KILL_GOLD };
      global.PlayerResource = {
        GetKills: () => kills,
        GetTeamKills: () => teamKills,
        GetTeam: () => team,
        GetPlayerCountForTeam: () => 3,
      };
      global.GameRules.GetDOTATime = () => 600;
      global.GameRules.Option = { radiantGoldXpMultiplier: 1, direGoldXpMultiplier: 1 };
      jest.spyOn(PlayerHelper, 'IsHumanPlayerByPlayerId').mockReturnValue(true);
      jest.spyOn(PlayerHelper, 'IsGoodTeamPlayer').mockReturnValue(team === RADIANT);
      jest.spyOn(PlayerHelper, 'IsMultiplayerGame').mockReturnValue(multiplayer);
    }

    function filterXP(reason: number): number {
      const args = { experience: 100, player_id_const: 0, reason_const: reason };
      (goldFilter as unknown as { filterXP(a: typeof args): boolean }).filterXP(args);
      return args.experience;
    }

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it.each([
      ['multiplayer radiant below threshold', RADIANT, true, 3, 4, 1],
      ['multiplayer radiant at threshold', RADIANT, true, 5, 6, 0.75],
      ['single player below threshold', RADIANT, false, 8, 9, 1],
      ['multiplayer dire below threshold', DIRE, true, 8, 9, 1],
    ])('rewardFilterByKill: %s', (_name, team, multiplayer, kills, teamKills, expected) => {
      setup(team, multiplayer, kills, teamKills);
      expect(goldFilter.rewardFilterByKill(0 as PlayerID)).toBeCloseTo(expected);
    });

    it('applies the same multiplier to multiplayer radiant hero kill xp', () => {
      setup(RADIANT, true, 5, 6);
      expect(filterXP(HERO_KILL_XP)).toBe(75);
    });

    it.each([
      ['single player', RADIANT, false],
      ['dire', DIRE, true],
    ])('keeps hero kill xp for %s', (_name, team, multiplayer) => {
      setup(team, multiplayer, 10, 12);
      expect(filterXP(HERO_KILL_XP)).toBe(100);
    });

    it('keeps creep kill xp in multiplayer', () => {
      setup(RADIANT, true, 5, 6);
      jest.spyOn(PlayerHelper, 'IsHumanPlayerByPlayerId').mockReturnValue(false);
      expect(filterXP(CREEP_KILL_XP)).toBe(100);
    });

    it('getHeroKillGold matches what the gold filter pays', () => {
      setup(RADIANT, true, 5, 6);
      const args = { gold: 200, player_id_const: 0, reason_const: HERO_KILL_GOLD, reliable: 1 };
      (goldFilter as unknown as { filterGold(a: typeof args): boolean }).filterGold(args);
      expect(goldFilter.getHeroKillGold(0 as PlayerID, 200)).toBe(150);
      expect(args.gold).toBe(150);
    });
  });

  describe('filterMultiplier', () => {
    it('should return the same multiplier if it is less than or equal to 1', () => {
      expect(goldFilter.filterMultiplier(0.5, 0.4)).toBe(0.5);
      expect(goldFilter.filterMultiplier(1, 0.4)).toBe(1);
    });

    it('should reduce the multiplier correctly when it is greater than 1', () => {
      expect(goldFilter.filterMultiplier(2, 0.4)).toBe(1.4);
      expect(goldFilter.filterMultiplier(6, 0.4)).toBe(3);
      expect(goldFilter.filterMultiplier(2, 0.5)).toBe(1.5);
      expect(goldFilter.filterMultiplier(2, 0.0)).toBe(1);
      expect(goldFilter.filterMultiplier(2, 1.0)).toBe(2);
    });
  });
});
