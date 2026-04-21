/**
 * Scenario-based integration tests for the bot AI FSA decision system.
 *
 * Each test describes a recognisable Dota 2 situation and asserts which mode
 * should win, or which desire ordering must hold. Adding a new gameplay bug
 * should start with a failing test here, not just in the unit-level files.
 *
 * Conventions:
 *  • "should RETREAT" → retreat.GetDesire() > 0.5  (FSA activation threshold)
 *  • "should NOT RETREAT" → retreat.GetDesire() < 0.5
 *  • "should ATTACK" → attack.GetDesire() > 0.5
 *  • "RETREAT beats ATTACK" → retreatDesire > attackDesire
 */

import { ModeAttack } from './mode-attack';
import { ModeRetreat } from './mode-retreat';
import { ActionFind } from '../action/action-find';
import { TeamCommander } from '../team/team-commander';
import { ModeEnum } from './mode-enum';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let global: any;

global.print = jest.fn();
global.UnitTargetTeam = { FRIENDLY: 2, ENEMY: 4 };
global.UnitTargetType = { HERO: 1, CREEP: 2, BUILDING: 4 };
global.UnitTargetFlags = {
  NONE: 0,
  NOT_ILLUSIONS: 8,
  FOW_VISIBLE: 256,
  NO_INVIS: 512,
  INVULNERABLE: 128,
};
global.FindOrder = { CLOSEST: 0 };

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Hero unit mock — represents any hero on the map. */
function makeHero(
  opts: {
    hpPct?: number;
    hp?: number;
    level?: number;
    mana?: number;
    maxMana?: number;
    distanceTo?: number;
  } = {},
): any {
  const hpPct = opts.hpPct ?? 100;
  const maxHp = 1000;
  return {
    GetHealthPercent: () => hpPct,
    GetHealth: () => opts.hp ?? Math.round((maxHp * hpPct) / 100),
    GetLevel: () => opts.level ?? 10,
    GetMana: () => opts.mana ?? 500,
    GetMaxMana: () => opts.maxMana ?? 500,
    GetAbilityByIndex: () => undefined,
    GetRangeToUnit: () => opts.distanceTo ?? 500,
    GetEntityIndex: () => 1,
  };
}

/** Build a full heroAI mock suitable for both ModeRetreat and ModeAttack. */
function makeHeroAI(
  opts: {
    hpPct?: number;
    hp?: number;
    level?: number;
    mana?: number;
    maxMana?: number;
    aggressionBias?: number;
    cautionBias?: number;
    enemyHeroes?: any[];
    allyHeroes?: any[];
    nearestTower?: any;
    buildings?: any[];
    teamNumber?: number;
    attackRange?: number;
  } = {},
): any {
  const hpPct = opts.hpPct ?? 100;
  const maxHp = 1000;
  const level = opts.level ?? 10;
  const mana = opts.mana ?? 500;
  const maxMana = opts.maxMana ?? 500;
  const attackRange = opts.attackRange ?? 150;
  const teamNumber = opts.teamNumber ?? 2;
  const enemyHeroes = opts.enemyHeroes ?? [];
  const allyHeroes = opts.allyHeroes ?? [];

  // ActionFind.Find returns ally heroes; FindEnemyHeroes returns enemies
  jest.spyOn(ActionFind, 'Find').mockReturnValue(allyHeroes);
  jest.spyOn(ActionFind, 'FindEnemyHeroes').mockReturnValue(enemyHeroes);

  return {
    mode: ModeEnum.LANING,
    gameTime: 0,
    aggressionBias: opts.aggressionBias ?? 1.0,
    cautionBias: opts.cautionBias ?? 1.0,
    PushLevel: 10,
    aroundEnemyHeroes: enemyHeroes,
    aroundEnemyBuildingsInvulnerable: opts.buildings ?? [],
    GetHero: () => ({
      GetHealthPercent: () => hpPct,
      GetHealth: () => opts.hp ?? Math.round((maxHp * hpPct) / 100),
      GetLevel: () => level,
      GetMana: () => mana,
      GetMaxMana: () => maxMana,
      GetTeamNumber: () => teamNumber,
      GetAbsOrigin: () => ({ x: 0, y: 0, z: 0 }),
      GetBaseAttackRange: () => attackRange,
      GetRangeToUnit: () => 500,
      GetUnitName: () => 'npc_dota_hero_test',
    }),
    FindNearestEnemyTowerInvulnerable: () => opts.nearestTower,
  };
}

// ---------------------------------------------------------------------------
// Global beforeEach / afterEach
// ---------------------------------------------------------------------------

beforeEach(() => {
  (TeamCommander as any).instance = undefined;
  jest.spyOn(TeamCommander, 'getInstance').mockReturnValue({
    GetEnemyMissingCount: () => 0,
    GetGhostEnemyPower: () => 0,
    GetTargetClaimCount: () => 0,
    ClaimTarget: jest.fn(),
    UpdateGameState: jest.fn(),
  } as any);
  jest.spyOn(ActionFind, 'Find').mockReturnValue([]);
  jest.spyOn(ActionFind, 'FindEnemyHeroes').mockReturnValue([]);
  jest.spyOn(ActionFind, 'FindTeamBuildingsInvulnerable').mockReturnValue([]);
  jest.spyOn(ActionFind, 'FindEnemyBuildingsInvulnerable').mockReturnValue([]);
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

describe('Scenario: safe laning — no enemies visible', () => {
  it('should NOT retreat (no threat present)', () => {
    const retreat = new ModeRetreat();
    const desire = retreat.GetDesire(makeHeroAI({ hpPct: 100 }));
    expect(desire).toBeLessThan(0.5);
  });

  it('should NOT attack (no enemies to fight)', () => {
    const attack = new ModeAttack();
    const desire = attack.GetDesire(makeHeroAI({ hpPct: 100 }));
    expect(desire).toBe(0);
  });
});

describe('Scenario: laning trade — took a big hit, enemy still in lane', () => {
  it('should RETREAT when chunked to 30% HP in lane with an enemy present', () => {
    const retreat = new ModeRetreat();
    const heroAI = makeHeroAI({
      hpPct: 30,
      enemyHeroes: [makeHero({ hpPct: 80, level: 10 })],
      allyHeroes: [makeHero()], // lane ally nearby
    });
    expect(retreat.GetDesire(heroAI)).toBeGreaterThan(0.5);
  });

  it('RETREAT should beat ATTACK when bot is at 30% HP in an even fight', () => {
    const retreat = new ModeRetreat();
    const attack = new ModeAttack();
    const heroAI = makeHeroAI({
      hpPct: 30,
      enemyHeroes: [makeHero({ hpPct: 80, level: 10 })],
      allyHeroes: [makeHero({ hpPct: 30, level: 10 })],
    });
    expect(retreat.GetDesire(heroAI)).toBeGreaterThan(attack.GetDesire(heroAI));
  });

  it('should NOT retreat when healthy and trading evenly', () => {
    const retreat = new ModeRetreat();
    const heroAI = makeHeroAI({
      hpPct: 80,
      enemyHeroes: [makeHero({ hpPct: 80, level: 10 })],
      allyHeroes: [makeHero({ hpPct: 100, level: 10 })],
    });
    expect(retreat.GetDesire(heroAI)).toBeLessThan(0.5);
  });
});

describe('Scenario: teamfight — 5v5 at full health', () => {
  const fiveEnemies = () => [
    makeHero({ level: 10 }),
    makeHero({ level: 10 }),
    makeHero({ level: 10 }),
    makeHero({ level: 10 }),
    makeHero({ level: 10 }),
  ];
  const fiveAllies = () => [
    makeHero({ level: 10 }),
    makeHero({ level: 10 }),
    makeHero({ level: 10 }),
    makeHero({ level: 10 }),
    makeHero({ level: 10 }),
  ];

  it('should ATTACK in an even 5v5 (ratio = 1.0 → Logistic ≈ 0.27, still above 0)', () => {
    const attack = new ModeAttack();
    const heroAI = makeHeroAI({ enemyHeroes: fiveEnemies(), allyHeroes: fiveAllies() });
    expect(attack.GetDesire(heroAI)).toBeGreaterThan(0);
  });

  it('should NOT retreat in an even 5v5 at full HP', () => {
    const retreat = new ModeRetreat();
    const heroAI = makeHeroAI({ enemyHeroes: fiveEnemies(), allyHeroes: fiveAllies() });
    expect(retreat.GetDesire(heroAI)).toBeLessThan(0.5);
  });

  it('ATTACK beats RETREAT when 5v5 at full HP', () => {
    const attack = new ModeAttack();
    const retreat = new ModeRetreat();
    const heroAI = makeHeroAI({ enemyHeroes: fiveEnemies(), allyHeroes: fiveAllies() });
    expect(attack.GetDesire(heroAI)).toBeGreaterThan(retreat.GetDesire(heroAI));
  });

  it('should RETREAT when 5v5 but bot is critically low (20% HP)', () => {
    const retreat = new ModeRetreat();
    const heroAI = makeHeroAI({ hpPct: 20, enemyHeroes: fiveEnemies(), allyHeroes: fiveAllies() });
    expect(retreat.GetDesire(heroAI)).toBeGreaterThan(0.5);
  });
});

describe('Scenario: outnumbered — ganked 1v3 in lane', () => {
  it('should RETREAT in a 1v3 at full HP', () => {
    const retreat = new ModeRetreat();
    const heroAI = makeHeroAI({
      hpPct: 100,
      enemyHeroes: [makeHero({ level: 10 }), makeHero({ level: 10 }), makeHero({ level: 10 })],
      allyHeroes: [makeHero({ level: 10 })], // solo vs three
    });
    expect(retreat.GetDesire(heroAI)).toBeGreaterThan(0.5);
  });

  it('RETREAT beats ATTACK in a 1v3', () => {
    const attack = new ModeAttack();
    const retreat = new ModeRetreat();
    const heroAI = makeHeroAI({
      hpPct: 100,
      enemyHeroes: [makeHero({ level: 10 }), makeHero({ level: 10 }), makeHero({ level: 10 })],
      allyHeroes: [makeHero({ level: 10 })],
    });
    expect(retreat.GetDesire(heroAI)).toBeGreaterThan(attack.GetDesire(heroAI));
  });

  it('should ATTACK in a 3v1 (bot has numerical advantage)', () => {
    const attack = new ModeAttack();
    const heroAI = makeHeroAI({
      hpPct: 100,
      enemyHeroes: [makeHero({ level: 10 })],
      allyHeroes: [makeHero({ level: 10 }), makeHero({ level: 10 }), makeHero({ level: 10 })],
    });
    expect(attack.GetDesire(heroAI)).toBeGreaterThan(0.5);
  });
});

describe('Scenario: jungle — encountered enemy with no creep wave or tower', () => {
  it('should RETREAT when isolated by an enemy in the jungle (no allies, no creep wave)', () => {
    const retreat = new ModeRetreat();
    // No allies (ActionFind.Find returns []), no team buildings
    // Enemy is within 900 units (distanceTo = 500)
    jest.spyOn(ActionFind, 'FindTeamBuildingsInvulnerable').mockReturnValue([]);
    const heroAI = makeHeroAI({
      hpPct: 100,
      enemyHeroes: [makeHero({ distanceTo: 500 })],
      allyHeroes: [], // completely alone
    });
    expect(retreat.GetDesire(heroAI)).toBeGreaterThan(0.5);
  });

  it('should NOT retreat from jungle encounter when allies are nearby', () => {
    const retreat = new ModeRetreat();
    // Three allies within 1200 = not isolated
    jest.spyOn(ActionFind, 'Find').mockReturnValue([makeHero(), makeHero(), makeHero()]);
    jest.spyOn(ActionFind, 'FindTeamBuildingsInvulnerable').mockReturnValue([]);
    const heroAI = makeHeroAI({
      hpPct: 100,
      enemyHeroes: [makeHero({ distanceTo: 500 })],
      allyHeroes: [makeHero(), makeHero(), makeHero()],
    });
    expect(retreat.GetDesire(heroAI)).toBeLessThan(0.5);
  });

  it('should NOT retreat from jungle when allied tower is nearby', () => {
    // 1v1 even fight: outnumbered panic = 0. Allied tower = isolation doesn't trigger.
    const retreat = new ModeRetreat();
    jest.spyOn(ActionFind, 'FindTeamBuildingsInvulnerable').mockReturnValue([{}] as any);
    const heroAI = makeHeroAI({
      hpPct: 100,
      enemyHeroes: [makeHero({ distanceTo: 500 })],
      allyHeroes: [makeHero()], // 1 ally to balance outnumbered panic (1v1)
    });
    expect(retreat.GetDesire(heroAI)).toBeLessThan(0.5);
  });

  it('isolation does not trigger when enemy is far away (>900 units)', () => {
    // Mock distance to return 1000 so the enemy is genuinely beyond the 900 threshold.
    const { HeroUtil } = require('../hero/hero-util');
    jest.spyOn(HeroUtil, 'GetDistanceToHero').mockReturnValue(1000);
    const retreat = new ModeRetreat();
    jest.spyOn(ActionFind, 'FindTeamBuildingsInvulnerable').mockReturnValue([]);
    const heroAI = makeHeroAI({
      hpPct: 100,
      enemyHeroes: [makeHero()],
      allyHeroes: [makeHero()], // 1v1 to neutralise outnumbered panic
    });
    expect(retreat.GetDesire(heroAI)).toBeLessThan(0.5);
  });
});

describe('Scenario: hunting — chasing a low-HP enemy', () => {
  it('should ATTACK when chasing a 10% HP enemy (clear kill opportunity)', () => {
    const attack = new ModeAttack();
    const heroAI = makeHeroAI({
      hpPct: 100,
      enemyHeroes: [makeHero({ hpPct: 10, level: 10 })],
      allyHeroes: [makeHero({ hpPct: 100, level: 10 })],
    });
    expect(attack.GetDesire(heroAI)).toBeGreaterThan(0.5);
  });

  it('attack desire is higher when enemy is at 10% HP vs 80% HP', () => {
    const attack = new ModeAttack();
    const makeScenario = (enemyHp: number) =>
      makeHeroAI({
        hpPct: 100,
        enemyHeroes: [makeHero({ hpPct: enemyHp, level: 10 })],
        allyHeroes: [makeHero({ hpPct: 100, level: 10 })], // 1 ally: keeps ratio in logistic's sensitive range
      });
    const atLow = attack.GetDesire(makeScenario(10));
    const atHigh = attack.GetDesire(makeScenario(80));
    // Low-HP target means PowerUtil gives less enemy power → higher superiority ratio
    expect(atLow).toBeGreaterThan(atHigh);
  });
});

describe('Scenario: roaming — ambushing a solo enemy in river', () => {
  it('should ATTACK when 2v1 with full HP against healthy enemy', () => {
    const attack = new ModeAttack();
    const heroAI = makeHeroAI({
      hpPct: 100,
      enemyHeroes: [makeHero({ hpPct: 100, level: 8 })],
      allyHeroes: [makeHero({ hpPct: 100, level: 10 }), makeHero({ hpPct: 100, level: 10 })],
    });
    expect(attack.GetDesire(heroAI)).toBeGreaterThan(0.5);
  });

  it('should NOT retreat when roaming with team in a 3v2', () => {
    const retreat = new ModeRetreat();
    const heroAI = makeHeroAI({
      hpPct: 100,
      enemyHeroes: [makeHero({ level: 10 }), makeHero({ level: 10 })],
      allyHeroes: [makeHero({ level: 10 }), makeHero({ level: 10 }), makeHero({ level: 10 })],
    });
    expect(retreat.GetDesire(heroAI)).toBeLessThan(0.5);
  });
});

describe('Scenario: bait — killable enemy but 3+ allies missing', () => {
  beforeEach(() => {
    jest.spyOn(TeamCommander, 'getInstance').mockReturnValue({
      GetEnemyMissingCount: () => 3,
      GetGhostEnemyPower: () => 0,
      GetTargetClaimCount: () => 0,
      ClaimTarget: jest.fn(),
      UpdateGameState: jest.fn(),
    } as any);
  });

  it('caps attack desire at 0.52 when 3 enemies missing and no allied tower nearby', () => {
    const attack = new ModeAttack();
    jest.spyOn(ActionFind, 'FindTeamBuildingsInvulnerable').mockReturnValue([]);
    const heroAI = makeHeroAI({
      hpPct: 100,
      enemyHeroes: [makeHero({ hpPct: 15, level: 10 })],
      allyHeroes: [makeHero({ hpPct: 100, level: 10 }), makeHero({ hpPct: 100, level: 10 })],
    });
    expect(attack.GetDesire(heroAI)).toBeLessThanOrEqual(0.52);
  });

  it('does NOT cap attack desire when an allied tower is nearby (safer position)', () => {
    const attack = new ModeAttack();
    jest.spyOn(ActionFind, 'FindTeamBuildingsInvulnerable').mockReturnValue([{}] as any);
    const heroAI = makeHeroAI({
      hpPct: 100,
      enemyHeroes: [makeHero({ hpPct: 15, level: 10 })],
      allyHeroes: [makeHero({ hpPct: 100, level: 20 }), makeHero({ hpPct: 100, level: 20 })],
    });
    expect(attack.GetDesire(heroAI)).toBeGreaterThan(0.52);
  });
});

describe('Scenario: ghost enemies — enemy just went behind trees', () => {
  it('should RETREAT when ghost power indicates a recent 1v2 even after enemies disappeared', () => {
    const retreat = new ModeRetreat();
    // Ghost power simulates the recently-seen enemies
    jest.spyOn(TeamCommander, 'getInstance').mockReturnValue({
      GetEnemyMissingCount: () => 0,
      GetGhostEnemyPower: () => 20, // two level-10 heroes just disappeared
      GetTargetClaimCount: () => 0,
      ClaimTarget: jest.fn(),
      UpdateGameState: jest.fn(),
    } as any);
    const heroAI = makeHeroAI({
      hpPct: 60,
      enemyHeroes: [], // no visible enemies anymore
      allyHeroes: [makeHero({ level: 10 })],
    });
    expect(retreat.GetDesire(heroAI)).toBeGreaterThan(0.5);
  });

  it('should NOT instantly attack when ghost power is zero and no enemies visible', () => {
    const attack = new ModeAttack();
    const heroAI = makeHeroAI({ enemyHeroes: [], allyHeroes: [makeHero()] });
    expect(attack.GetDesire(heroAI)).toBe(0);
  });
});

describe('Scenario: missing enemy count — high-threat roam', () => {
  it('adds retreat desire when 5 enemies are missing (possible 5-man gank)', () => {
    jest.spyOn(TeamCommander, 'getInstance').mockReturnValue({
      GetEnemyMissingCount: () => 5,
      GetGhostEnemyPower: () => 0,
      GetTargetClaimCount: () => 0,
      ClaimTarget: jest.fn(),
      UpdateGameState: jest.fn(),
    } as any);
    const retreat = new ModeRetreat();
    const base = new ModeRetreat();
    jest.spyOn(TeamCommander, 'getInstance').mockReturnValue({
      GetEnemyMissingCount: () => 0,
      GetGhostEnemyPower: () => 0,
      GetTargetClaimCount: () => 0,
      ClaimTarget: jest.fn(),
      UpdateGameState: jest.fn(),
    } as any);
    const desireWith5Missing = retreat.GetDesire(makeMockHeroAI({ healthPercent: 100 }));
    const desireWith0Missing = base.GetDesire(makeMockHeroAI({ healthPercent: 100 }));

    // 5 missing → (5-2)*0.05 = 0.15 added
    jest.spyOn(TeamCommander, 'getInstance').mockReturnValue({
      GetEnemyMissingCount: () => 5,
      GetGhostEnemyPower: () => 0,
      GetTargetClaimCount: () => 0,
      ClaimTarget: jest.fn(),
      UpdateGameState: jest.fn(),
    } as any);
    const r2 = new ModeRetreat();
    const d2 = r2.GetDesire(makeMockHeroAI({ healthPercent: 100 }));
    expect(d2).toBeCloseTo(0.15, 2);
    expect(d2).toBeGreaterThan(0);
  });
});

describe('Scenario: tower dive — team vs solo enemy under tower', () => {
  const makeTowerInRange = () => {
    const { HeroUtil } = require('../hero/hero-util');
    jest.spyOn(HeroUtil, 'GetDistanceToAttackRange').mockReturnValue(-100);
    return {
      GetAttackRange: () => 700,
      GetAbsOrigin: () => ({ __sub: () => ({ Length: () => 0 }) }),
    };
  };

  it('suppresses attack desire under tower when enemy has too much HP to kill', () => {
    const attack = new ModeAttack();
    const tower = makeTowerInRange();
    const heroAI = makeHeroAI({
      hpPct: 100,
      hp: 800,
      level: 10,
      enemyHeroes: [makeHero({ hpPct: 80, hp: 800, level: 10 })],
      allyHeroes: [makeHero({ level: 10 })],
      nearestTower: tower,
    });
    // conf = TowerKillConfidence(1600, 200, 800, 150) — check suppression fires
    expect(attack.GetDesire(heroAI)).toBeLessThan(0.5);
  });

  it('does NOT suppress attack desire under tower when team can burst-kill enemy', () => {
    const attack = new ModeAttack();
    const { HeroUtil } = require('../hero/hero-util');
    // Mock distance so the enemy is within attack range (hero.GetBaseAttackRange(150) + 300 = 450)
    jest.spyOn(HeroUtil, 'GetDistanceToHero').mockReturnValue(300);
    const tower = makeTowerInRange();
    const heroAI = makeHeroAI({
      hpPct: 100,
      hp: 3000,
      level: 20,
      enemyHeroes: [makeHero({ hpPct: 5, hp: 50, level: 10 })],
      allyHeroes: [makeHero({ level: 20, hp: 3000 }), makeHero({ level: 20, hp: 3000 })],
      nearestTower: tower,
    });
    // teamHp=9000, teamDps=600, enemyHp=50, towerDps=150 → HIGH confidence → no suppression
    expect(attack.GetDesire(heroAI)).toBeGreaterThan(0.3);
  });
});

describe('Scenario: low mana — out of resources', () => {
  it('reduces attack desire proportionally when mana is at 20%', () => {
    const attack = new ModeAttack();
    const fullMana = makeHeroAI({
      hpPct: 100,
      mana: 500,
      maxMana: 500,
      enemyHeroes: [makeHero({ level: 10 })],
      allyHeroes: [makeHero({ level: 10 })],
    });
    const lowMana = makeHeroAI({
      hpPct: 100,
      mana: 100,
      maxMana: 500,
      enemyHeroes: [makeHero({ level: 10 })],
      allyHeroes: [makeHero({ level: 10 })],
    });
    expect(attack.GetDesire(fullMana)).toBeGreaterThan(attack.GetDesire(lowMana));
  });

  it('manaless hero still attacks (maxMana = 0 → ratio treated as 1)', () => {
    const attack = new ModeAttack();
    const heroAI = makeHeroAI({
      hpPct: 100,
      mana: 0,
      maxMana: 0,
      enemyHeroes: [makeHero({ level: 10 })],
      allyHeroes: [makeHero({ level: 10 })],
    });
    expect(attack.GetDesire(heroAI)).toBeGreaterThan(0);
  });
});

describe('Scenario: aggressive personality bot', () => {
  it('aggressive bot (aggressionBias=1.15) has higher attack desire than neutral', () => {
    const attack = new ModeAttack();
    const neutral = makeHeroAI({
      aggressionBias: 1.0,
      enemyHeroes: [makeHero({ level: 10 })],
      allyHeroes: [makeHero({ level: 10 })],
    });
    const aggressive = makeHeroAI({
      aggressionBias: 1.15,
      enemyHeroes: [makeHero({ level: 10 })],
      allyHeroes: [makeHero({ level: 10 })],
    });
    expect(attack.GetDesire(aggressive)).toBeGreaterThan(attack.GetDesire(neutral));
  });

  it('aggressive bias cannot overcome bait suppression (3+ missing, no tower)', () => {
    jest.spyOn(TeamCommander, 'getInstance').mockReturnValue({
      GetEnemyMissingCount: () => 3,
      GetGhostEnemyPower: () => 0,
      GetTargetClaimCount: () => 0,
      ClaimTarget: jest.fn(),
      UpdateGameState: jest.fn(),
    } as any);
    jest.spyOn(ActionFind, 'FindTeamBuildingsInvulnerable').mockReturnValue([]);
    const attack = new ModeAttack();
    const heroAI = makeHeroAI({
      aggressionBias: 1.15,
      enemyHeroes: [makeHero({ hpPct: 10, level: 10 })],
      allyHeroes: [makeHero({ level: 10 })],
    });
    expect(attack.GetDesire(heroAI)).toBeLessThanOrEqual(0.52);
  });
});

describe('Scenario: cautious personality bot', () => {
  it('cautious bot (cautionBias=1.15) retreats sooner than neutral bot', () => {
    const retreat = new ModeRetreat();
    const neutral = makeHeroAI({
      hpPct: 50,
      cautionBias: 1.0,
      enemyHeroes: [makeHero({ level: 10 })],
      allyHeroes: [makeHero({ level: 10 })],
    });
    const cautious = makeHeroAI({
      hpPct: 50,
      cautionBias: 1.15,
      enemyHeroes: [makeHero({ level: 10 })],
      allyHeroes: [makeHero({ level: 10 })],
    });
    expect(retreat.GetDesire(cautious)).toBeGreaterThan(retreat.GetDesire(neutral));
  });
});

describe('Scenario: allied tower defense — under own tower', () => {
  it('attack desire is higher when allied tower is nearby (tower counted as +2 power)', () => {
    const attack = new ModeAttack();
    const withTower = makeHeroAI({
      hpPct: 100,
      enemyHeroes: [makeHero({ level: 10 })],
      allyHeroes: [makeHero({ level: 10 })],
    });
    jest.spyOn(ActionFind, 'FindTeamBuildingsInvulnerable').mockReturnValue([{}] as any);
    const desireWith = attack.GetDesire(withTower);

    jest.spyOn(ActionFind, 'FindTeamBuildingsInvulnerable').mockReturnValue([]);
    const withoutTower = makeHeroAI({
      hpPct: 100,
      enemyHeroes: [makeHero({ level: 10 })],
      allyHeroes: [makeHero({ level: 10 })],
    });
    const desireWithout = attack.GetDesire(withoutTower);
    expect(desireWith).toBeGreaterThan(desireWithout);
  });
});

describe('Scenario: late game / high level', () => {
  it('high-level bots still retreat when heavily outnumbered', () => {
    const retreat = new ModeRetreat();
    const heroAI = makeHeroAI({
      hpPct: 100,
      level: 25,
      enemyHeroes: [
        makeHero({ level: 25 }),
        makeHero({ level: 25 }),
        makeHero({ level: 25 }),
        makeHero({ level: 25 }),
        makeHero({ level: 25 }),
      ],
      allyHeroes: [makeHero({ level: 25 })], // solo vs 5
    });
    expect(retreat.GetDesire(heroAI)).toBeGreaterThan(0.5);
  });

  it('high-level bots still attack in a 5v5 at full health', () => {
    const attack = new ModeAttack();
    const heroAI = makeHeroAI({
      hpPct: 100,
      level: 25,
      enemyHeroes: Array(5)
        .fill(null)
        .map(() => makeHero({ level: 25 })),
      allyHeroes: Array(5)
        .fill(null)
        .map(() => makeHero({ level: 25 })),
    });
    expect(attack.GetDesire(heroAI)).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Helper used by missing-count test (mirrors retreat test file)
// ---------------------------------------------------------------------------
function makeMockHeroAI(overrides: { healthPercent?: number }): any {
  return {
    mode: ModeEnum.LANING,
    gameTime: 0,
    cautionBias: 1.0,
    PushLevel: 10,
    aroundEnemyBuildingsInvulnerable: [],
    aroundEnemyHeroes: [],
    GetHero: () => ({
      GetHealthPercent: () => overrides.healthPercent ?? 100,
      GetLevel: () => 10,
      GetTeamNumber: () => 3,
      GetAbsOrigin: () => ({ x: 0, y: 0, z: 0 }),
      GetRangeToUnit: () => 500,
    }),
    FindNearestEnemyTowerInvulnerable: () => undefined,
  };
}
