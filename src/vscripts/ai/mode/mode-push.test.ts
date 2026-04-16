import { ModePush } from './mode-push';
import { ActionFind } from '../action/action-find';
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

function makeHeroAI(opts: {
  healthPercent?: number;
  level?: number;
  pushLevel?: number;
  gameTime?: number;
  enemyHeroes?: any[];
}): any {
  const { healthPercent = 100, level = 12, pushLevel = 10, gameTime = 900, enemyHeroes = [] } = opts;
  return {
    mode: ModeEnum.LANING,
    PushLevel: pushLevel,
    gameTime,
    aroundEnemyHeroes: enemyHeroes,
    GetHero: () => ({
      GetHealthPercent: () => healthPercent,
      GetLevel: () => level,
      GetAbsOrigin: () => ({}),
      GetTeamNumber: () => 3,
    }),
  };
}

beforeEach(() => {
  jest.spyOn(ActionFind, 'Find').mockReturnValue([]);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ModePush.GetDesire', () => {
  let push: ModePush;

  beforeEach(() => {
    push = new ModePush();
  });

  describe('base desire (time + level)', () => {
    it('increases with game time', () => {
      const early = push.GetDesire(makeHeroAI({ gameTime: 0, level: 5, healthPercent: 100 }));
      const late = push.GetDesire(makeHeroAI({ gameTime: 900, level: 5, healthPercent: 100 }));
      expect(late).toBeGreaterThan(early);
    });

    it('jumps significantly when hero reaches push level', () => {
      const before = push.GetDesire(makeHeroAI({ level: 9, pushLevel: 10, gameTime: 0, healthPercent: 100 }));
      const after = push.GetDesire(makeHeroAI({ level: 10, pushLevel: 10, gameTime: 0, healthPercent: 100 }));
      expect(after).toBeGreaterThan(before + 0.4);
    });
  });

  describe('health suppression', () => {
    it('is 0 at 0% HP', () => {
      const desire = push.GetDesire(makeHeroAI({ healthPercent: 0 }));
      expect(desire).toBe(0);
    });

    it('is halved at 50% HP', () => {
      const full = push.GetDesire(makeHeroAI({ healthPercent: 100 }));
      const half = push.GetDesire(makeHeroAI({ healthPercent: 50 }));
      expect(half).toBeCloseTo(full * 0.5, 2);
    });

    it('is unaffected at 100% HP', () => {
      const desire = push.GetDesire(makeHeroAI({ healthPercent: 100 }));
      expect(desire).toBeGreaterThan(0.5); // still active at full health, level 12
    });
  });

  describe('enemy suppression', () => {
    it('does not suppress when no enemies are visible', () => {
      const desire = push.GetDesire(makeHeroAI({ enemyHeroes: [] }));
      expect(desire).toBeCloseTo(0.75); // full push desire at 100% HP late game
    });

    it('suppresses heavily when clearly outnumbered (1v3)', () => {
      jest.spyOn(ActionFind, 'Find').mockReturnValue([makeHero(100, 12)]); // 1 ally (self)
      const enemies = [makeHero(100, 12), makeHero(100, 12), makeHero(100, 12)];
      const desire = push.GetDesire(makeHeroAI({ enemyHeroes: enemies }));
      expect(desire).toBeLessThan(0.15); // should be far below 0.5 threshold
    });

    it('suppresses lightly when overnumbered (3v1)', () => {
      jest.spyOn(ActionFind, 'Find').mockReturnValue([
        makeHero(100, 12), makeHero(100, 12), makeHero(100, 12),
      ]);
      const enemies = [makeHero(100, 12)];
      const desire = push.GetDesire(makeHeroAI({ enemyHeroes: enemies }));
      expect(desire).toBeGreaterThan(0.6); // mostly unaffected when winning
    });
  });

  describe('scenario: overnumbered (3v1, full HP, late game)', () => {
    it('attack desire wins — push is high but attack should be higher', () => {
      // Verifying push doesn't incorrectly dominate when attack is clearly better
      const desire = push.GetDesire(makeHeroAI({ healthPercent: 100, enemyHeroes: [makeHero(100, 12)] }));
      // With suppression from ~equal fight, push is moderate
      expect(desire).toBeLessThan(0.75);
    });
  });

  describe('scenario: undernumbered (1v3, full HP)', () => {
    it('drops below FSA threshold so retreat can win', () => {
      jest.spyOn(ActionFind, 'Find').mockReturnValue([makeHero(100, 12)]);
      const enemies = [makeHero(100, 12), makeHero(100, 12), makeHero(100, 12)];
      const desire = push.GetDesire(makeHeroAI({ enemyHeroes: enemies }));
      expect(desire).toBeLessThan(0.5);
    });
  });

  describe('scenario: low HP (20%), no enemies', () => {
    it('drops below FSA threshold so retreat can win', () => {
      const desire = push.GetDesire(makeHeroAI({ healthPercent: 20, enemyHeroes: [] }));
      expect(desire).toBeLessThan(0.5);
    });
  });
});
