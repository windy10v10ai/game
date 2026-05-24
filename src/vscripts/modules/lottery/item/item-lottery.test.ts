/* eslint-disable @typescript-eslint/no-explicit-any */
declare let global: any;

global.print = jest.fn();
global.RandomInt = jest.fn((min: number, _max: number) => min);

const eventListeners: Record<string, (userId: number, event: any) => void> = {};
global.CustomGameEventManager = {
  RegisterListener: jest.fn((name: string, cb: any) => {
    eventListeners[name] = cb;
  }),
};

const netTable: Record<string, Record<string, any>> = {};
global.CustomNetTables = {
  SetTableValue: jest.fn((table: string, key: string, value: any) => {
    if (!netTable[table]) netTable[table] = {};
    netTable[table][key] = value;
  }),
  GetTableValue: jest.fn((table: string, key: string) => netTable[table]?.[key]),
};

global.GameRules = { GetGameTime: () => 100 };

const mockHero = {
  AddItemByName: jest.fn(() => ({ SetSellable: jest.fn() })),
};
global.PlayerResource = {
  GetSelectedHeroEntity: jest.fn(() => mockHero),
  GetPlayer: jest.fn(() => ({})),
  GetSteamAccountID: jest.fn(() => 12345),
};

jest.mock('../../helper/player-helper', () => ({
  PlayerHelper: {
    IsHumanPlayer: jest.fn((npc: any) => npc?._human === true),
    IsHumanPlayerByPlayerId: jest.fn(() => true),
  },
}));

import { ItemLottery } from './item-lottery';

describe('ItemLottery', () => {
  let lottery: ItemLottery;
  const humanOpener = { _human: true, GetPlayerOwnerID: () => 3 } as any;
  const botOpener = { _human: false, GetPlayerOwnerID: () => 5 } as any;

  beforeEach(() => {
    for (const k of Object.keys(netTable)) delete netTable[k];
    mockHero.AddItemByName.mockClear();
    lottery = new ItemLottery();
  });

  describe('onTriggered', () => {
    it('人类玩家触发时写 4 个候选 + expireAt + pickedIndex=-1', () => {
      lottery.onTriggered(humanOpener);
      const dto = netTable['item_lottery']?.['3'];
      expect(dto).toBeDefined();
      expect(dto.candidates).toHaveLength(ItemLottery.CANDIDATE_COUNT);
      expect(dto.expireAt).toBe(100 + ItemLottery.EXPIRE_SECONDS);
      expect(dto.pickedIndex).toBe(-1);
    });

    it('bot/中立触发直接 noop，不写表', () => {
      lottery.onTriggered(botOpener);
      expect(netTable['item_lottery']).toBeUndefined();
    });

    it('opener 为 undefined 直接 noop', () => {
      lottery.onTriggered(undefined);
      expect(netTable['item_lottery']).toBeUndefined();
    });

    it('候选无重复', () => {
      lottery.onTriggered(humanOpener);
      const dto = netTable['item_lottery']['3'];
      const names = dto.candidates.map((c: any) => c.name);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  describe('pickItem', () => {
    it('正常选择：调用 AddItemByName 并写 pickedIndex', () => {
      lottery.onTriggered(humanOpener);
      const expectedName = netTable['item_lottery']['3'].candidates[1].name;
      lottery.pickItem(3 as PlayerID, 1);
      expect(mockHero.AddItemByName).toHaveBeenCalledWith(expectedName);
      expect(netTable['item_lottery']['3'].pickedIndex).toBe(1);
    });

    it('无 pending 抽奖时 noop', () => {
      lottery.pickItem(3 as PlayerID, 0);
      expect(mockHero.AddItemByName).not.toHaveBeenCalled();
    });

    it('已选过则不可重复选', () => {
      lottery.onTriggered(humanOpener);
      lottery.pickItem(3 as PlayerID, 0);
      mockHero.AddItemByName.mockClear();
      lottery.pickItem(3 as PlayerID, 1);
      expect(mockHero.AddItemByName).not.toHaveBeenCalled();
    });

    it('越界 index noop', () => {
      lottery.onTriggered(humanOpener);
      lottery.pickItem(3 as PlayerID, 99);
      expect(mockHero.AddItemByName).not.toHaveBeenCalled();
    });
  });

  describe('event listener', () => {
    it('lottery_pick_item 注册到 CustomGameEventManager', () => {
      expect(eventListeners['lottery_pick_item']).toBeDefined();
    });
  });
});
