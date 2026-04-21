import { ModeRetreat } from './mode-retreat';
import { ActionFind } from '../action/action-find';
import { TeamCommander } from '../team/team-commander';
import { ModeEnum } from './mode-enum';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let global: any;

global.UnitTargetTeam = { FRIENDLY: 2, ENEMY: 4 };
global.UnitTargetType = { HERO: 1, CREEP: 2, BUILDING: 4 };
global.UnitTargetFlags = { NONE: 0, NOT_ILLUSIONS: 8, FOW_VISIBLE: 256, NO_INVIS: 512, INVULNERABLE: 128 };
global.FindOrder = { CLOSEST: 0 };

function makeHero(healthPercent: number, level: number): any {
  return {
    GetHealthPercent: () => healthPercent,
    GetLevel: () => level,
    GetMana: () => 500,
    GetMaxMana: () => 500,
    GetAbilityByIndex: () => undefined,
  };
}

function makeMockHeroAI(overrides: {
  healthPercent?: number;
  level?: number;
  pushLevel?: number;
  nearestTower?: object | undefined;
  buildings?: object[];
  teamNumber?: number;
  enemyHeroes?: any[];
}): any {
  const {
    healthPercent = 100,
    level = 10,
    pushLevel = 10,
    nearestTower = undefined,
    buildings = [],
    teamNumber = 3,
    enemyHeroes = [],
  } = overrides;

  return {
    mode: ModeEnum.LANING,
    gameTime: 0,
    cautionBias: 1.0,
    PushLevel: pushLevel,
    aroundEnemyBuildingsInvulnerable: buildings,
    aroundEnemyHeroes: enemyHeroes,
    GetHero: () => ({
      GetHealthPercent: () => healthPercent,
      GetLevel: () => level,
      GetTeamNumber: () => teamNumber,
      GetAbsOrigin: () => ({ x: 0, y: 0, z: 0 }),
    }),
    FindNearestEnemyTowerInvulnerable: () => nearestTower,
  };
}

beforeEach(() => {
  (TeamCommander as any).instance = undefined;
  jest.spyOn(TeamCommander, 'getInstance').mockReturnValue({
    GetEnemyMissingCount: () => 0,
    GetGhostEnemyPower: () => 0,
    UpdateGameState: jest.fn(),
  } as any);
  jest.spyOn(ActionFind, 'Find').mockReturnValue([]);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ModeRetreat.GetDesire', () => {
  let retreat: ModeRetreat;

  beforeEach(() => {
    retreat = new ModeRetreat();
  });

  describe('health panic curve (Linear, 70% → 0%)', () => {
    it('returns 0 at 100% HP with no other threats', () => {
      expect(retreat.GetDesire(makeMockHeroAI({ healthPercent: 100 }))).toBeCloseTo(0);
    });

    it('returns 0 at 70% HP (boundary)', () => {
      expect(retreat.GetDesire(makeMockHeroAI({ healthPercent: 70 }))).toBeCloseTo(0);
    });

    it('returns ~0.29 at 50% HP', () => {
      // Linear(50, 70, 0) = 20/70 ≈ 0.286
      expect(retreat.GetDesire(makeMockHeroAI({ healthPercent: 50 }))).toBeCloseTo(0.286, 2);
    });

    it('reaches 0.5 threshold at ~35% HP', () => {
      // Linear(35, 70, 0) = 35/70 = 0.5
      expect(retreat.GetDesire(makeMockHeroAI({ healthPercent: 35 }))).toBeCloseTo(0.5, 2);
    });

    it('returns ~0.71 at 20% HP — beats suppressed push desire', () => {
      // Linear(20, 70, 0) = 50/70 ≈ 0.714
      expect(retreat.GetDesire(makeMockHeroAI({ healthPercent: 20 }))).toBeCloseTo(0.714, 2);
    });

    it('returns 1.0 at 0% HP (capped)', () => {
      expect(retreat.GetDesire(makeMockHeroAI({ healthPercent: 0 }))).toBeCloseTo(1.0);
    });

    it('grows proportionally (linear)', () => {
      const at20 = retreat.GetDesire(makeMockHeroAI({ healthPercent: 20 }));
      const at40 = retreat.GetDesire(makeMockHeroAI({ healthPercent: 40 }));
      // at 20%: 50/70=0.714, at 40%: 30/70=0.429 — at20 should be ~1.67× at40
      expect(at20 / at40).toBeCloseTo(50 / 30, 1);
    });
  });

  describe('outnumbered panic', () => {
    it('adds no desire when no enemies are visible', () => {
      expect(retreat.GetDesire(makeMockHeroAI({ healthPercent: 100, enemyHeroes: [] }))).toBeCloseTo(0);
    });

    it('adds 0 in an even fight (1v1, equal level/health)', () => {
      jest.spyOn(ActionFind, 'Find').mockReturnValue([makeHero(100, 10)]); // 1 ally
      const desire = retreat.GetDesire(makeMockHeroAI({
        healthPercent: 100,
        enemyHeroes: [makeHero(100, 10)], // 1 enemy
      }));
      // ratio = 1.0 → Linear(1.0, 1.0, 0) = 0
      expect(desire).toBeCloseTo(0);
    });

    it('adds 0.5 in a 1v2 situation (ratio ≈ 0.5)', () => {
      jest.spyOn(ActionFind, 'Find').mockReturnValue([makeHero(100, 10)]); // 1 ally
      const desire = retreat.GetDesire(makeMockHeroAI({
        healthPercent: 100,
        enemyHeroes: [makeHero(100, 10), makeHero(100, 10)], // 2 enemies
      }));
      // ratio = 10/20 = 0.5 → Linear(0.5, 1.0, 0) = 0.5
      expect(desire).toBeCloseTo(0.5, 1);
    });

    it('adds ~0.67 in a 1v3 situation — clearly above FSA threshold', () => {
      jest.spyOn(ActionFind, 'Find').mockReturnValue([makeHero(100, 10)]);
      const desire = retreat.GetDesire(makeMockHeroAI({
        healthPercent: 100,
        enemyHeroes: [makeHero(100, 10), makeHero(100, 10), makeHero(100, 10)],
      }));
      // ratio = 10/30 ≈ 0.33 → Linear(0.33, 1.0, 0) ≈ 0.67
      expect(desire).toBeGreaterThan(0.5);
    });

    it('adds 0 when overnumbered (ratio >= 1.0)', () => {
      jest.spyOn(ActionFind, 'Find').mockReturnValue([
        makeHero(100, 10), makeHero(100, 10), makeHero(100, 10),
      ]);
      const desire = retreat.GetDesire(makeMockHeroAI({
        healthPercent: 100,
        enemyHeroes: [makeHero(100, 10)], // 1 enemy vs 3 allies
      }));
      // ratio = 30/10 = 3.0 → Linear(3.0, 1.0, 0) clamped to 0
      expect(desire).toBeCloseTo(0);
    });

    it('stacks with health panic — low HP + outnumbered = high desire', () => {
      jest.spyOn(ActionFind, 'Find').mockReturnValue([makeHero(100, 10)]);
      const desire = retreat.GetDesire(makeMockHeroAI({
        healthPercent: 40,
        enemyHeroes: [makeHero(100, 10), makeHero(100, 10)], // 1v2
      }));
      // health: Linear(40, 70, 0) = 30/70 ≈ 0.429
      // outnumbered: Linear(0.5, 1.0, 0) = 0.5
      // total ≈ 0.929
      expect(desire).toBeCloseTo(0.929, 2);
    });
  });

  describe('missing enemy blackboard contribution', () => {
    function makeWithMissingCount(count: number): ModeRetreat {
      jest.restoreAllMocks();
      jest.spyOn(TeamCommander, 'getInstance').mockReturnValue({
        GetEnemyMissingCount: () => count,
        GetGhostEnemyPower: () => 0,
        UpdateGameState: jest.fn(),
      } as any);
      jest.spyOn(ActionFind, 'Find').mockReturnValue([]);
      return new ModeRetreat();
    }

    it('adds nothing when 0 or 2 enemies are missing', () => {
      expect(makeWithMissingCount(0).GetDesire(makeMockHeroAI({ healthPercent: 100 }))).toBeCloseTo(0);
      expect(makeWithMissingCount(2).GetDesire(makeMockHeroAI({ healthPercent: 100 }))).toBeCloseTo(0);
    });

    it('adds 0.05 when 3 enemies are missing', () => {
      expect(makeWithMissingCount(3).GetDesire(makeMockHeroAI({ healthPercent: 100 }))).toBeCloseTo(0.05);
    });

    it('adds 0.25 when 7 enemies are missing', () => {
      expect(makeWithMissingCount(7).GetDesire(makeMockHeroAI({ healthPercent: 100 }))).toBeCloseTo(0.25);
    });
  });

  describe('scenario: bot at 20% HP, no enemies (late game push)', () => {
    it('retreat desire (0.71) beats suppressed push desire (<0.15)', () => {
      const desire = retreat.GetDesire(makeMockHeroAI({ healthPercent: 20 }));
      expect(desire).toBeGreaterThan(0.5);
    });
  });

  describe('scenario: 1v3, full HP', () => {
    it('retreat triggers even at full health when badly outnumbered', () => {
      jest.spyOn(ActionFind, 'Find').mockReturnValue([makeHero(100, 10)]);
      const desire = retreat.GetDesire(makeMockHeroAI({
        healthPercent: 100,
        enemyHeroes: [makeHero(100, 10), makeHero(100, 10), makeHero(100, 10)],
      }));
      expect(desire).toBeGreaterThan(0.5);
    });
  });

  describe('desire cap', () => {
    it('does not exceed 1.0', () => {
      jest.restoreAllMocks();
      jest.spyOn(TeamCommander, 'getInstance').mockReturnValue({
        GetEnemyMissingCount: () => 20,
        GetGhostEnemyPower: () => 0,
        UpdateGameState: jest.fn(),
      } as any);
      jest.spyOn(ActionFind, 'Find').mockReturnValue([makeHero(100, 10)]);
      const r = new ModeRetreat();
      const desire = r.GetDesire(makeMockHeroAI({
        healthPercent: 0,
        enemyHeroes: [makeHero(100, 10), makeHero(100, 10), makeHero(100, 10)],
      }));
      expect(desire).toBe(1.0);
    });
  });
});
