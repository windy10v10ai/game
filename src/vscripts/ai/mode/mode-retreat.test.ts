import { ModeRetreat } from './mode-retreat';
import { TeamCommander } from '../team/team-commander';
import { ModeEnum } from './mode-enum';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let global: any;

function makeMockHeroAI(overrides: {
  healthPercent?: number;
  level?: number;
  pushLevel?: number;
  nearestTower?: object | undefined;
  buildings?: object[];
  teamNumber?: number;
}): any {
  const {
    healthPercent = 100,
    level = 10,
    pushLevel = 10,
    nearestTower = undefined,
    buildings = [],
    teamNumber = 2, // DotaTeam.BADGUYS
  } = overrides;

  return {
    mode: ModeEnum.LANING,
    PushLevel: pushLevel,
    aroundEnemyBuildingsInvulnerable: buildings,
    GetHero: () => ({
      GetHealthPercent: () => healthPercent,
      GetLevel: () => level,
      GetTeamNumber: () => teamNumber,
    }),
    FindNearestEnemyTowerInvulnerable: () => nearestTower,
  };
}

beforeEach(() => {
  // Reset TeamCommander singleton between tests
  (TeamCommander as any).instance = undefined;
  // Provide a controlled GetEnemyMissingCount
  jest.spyOn(TeamCommander, 'getInstance').mockReturnValue({
    GetEnemyMissingCount: () => 0,
    UpdateGameState: jest.fn(),
  } as any);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ModeRetreat.GetDesire', () => {
  let retreat: ModeRetreat;

  beforeEach(() => {
    retreat = new ModeRetreat();
  });

  describe('health-based panic curve (Quadratic)', () => {
    it('returns 0 panic at 100% HP with no other threats', () => {
      const desire = retreat.GetDesire(makeMockHeroAI({ healthPercent: 100 }));
      expect(desire).toBeCloseTo(0);
    });

    it('returns 0 panic at 60% HP (boundary)', () => {
      const desire = retreat.GetDesire(makeMockHeroAI({ healthPercent: 60 }));
      expect(desire).toBeCloseTo(0);
    });

    it('returns 0.25 panic at 30% HP (quadratic midpoint)', () => {
      const desire = retreat.GetDesire(makeMockHeroAI({ healthPercent: 30 }));
      expect(desire).toBeCloseTo(0.25);
    });

    it('returns 1.0 panic at 0% HP (capped)', () => {
      const desire = retreat.GetDesire(makeMockHeroAI({ healthPercent: 0 }));
      expect(desire).toBeCloseTo(1.0);
    });

    it('panic grows non-linearly — 15% HP is much worse than halfway between 0 and 30', () => {
      const at15 = retreat.GetDesire(makeMockHeroAI({ healthPercent: 15 }));
      const at45 = retreat.GetDesire(makeMockHeroAI({ healthPercent: 45 }));
      expect(at15).toBeGreaterThan(at45 * 2);
    });
  });

  describe('missing enemy blackboard contribution', () => {
    beforeEach(() => {
      jest.restoreAllMocks();
    });

    function makeWithMissingCount(count: number): ModeRetreat {
      jest.spyOn(TeamCommander, 'getInstance').mockReturnValue({
        GetEnemyMissingCount: () => count,
        UpdateGameState: jest.fn(),
      } as any);
      return new ModeRetreat();
    }

    it('adds nothing when 0 enemies are missing', () => {
      const r = makeWithMissingCount(0);
      const desire = r.GetDesire(makeMockHeroAI({ healthPercent: 100 }));
      expect(desire).toBeCloseTo(0);
    });

    it('adds nothing when exactly 2 enemies are missing (threshold is >2)', () => {
      const r = makeWithMissingCount(2);
      const desire = r.GetDesire(makeMockHeroAI({ healthPercent: 100 }));
      expect(desire).toBeCloseTo(0);
    });

    it('adds 0.05 when 3 enemies are missing', () => {
      const r = makeWithMissingCount(3);
      const desire = r.GetDesire(makeMockHeroAI({ healthPercent: 100 }));
      expect(desire).toBeCloseTo(0.05);
    });

    it('adds 0.25 when 7 enemies are missing', () => {
      const r = makeWithMissingCount(7);
      const desire = r.GetDesire(makeMockHeroAI({ healthPercent: 100 }));
      expect(desire).toBeCloseTo(0.25);
    });

    it('stacks with health panic', () => {
      const r = makeWithMissingCount(3);
      // 30% HP = 0.25 panic + 3 missing = +0.05
      const desire = r.GetDesire(makeMockHeroAI({ healthPercent: 30 }));
      expect(desire).toBeCloseTo(0.30);
    });
  });

  describe('tower range contribution', () => {
    function makeTower(distanceBeyondRange: number): object {
      return {
        GetUnitName: () => 'npc_dota_goodguys_tower1_top',
        // HeroUtil.GetDistanceToAttackRange returns distanceBeyondRange
        // We test at desire level, so we need to mock HeroUtil
        // Instead we test through the overall desire change
      };
    }

    it('desire is 0 with no nearby tower at full health', () => {
      const desire = retreat.GetDesire(makeMockHeroAI({ healthPercent: 100, nearestTower: undefined }));
      expect(desire).toBeCloseTo(0);
    });
  });

  describe('desire is capped at 1.0', () => {
    it('does not exceed 1 even with 0% HP and many missing enemies', () => {
      jest.restoreAllMocks();
      jest.spyOn(TeamCommander, 'getInstance').mockReturnValue({
        GetEnemyMissingCount: () => 20,
        UpdateGameState: jest.fn(),
      } as any);
      const r = new ModeRetreat();
      const desire = r.GetDesire(makeMockHeroAI({ healthPercent: 0 }));
      expect(desire).toBe(1.0);
    });
  });
});
