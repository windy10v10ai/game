/* eslint-disable @typescript-eslint/no-explicit-any */
declare let global: any;

jest.mock('../../modifiers/global/modifier_hide_health_bar', () => ({
  modifier_hide_health_bar: { name: 'modifier_hide_health_bar' },
}));

global.print = jest.fn();

const listeners: Record<string, (keys: any) => void> = {};
global.ListenToGameEvent = jest.fn((event: string, cb: (keys: any) => void) => {
  listeners[event] = cb;
});

// Const enum values inlined at compile time; values must match @moddota/dota-lua-types
global.GameState = {
  INIT: 0,
  WAIT_FOR_PLAYERS_TO_LOAD: 1,
  CUSTOM_GAME_SETUP: 2,
  PLAYER_DRAFT: 3,
  HERO_SELECTION: 4,
  STRATEGY_TIME: 5,
  TEAM_SHOWCASE: 6,
  WAIT_FOR_MAP_TO_LOAD: 7,
  PRE_GAME: 8,
  SCENARIO_SETUP: 9,
  GAME_IN_PROGRESS: 10,
  POST_GAME: 11,
  DISCONNECT: 12,
};

global.DotaTeam = { NEUTRALS: 5 };

global.Vector = jest.fn((x: number, y: number, z: number) => ({ x, y, z }));
global.RandomInt = jest.fn((min: number, _max: number) => min);

global.Timers = {
  CreateTimer: jest.fn(),
};

let entityIndexCounter = 1;
const createdUnits: any[] = [];
global.CreateUnitByName = jest.fn(() => {
  const idx = entityIndexCounter++;
  const unit = {
    GetEntityIndex: () => idx,
    GetUnitName: () => 'npc_treasure_chest',
    SetIdleAcquire: jest.fn(),
    SetAcquisitionRange: jest.fn(),
    AddNewModifier: jest.fn(),
    GetAbsOrigin: () => ({ x: 0, y: 0, z: 256 }),
    SetAbsOrigin: jest.fn(),
  };
  createdUnits.push(unit);
  return unit;
});

global.EntIndexToHScript = jest.fn((idx: number) =>
  createdUnits.find((u) => u.GetEntityIndex() === idx),
);

let mockState: number = global.GameState.CUSTOM_GAME_SETUP;
global.GameRules = {
  State_Get: () => mockState,
};

import { Treasure } from './treasure';

describe('Treasure', () => {
  let treasure: Treasure;

  beforeEach(() => {
    Object.keys(listeners).forEach((k) => delete listeners[k]);
    createdUnits.length = 0;
    entityIndexCounter = 1;
    mockState = global.GameState.CUSTOM_GAME_SETUP;
    (global.CreateUnitByName as jest.Mock).mockClear();
    (global.Timers.CreateTimer as jest.Mock).mockClear();
    treasure = new Treasure();
  });

  describe('getRandomSpawnPoint', () => {
    it('uses the initial pool for the first spawn', () => {
      const point = treasure.getRandomSpawnPoint();
      expect(Treasure.SPAWN_POINTS_INITIAL).toContain(point);
    });

    it('switches to the radiant-jungle pool after the first spawn', () => {
      treasure.spawnOne();
      // 清场让后续 spawn 不被场上唯一性拦下
      const chest = createdUnits[0];
      listeners['entity_killed']?.({ entindex_killed: chest.GetEntityIndex() });
      const point = treasure.getRandomSpawnPoint();
      expect(Treasure.SPAWN_POINTS_RADIANT_JUNGLE).toContain(point);
    });
  });

  describe('spawnOne', () => {
    it('creates a unit when the field is empty', () => {
      treasure.spawnOne();
      expect(global.CreateUnitByName).toHaveBeenCalledTimes(1);
      expect(treasure.getActiveChestCount()).toBe(1);
    });

    it('skips spawn when a chest is already active', () => {
      treasure.spawnOne();
      (global.CreateUnitByName as jest.Mock).mockClear();
      treasure.spawnOne();
      expect(global.CreateUnitByName).not.toHaveBeenCalled();
      expect(treasure.getActiveChestCount()).toBe(1);
    });

    it('increments spawn counter only on actual spawns', () => {
      expect(treasure.getSpawnCount()).toBe(0);
      treasure.spawnOne();
      expect(treasure.getSpawnCount()).toBe(1);
      // 场上有藏宝箱时跳过，计数器不增
      treasure.spawnOne();
      expect(treasure.getSpawnCount()).toBe(1);
    });
  });

  describe('lifecycle', () => {
    it('spawns one chest on PRE_GAME', () => {
      mockState = global.GameState.PRE_GAME;
      listeners['game_rules_state_change']?.({});
      expect(global.CreateUnitByName).toHaveBeenCalledTimes(1);
      expect(treasure.getActiveChestCount()).toBe(1);
    });

    it('starts the respawn timer on GAME_IN_PROGRESS', () => {
      mockState = global.GameState.GAME_IN_PROGRESS;
      listeners['game_rules_state_change']?.({});
      expect(global.Timers.CreateTimer).toHaveBeenCalledTimes(1);
      const [interval] = (global.Timers.CreateTimer as jest.Mock).mock.calls[0];
      expect(interval).toBe(Treasure.RESPAWN_INTERVAL);
    });

    it('decrements active count when a chest is killed', () => {
      treasure.spawnOne();
      const chest = createdUnits[0];
      listeners['entity_killed']?.({ entindex_killed: chest.GetEntityIndex() });
      expect(treasure.getActiveChestCount()).toBe(0);
    });

    it('ignores entity_killed for non-treasure units', () => {
      treasure.spawnOne();
      listeners['entity_killed']?.({ entindex_killed: 99999 });
      expect(treasure.getActiveChestCount()).toBe(1);
    });
  });
});
