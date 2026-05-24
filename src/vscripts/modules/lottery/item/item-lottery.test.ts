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
    if (value === undefined || value === null) {
      delete netTable[table][key];
    } else {
      netTable[table][key] = value;
    }
  }),
  GetTableValue: jest.fn((table: string, key: string) => netTable[table]?.[key]),
};

global.GameRules = { GetGameTime: () => 100, GetDOTATime: () => 100 };

const mockHero = {
  AddItemByName: jest.fn(() => ({ SetSellable: jest.fn() })),
  GetUnitName: () => 'npc_dota_hero_axe',
  GetTeamNumber: () => 2,
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

jest.mock('../../../api/analytics/ga4/ga4-pick-item-tracker', () => ({
  GA4PickItemTracker: { SendPick: jest.fn() },
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
    it('人类玩家触发时直接写 LotteryDto[] 到 net table', () => {
      lottery.onTriggered(humanOpener);
      const candidates = netTable['lottery_item']?.['3'];
      expect(candidates).toBeDefined();
      expect(candidates).toHaveLength(ItemLottery.CANDIDATE_COUNT);
      expect(candidates[0]).toMatchObject({ name: expect.any(String), level: expect.any(Number) });
    });

    it('bot/中立触发直接 noop，不写表', () => {
      lottery.onTriggered(botOpener);
      expect(netTable['lottery_item']).toBeUndefined();
    });

    it('opener 为 undefined 直接 noop', () => {
      lottery.onTriggered(undefined);
      expect(netTable['lottery_item']).toBeUndefined();
    });

    it('候选无重复', () => {
      lottery.onTriggered(humanOpener);
      const candidates = netTable['lottery_item']['3'] as { name: string }[];
      const names = candidates.map((c) => c.name);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  describe('pickItem', () => {
    it('正常选择：候选匹配则发奖 + 清行', () => {
      lottery.onTriggered(humanOpener);
      const candidates = netTable['lottery_item']['3'] as { name: string; level: number }[];
      const target = candidates[1];
      lottery.pickItem(
        3 as PlayerID,
        {
          PlayerID: 3 as PlayerID,
          name: target.name,
          level: target.level,
        } as any,
      );
      expect(mockHero.AddItemByName).toHaveBeenCalledWith(target.name);
      // 选完后写空数组清行
      expect(netTable['lottery_item']['3']).toEqual([]);
    });

    it('无 pending 抽奖时 noop', () => {
      lottery.pickItem(3 as PlayerID, { PlayerID: 3, name: 'item_anything', level: 1 } as any);
      expect(mockHero.AddItemByName).not.toHaveBeenCalled();
    });

    it('伪造非候选物品时 noop（防客户端伪造）', () => {
      lottery.onTriggered(humanOpener);
      lottery.pickItem(
        3 as PlayerID,
        {
          PlayerID: 3,
          name: 'item_rapier_fake',
          level: 99,
        } as any,
      );
      expect(mockHero.AddItemByName).not.toHaveBeenCalled();
      // net table 未清空，玩家可以再次选合法候选
      expect(netTable['lottery_item']['3']).toBeDefined();
    });

    it('正确名字但 level 不匹配时 noop', () => {
      lottery.onTriggered(humanOpener);
      const candidate = (netTable['lottery_item']['3'] as { name: string; level: number }[])[0];
      lottery.pickItem(
        3 as PlayerID,
        {
          PlayerID: 3,
          name: candidate.name,
          level: candidate.level + 99,
        } as any,
      );
      expect(mockHero.AddItemByName).not.toHaveBeenCalled();
    });
  });

  describe('event listener', () => {
    it('lottery_pick_item 注册到 CustomGameEventManager', () => {
      expect(eventListeners['lottery_pick_item']).toBeDefined();
    });
  });
});
