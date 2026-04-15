import { ModeAttack } from './mode-attack';
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
  };
}

function makeHeroAI(mana: number, maxMana: number): any {
  return {
    mode: ModeEnum.LANING,
    GetHero: () => ({
      GetMana: () => mana,
      GetMaxMana: () => maxMana,
      GetTeamNumber: () => 2,
      GetHealthPercent: () => 100,
      GetLevel: () => 10,
      GetAbsOrigin: () => ({}),
    }),
    FindNearestEnemyTowerInvulnerable: () => undefined,
    aroundEnemyBuildingsInvulnerable: [],
  };
}

beforeEach(() => {
  jest.spyOn(ActionFind, 'Find').mockReturnValue([]);
  jest.spyOn(ActionFind, 'FindEnemyHeroes').mockReturnValue([]);
  jest.spyOn(ActionFind, 'FindTeamBuildingsInvulnerable').mockReturnValue([]);
  jest.spyOn(ActionFind, 'FindEnemyBuildingsInvulnerable').mockReturnValue([]);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ModeAttack.GetDesire', () => {
  let attack: ModeAttack;

  beforeEach(() => {
    attack = new ModeAttack();
  });

  describe('no-enemy guard', () => {
    it('returns 0 when no enemies are visible', () => {
      jest.spyOn(ActionFind, 'FindEnemyHeroes').mockReturnValue([]);
      const desire = attack.GetDesire(makeHeroAI(500, 500));
      expect(desire).toBe(0);
    });
  });

  describe('superiority ratio → desire', () => {
    it('returns high desire when allies are clearly stronger', () => {
      // 3 allies at full health level 10 vs 1 enemy at 50% health level 5
      jest.spyOn(ActionFind, 'Find').mockReturnValue([
        makeHero(100, 10),
        makeHero(100, 10),
        makeHero(100, 10),
      ]);
      jest.spyOn(ActionFind, 'FindEnemyHeroes').mockReturnValue([makeHero(50, 5)]);

      const desire = attack.GetDesire(makeHeroAI(500, 500));
      expect(desire).toBeGreaterThan(0.6);
    });

    it('returns low desire when enemies are clearly stronger', () => {
      // 1 ally at 30% health level 5 vs 3 enemies at full health level 10
      jest.spyOn(ActionFind, 'Find').mockReturnValue([makeHero(30, 5)]);
      jest.spyOn(ActionFind, 'FindEnemyHeroes').mockReturnValue([
        makeHero(100, 10),
        makeHero(100, 10),
        makeHero(100, 10),
      ]);

      const desire = attack.GetDesire(makeHeroAI(500, 500));
      expect(desire).toBeLessThan(0.15);
    });

    it('returns ~0.5 desire at the 1.2x superiority midpoint', () => {
      // ally power = 12, enemy power = 10 → ratio = 1.2 → Logistic = 0.5
      jest.spyOn(ActionFind, 'Find').mockReturnValue([makeHero(100, 12)]);
      jest.spyOn(ActionFind, 'FindEnemyHeroes').mockReturnValue([makeHero(100, 10)]);

      const desire = attack.GetDesire(makeHeroAI(500, 500));
      // mana ratio = 1.0, so desire ≈ 0.5
      expect(desire).toBeCloseTo(0.5, 1);
    });
  });

  describe('mana ratio multiplier', () => {
    beforeEach(() => {
      // Set up a scenario with clear superiority so base desire is high
      jest.spyOn(ActionFind, 'Find').mockReturnValue([makeHero(100, 20)]);
      jest.spyOn(ActionFind, 'FindEnemyHeroes').mockReturnValue([makeHero(100, 10)]);
    });

    it('scales desire to near 0 when hero has no mana', () => {
      const desire = attack.GetDesire(makeHeroAI(0, 500));
      expect(desire).toBeCloseTo(0);
    });

    it('does not reduce desire when hero has full mana', () => {
      const fullMana = attack.GetDesire(makeHeroAI(500, 500));
      const halfMana = attack.GetDesire(makeHeroAI(250, 500));
      expect(fullMana).toBeGreaterThan(halfMana);
    });

    it('defaults mana ratio to 1 when maxMana is 0 (manaless hero)', () => {
      const desire = attack.GetDesire(makeHeroAI(0, 0));
      // mana ratio = 1 since maxMana=0, so desire should be > 0
      expect(desire).toBeGreaterThan(0);
    });
  });

  describe('tower power bonus', () => {
    it('adds +2 to ally power when allied tower is within 800', () => {
      jest.spyOn(ActionFind, 'Find').mockReturnValue([makeHero(100, 5)]);
      jest.spyOn(ActionFind, 'FindEnemyHeroes').mockReturnValue([makeHero(100, 5)]);
      jest.spyOn(ActionFind, 'FindTeamBuildingsInvulnerable').mockReturnValue([{}] as any);

      const withTower = attack.GetDesire(makeHeroAI(500, 500));

      jest.spyOn(ActionFind, 'FindTeamBuildingsInvulnerable').mockReturnValue([]);
      const withoutTower = attack.GetDesire(makeHeroAI(500, 500));

      expect(withTower).toBeGreaterThan(withoutTower);
    });

    it('adds +2 to enemy power when enemy tower is within 800', () => {
      jest.spyOn(ActionFind, 'Find').mockReturnValue([makeHero(100, 5)]);
      jest.spyOn(ActionFind, 'FindEnemyHeroes').mockReturnValue([makeHero(100, 5)]);
      jest.spyOn(ActionFind, 'FindEnemyBuildingsInvulnerable').mockReturnValue([{}] as any);

      const withEnemyTower = attack.GetDesire(makeHeroAI(500, 500));

      jest.spyOn(ActionFind, 'FindEnemyBuildingsInvulnerable').mockReturnValue([]);
      const withoutEnemyTower = attack.GetDesire(makeHeroAI(500, 500));

      expect(withEnemyTower).toBeLessThan(withoutEnemyTower);
    });
  });

  describe('desire cap', () => {
    it('is capped at 0.8', () => {
      // Overwhelming ally superiority
      jest.spyOn(ActionFind, 'Find').mockReturnValue([
        makeHero(100, 25), makeHero(100, 25), makeHero(100, 25),
      ]);
      jest.spyOn(ActionFind, 'FindEnemyHeroes').mockReturnValue([makeHero(1, 1)]);

      const desire = attack.GetDesire(makeHeroAI(500, 500));
      expect(desire).toBeLessThanOrEqual(0.8);
    });
  });
});
