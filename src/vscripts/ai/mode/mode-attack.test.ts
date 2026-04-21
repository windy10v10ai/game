import { ModeAttack } from './mode-attack';
import { ActionFind } from '../action/action-find';
import { TeamCommander } from '../team/team-commander';
import { ModeEnum } from './mode-enum';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let global: any;

global.print = jest.fn(); // Dota Lua global not available in Jest
global.UnitTargetTeam = { FRIENDLY: 2, ENEMY: 4 };
global.UnitTargetType = { HERO: 1, CREEP: 2, BUILDING: 4 };
global.UnitTargetFlags = { NONE: 0, NOT_ILLUSIONS: 8, FOW_VISIBLE: 256, NO_INVIS: 512, INVULNERABLE: 128 };
global.FindOrder = { CLOSEST: 0 };

function makeHero(healthPercent: number, level: number): any {
  const maxHp = 1000;
  return {
    GetHealthPercent: () => healthPercent,
    GetHealth: () => Math.round(maxHp * healthPercent / 100),
    GetLevel: () => level,
    GetMana: () => 500,
    GetMaxMana: () => 500,
    GetAbilityByIndex: () => undefined,
  };
}

function makeHeroAI(mana: number, maxMana: number): any {
  return {
    mode: ModeEnum.LANING,
    gameTime: 0,
    aggressionBias: 1.0,
    GetHero: () => ({
      GetMana: () => mana,
      GetMaxMana: () => maxMana,
      GetTeamNumber: () => 2,
      GetHealthPercent: () => 100,
      GetHealth: () => 1000,
      GetLevel: () => 10,
      GetAbsOrigin: () => ({ x: 0, y: 0, z: 0 }),
      GetBaseAttackRange: () => 150,
    }),
    FindNearestEnemyTowerInvulnerable: () => undefined,
    aroundEnemyHeroes: [],
    aroundEnemyBuildingsInvulnerable: [],
  };
}

beforeEach(() => {
  (TeamCommander as any).instance = undefined;
  jest.spyOn(TeamCommander, 'getInstance').mockReturnValue({
    GetEnemyMissingCount: () => 0,
    GetGhostEnemyPower: () => 0,
    GetTargetClaimCount: () => 0,
    ClaimTarget: jest.fn(),
  } as any);
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

  describe('tower dive suppression', () => {
    function makeTowerInRange(): any {
      return {
        // GetDistanceToAttackRange returns distanceToRange <= 0 means in range
        // We mock HeroUtil via the heroAI's FindNearestEnemyTowerInvulnerable
      };
    }

    it('suppresses desire to near 0 when standing inside enemy tower range', () => {
      jest.spyOn(ActionFind, 'Find').mockReturnValue([makeHero(100, 20), makeHero(100, 20)]);
      jest.spyOn(ActionFind, 'FindEnemyHeroes').mockReturnValue([makeHero(100, 5)]);

      // heroAI returns a tower where HeroUtil.GetDistanceToAttackRange <= 0
      const heroAI = {
        mode: ModeEnum.LANING,
        gameTime: 0,
        aggressionBias: 1.0,
        GetHero: () => ({
          GetMana: () => 500,
          GetMaxMana: () => 500,
          GetTeamNumber: () => 2,
          GetHealthPercent: () => 100,
          GetHealth: () => 1000,
          GetLevel: () => 10,
          GetAbsOrigin: () => ({ x: 0, y: 0, z: 0 }),
          GetBaseAttackRange: () => 150,
          GetUnitName: () => 'npc_dota_hero_test',
        }),
        FindNearestEnemyTowerInvulnerable: () => ({
          GetAttackRange: () => 700,
          GetAbsOrigin: () => ({ __sub: () => ({ Length: () => 0 }) }),
        }),
        aroundEnemyHeroes: [],
        aroundEnemyBuildingsInvulnerable: [],
      };

      // Spy on HeroUtil to simulate being inside tower range
      const { HeroUtil } = require('../hero/hero-util');
      jest.spyOn(HeroUtil, 'GetDistanceToAttackRange').mockReturnValue(-100);

      const desire = attack.GetDesire(heroAI as any);
      expect(desire).toBeLessThan(0.1); // suppressed to ~8% max
    });

    it('does not suppress desire when bot is outside tower range', () => {
      jest.spyOn(ActionFind, 'Find').mockReturnValue([makeHero(100, 10)]);
      jest.spyOn(ActionFind, 'FindEnemyHeroes').mockReturnValue([makeHero(100, 10)]);

      // No nearby tower — FindNearestEnemyTowerInvulnerable returns undefined (default mock)
      const desireOutside = attack.GetDesire(makeHeroAI(500, 500));
      // Equal forces → ratio=1.0 → Logistic(1.0, 1.2, 5) ≈ 0.27, unmodified by tower
      expect(desireOutside).toBeGreaterThan(0.2);
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
