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
  AddItem: jest.fn(),
  GetUnitName: () => 'npc_dota_hero_axe',
  GetTeamNumber: () => 2,
};
global.PlayerResource = {
  GetSelectedHeroEntity: jest.fn(() => mockHero),
  GetPlayer: jest.fn(() => ({})),
  GetSteamAccountID: jest.fn(() => 12345),
};

// CreateItem 全局函数 mock：返回一个带 name 字段的伪 item 用于断言
global.CreateItem = jest.fn((name: string) => ({ name }));

jest.mock('../../helper/player-helper', () => ({
  PlayerHelper: {
    IsHumanPlayer: jest.fn((npc: any) => npc?._human === true),
    IsHumanPlayerByPlayerId: jest.fn(() => true),
  },
}));

jest.mock('../../../api/analytics/ga4/ga4-pick-item-tracker', () => ({
  GA4PickItemTracker: { SendPick: jest.fn() },
}));

const mockGetMemberLevel = jest.fn((_steamId: number) => 1); // 默认 NORMAL
const mockGetUseableMemberPoint = jest.fn((_steamId: number) => 0);
const mockDeductUseableMemberPoint = jest.fn();
jest.mock('../../../api/player', () => ({
  MemberLevel: { NORMAL: 1, PREMIUM: 2 },
  Player: {
    GetMemberLevel: (steamId: number) => mockGetMemberLevel(steamId),
    GetUseableMemberPoint: (steamId: number) => mockGetUseableMemberPoint(steamId),
    DeductUseableMemberPoint: (steamId: number, point: number) =>
      mockDeductUseableMemberPoint(steamId, point),
  },
}));

const mockIsLocalhost = jest.fn(() => true);
jest.mock('../../../api/api-client', () => ({
  ApiClient: {
    IsLocalhost: () => mockIsLocalhost(),
  },
}));

const mockUseMemberPoint = jest.fn();
jest.mock('../../../api/player-member-point', () => ({
  PlayerMemberPointApi: {
    UseMemberPoint: (steamId: number, memberPoint: number, reason: string) =>
      mockUseMemberPoint(steamId, memberPoint, reason),
  },
}));

import { ItemLottery } from './item-lottery';

describe('ItemLottery', () => {
  let lottery: ItemLottery;
  const humanOpener = { _human: true, GetPlayerOwnerID: () => 3 } as any;
  const botOpener = { _human: false, GetPlayerOwnerID: () => 5 } as any;

  beforeEach(() => {
    for (const k of Object.keys(netTable)) delete netTable[k];
    mockHero.AddItem.mockClear();
    mockGetMemberLevel.mockReturnValue(1); // 默认 NORMAL
    mockGetUseableMemberPoint.mockReturnValue(0);
    mockDeductUseableMemberPoint.mockClear();
    mockIsLocalhost.mockReturnValue(true);
    mockUseMemberPoint.mockClear();
    global.RandomInt = jest.fn((min: number, _max: number) => min);
    lottery = new ItemLottery();
  });

  describe('onTriggered', () => {
    it('人类玩家触发时写入 { candidates, isRefreshed, paidRefreshCount, poolType } 到 net table', () => {
      lottery.onTriggered(humanOpener);
      const entry = netTable['lottery_item']?.['3'];
      expect(entry).toBeDefined();
      expect(entry.isRefreshed).toBe(false);
      expect(entry.paidRefreshCount).toBe(0);
      expect(entry.poolType).toBeDefined();
      expect(entry.candidates).toHaveLength(ItemLottery.CANDIDATE_COUNT);
      expect(entry.candidates[0]).toMatchObject({
        name: expect.any(String),
        level: expect.any(Number),
      });
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
      // 落到含多个物品的档（DEFAULT 下 50 命中 T2），去重逻辑才有验证意义
      global.RandomInt = jest.fn(() => 50);
      lottery.onTriggered(humanOpener);
      const entry = netTable['lottery_item']['3'] as { candidates: { name: string }[] };
      const names = entry.candidates.map((c) => c.name);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  describe('pickItem', () => {
    it('正常选择：候选匹配则发奖 + 清行', () => {
      lottery.onTriggered(humanOpener);
      const entry = netTable['lottery_item']['3'] as {
        candidates: { name: string; level: number }[];
      };
      const target = entry.candidates[1];
      lottery.pickItem(
        3 as PlayerID,
        {
          PlayerID: 3 as PlayerID,
          name: target.name,
          level: target.level,
        } as any,
      );
      expect(global.CreateItem).toHaveBeenCalledWith(target.name, undefined, undefined);
      expect(mockHero.AddItem).toHaveBeenCalledWith({ name: target.name });
      // 选完后写空 candidates 清行
      expect(netTable['lottery_item']['3'].candidates).toEqual([]);
      expect(netTable['lottery_item']['3'].isRefreshed).toBe(false);
      expect(netTable['lottery_item']['3'].paidRefreshCount).toBe(0);
    });

    it('无 pending 抽奖时 noop', () => {
      lottery.pickItem(3 as PlayerID, { PlayerID: 3, name: 'item_anything', level: 1 } as any);
      expect(mockHero.AddItem).not.toHaveBeenCalled();
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
      expect(mockHero.AddItem).not.toHaveBeenCalled();
      // net table 未清空，玩家可以再次选合法候选
      expect(netTable['lottery_item']['3']).toBeDefined();
    });

    it('正确名字但 level 不匹配时 noop', () => {
      lottery.onTriggered(humanOpener);
      const entry = netTable['lottery_item']['3'] as {
        candidates: { name: string; level: number }[];
      };
      const candidate = entry.candidates[0];
      lottery.pickItem(
        3 as PlayerID,
        {
          PlayerID: 3,
          name: candidate.name,
          level: candidate.level + 99,
        } as any,
      );
      expect(mockHero.AddItem).not.toHaveBeenCalled();
    });
  });

  describe('refreshItem', () => {
    it('PREMIUM 首次刷新：重写候选并把 isRefreshed 置 true', () => {
      mockGetMemberLevel.mockReturnValue(2); // PREMIUM
      lottery.onTriggered(humanOpener);
      const before = netTable['lottery_item']['3'];
      expect(before.isRefreshed).toBe(false);

      lottery.refreshItem(3 as PlayerID);

      const after = netTable['lottery_item']['3'];
      expect(after.isRefreshed).toBe(true);
      expect(after.paidRefreshCount).toBe(0);
      expect(after.candidates).toHaveLength(ItemLottery.CANDIDATE_COUNT);
    });

    it('NORMAL 会员刷新被拒绝', () => {
      mockGetMemberLevel.mockReturnValue(1); // NORMAL
      lottery.onTriggered(humanOpener);
      lottery.refreshItem(3 as PlayerID);
      expect(netTable['lottery_item']['3'].isRefreshed).toBe(false);
    });

    it('localhost 中已免费刷新过则二次刷新被拒绝', () => {
      mockGetMemberLevel.mockReturnValue(2);
      lottery.onTriggered(humanOpener);
      lottery.refreshItem(3 as PlayerID);
      const afterFirst = netTable['lottery_item']['3'].candidates;
      lottery.refreshItem(3 as PlayerID);
      // 候选未再次替换（引用相同的 candidates）
      expect(netTable['lottery_item']['3'].candidates).toBe(afterFirst);
    });

    it('官方服务器中已免费刷新过可消耗会员积分继续刷新', () => {
      mockGetMemberLevel.mockReturnValue(2);
      mockIsLocalhost.mockReturnValue(false);
      mockGetUseableMemberPoint.mockReturnValue(10);
      lottery.onTriggered(humanOpener);
      lottery.refreshItem(3 as PlayerID);
      const afterFirst = netTable['lottery_item']['3'].candidates;

      lottery.refreshItem(3 as PlayerID);

      expect(netTable['lottery_item']['3'].candidates).not.toBe(afterFirst);
      expect(netTable['lottery_item']['3'].paidRefreshCount).toBe(1);
      expect(mockDeductUseableMemberPoint).toHaveBeenCalledWith(12345, 10);
      expect(mockUseMemberPoint).toHaveBeenCalledWith(12345, 10, 'lottery_refresh_item');
    });

    it('付费刷新积分不足时拒绝刷新', () => {
      mockGetMemberLevel.mockReturnValue(2);
      mockIsLocalhost.mockReturnValue(false);
      mockGetUseableMemberPoint.mockReturnValue(9);
      lottery.onTriggered(humanOpener);
      lottery.refreshItem(3 as PlayerID);
      const afterFirst = netTable['lottery_item']['3'].candidates;

      lottery.refreshItem(3 as PlayerID);

      expect(netTable['lottery_item']['3'].candidates).toBe(afterFirst);
      expect(netTable['lottery_item']['3'].paidRefreshCount).toBe(0);
      expect(mockDeductUseableMemberPoint).not.toHaveBeenCalled();
      expect(mockUseMemberPoint).not.toHaveBeenCalled();
    });

    it('付费刷新达到 5 次上限后拒绝刷新', () => {
      mockGetMemberLevel.mockReturnValue(2);
      mockIsLocalhost.mockReturnValue(false);
      mockGetUseableMemberPoint.mockReturnValue(999);
      lottery.onTriggered(humanOpener);
      lottery.refreshItem(3 as PlayerID);
      netTable['lottery_item']['3'].paidRefreshCount = 5;
      const afterFirst = netTable['lottery_item']['3'].candidates;

      lottery.refreshItem(3 as PlayerID);

      expect(netTable['lottery_item']['3'].candidates).toBe(afterFirst);
      expect(netTable['lottery_item']['3'].paidRefreshCount).toBe(5);
      expect(mockDeductUseableMemberPoint).not.toHaveBeenCalled();
      expect(mockUseMemberPoint).not.toHaveBeenCalled();
    });

    it('新藏宝箱会重置已付费刷新次数', () => {
      mockGetMemberLevel.mockReturnValue(2);
      mockIsLocalhost.mockReturnValue(false);
      mockGetUseableMemberPoint.mockReturnValue(10);
      lottery.onTriggered(humanOpener);
      lottery.refreshItem(3 as PlayerID);
      lottery.refreshItem(3 as PlayerID);
      expect(netTable['lottery_item']['3'].paidRefreshCount).toBe(1);

      lottery.onTriggered(humanOpener);

      expect(netTable['lottery_item']['3'].isRefreshed).toBe(false);
      expect(netTable['lottery_item']['3'].paidRefreshCount).toBe(0);
    });

    it('已 pick 完（candidates 空）则刷新被拒绝', () => {
      mockGetMemberLevel.mockReturnValue(2);
      lottery.onTriggered(humanOpener);
      const target = netTable['lottery_item']['3'].candidates[0];
      lottery.pickItem(
        3 as PlayerID,
        { PlayerID: 3, name: target.name, level: target.level } as any,
      );
      lottery.refreshItem(3 as PlayerID);
      expect(netTable['lottery_item']['3'].candidates).toEqual([]);
    });

    it('无 pending 抽奖时 noop', () => {
      mockGetMemberLevel.mockReturnValue(2);
      lottery.refreshItem(3 as PlayerID);
      expect(netTable['lottery_item']?.['3']).toBeUndefined();
    });
  });

  describe('event listener', () => {
    it('lottery_pick_item 注册到 CustomGameEventManager', () => {
      expect(eventListeners['lottery_pick_item']).toBeDefined();
    });

    it('lottery_refresh_item 注册到 CustomGameEventManager', () => {
      expect(eventListeners['lottery_refresh_item']).toBeDefined();
    });
  });
});
