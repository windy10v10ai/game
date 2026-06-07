/* eslint-disable @typescript-eslint/no-explicit-any */
declare let global: any;

jest.mock('../../modifiers/global/modifier_treasure_chest', () => ({
  modifier_treasure_chest: { name: 'modifier_treasure_chest' },
}));

jest.mock('../../api/analytics/ga4/ga4-treasure-tracker', () => ({
  GA4TreasureTracker: { SendOpen: jest.fn() },
  TreasureTier: { UNKNOWN: 0, INITIAL: 1, EASY: 2, JUNGLE: 3, HARD: 4 },
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
global.ParticleAttachment = { ABSORIGIN: 0 };

global.Vector = jest.fn((x: number, y: number, z: number) => ({ x, y, z }));
global.RandomInt = jest.fn((min: number, _max: number) => min);

global.Timers = { CreateTimer: jest.fn() };
global.ParticleManager = {
  CreateParticle: jest.fn(() => 1),
  ReleaseParticleIndex: jest.fn(),
};
global.EmitSoundOn = jest.fn();
global.EmitSoundOnClient = jest.fn();
global.UTIL_Remove = jest.fn();

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

let mockState: number = global.GameState.CUSTOM_GAME_SETUP;
global.GameRules = {
  State_Get: () => mockState,
  Lottery: { Item: { onTriggered: jest.fn() } },
};

import { Treasure } from './treasure';
import { ItemLotteryPool } from '../lottery/item/item-lottery-helper';

describe('Treasure', () => {
  let treasure: Treasure;
  const fakeOpener = {
    GetUnitName: () => 'npc_dota_hero_axe',
    GetPlayerOwner: () => ({}),
  } as any;

  beforeEach(() => {
    Object.keys(listeners).forEach((k) => delete listeners[k]);
    createdUnits.length = 0;
    entityIndexCounter = 1;
    mockState = global.GameState.CUSTOM_GAME_SETUP;
    (global.CreateUnitByName as jest.Mock).mockClear();
    (global.Timers.CreateTimer as jest.Mock).mockClear();
    treasure = new Treasure();
  });

  describe('spawn 上限与计数', () => {
    it('场上无宝箱时正常 spawn', () => {
      treasure.spawnOne();
      expect(treasure.getActiveChestCount()).toBe(1);
      expect(treasure.getSpawnCount()).toBe(1);
    });

    it('场上未达到上限时仍可再刷 1 只（救济兜底），spawnCount 继续累加', () => {
      treasure.spawnOne();
      treasure.spawnOne();
      expect(treasure.getActiveChestCount()).toBe(Treasure.MAX_ACTIVE_CHESTS);
      expect(treasure.getSpawnCount()).toBe(Treasure.MAX_ACTIVE_CHESTS);
    });

    it('场上达到上限时跳过，且 spawnCount 不增', () => {
      treasure.spawnOne();
      treasure.spawnOne();
      treasure.spawnOne();
      expect(treasure.getActiveChestCount()).toBe(Treasure.MAX_ACTIVE_CHESTS);
      expect(treasure.getSpawnCount()).toBe(Treasure.MAX_ACTIVE_CHESTS);
    });

    it('开启后允许下次 spawn', () => {
      treasure.spawnOne();
      treasure.openChest(createdUnits[0], fakeOpener);
      treasure.spawnOne();
      expect(treasure.getActiveChestCount()).toBe(1);
      expect(treasure.getSpawnCount()).toBe(2);
    });
  });

  describe('点位池切换', () => {
    // 每次 spawn 后立刻 open，让 activeChests 清空 + spawnCount 递增
    const advance = (n: number) => {
      for (let i = 0; i < n; i++) {
        treasure.spawnOne();
        treasure.openChest(createdUnits[createdUnits.length - 1], fakeOpener);
      }
    };

    it('spawnCount === 0 用 INITIAL 池', () => {
      const point = treasure.getRandomSpawnPoint();
      expect(Treasure.SPAWN_POINTS_INITIAL).toContain(point);
    });

    it('spawnCount === 1 切到 EASY 池', () => {
      advance(1);
      const point = treasure.getRandomSpawnPoint();
      expect(Treasure.SPAWN_POINTS_RADIANT_EASY).toContain(point);
    });

    it('spawnCount === 4 进入 EASY+JUNGLE 过渡池', () => {
      advance(4);
      const point = treasure.getRandomSpawnPoint();
      const merged = [
        ...Treasure.SPAWN_POINTS_RADIANT_EASY,
        ...Treasure.SPAWN_POINTS_RADIANT_JUNGLE,
      ];
      expect(merged).toContain(point);
    });

    it('spawnCount === 6 切到 JUNGLE 池', () => {
      advance(6);
      const point = treasure.getRandomSpawnPoint();
      expect(Treasure.SPAWN_POINTS_RADIANT_JUNGLE).toContain(point);
    });

    it('spawnCount === 8 进入 JUNGLE+HARD 合并池', () => {
      advance(8);
      const point = treasure.getRandomSpawnPoint();
      const merged = [
        ...Treasure.SPAWN_POINTS_RADIANT_JUNGLE,
        ...Treasure.SPAWN_POINTS_RADIANT_HARD,
      ];
      expect(merged).toContain(point);
    });
  });

  describe('物品抽奖池映射', () => {
    it('第 1 个藏宝箱使用 INITIAL 池', () => {
      expect(Treasure.mapToLotteryPool(1)).toBe(ItemLotteryPool.INITIAL);
    });

    it('第 2-5 个藏宝箱使用 DEFAULT 池', () => {
      expect(Treasure.mapToLotteryPool(2)).toBe(ItemLotteryPool.DEFAULT);
      expect(Treasure.mapToLotteryPool(5)).toBe(ItemLotteryPool.DEFAULT);
    });

    it('第 6-9 个藏宝箱使用 PREMIUM 池', () => {
      expect(Treasure.mapToLotteryPool(6)).toBe(ItemLotteryPool.PREMIUM);
      expect(Treasure.mapToLotteryPool(9)).toBe(ItemLotteryPool.PREMIUM);
    });

    it('第 10 个起使用 ULTRA 池', () => {
      expect(Treasure.mapToLotteryPool(10)).toBe(ItemLotteryPool.ULTRA);
    });
  });

  describe('openChest', () => {
    it('清空 active，不影响 spawnCount', () => {
      treasure.spawnOne();
      treasure.openChest(createdUnits[0], fakeOpener);
      expect(treasure.getActiveChestCount()).toBe(0);
      expect(treasure.getSpawnCount()).toBe(1);
    });

    it('未追踪的 chest 调用是 no-op（防重复 open）', () => {
      treasure.spawnOne();
      const fakeChest = {
        GetEntityIndex: () => 999,
        GetUnitName: () => 'npc_treasure_chest',
      } as any;
      treasure.openChest(fakeChest, fakeOpener);
      expect(treasure.getActiveChestCount()).toBe(1);
    });
  });

  describe('生命周期事件', () => {
    it('PRE_GAME 时触发 spawn', () => {
      mockState = global.GameState.PRE_GAME;
      listeners['game_rules_state_change']?.({});
      expect(treasure.getActiveChestCount()).toBe(1);
    });

    it('GAME_IN_PROGRESS 时立即刷新一次并挂上周期 timer', () => {
      mockState = global.GameState.GAME_IN_PROGRESS;
      listeners['game_rules_state_change']?.({});
      const [delay, callback] = (global.Timers.CreateTimer as jest.Mock).mock.calls[0];
      expect(delay).toBe(0);
      expect(callback()).toBe(Treasure.RESPAWN_INTERVAL);
    });
  });
});
