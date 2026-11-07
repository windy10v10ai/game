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

const mockModifier = {
  GetAbility: jest.fn((): { GetAbilityName: () => string } => ({
    GetAbilityName: () => 'forgotten_ability',
  })),
  Destroy: jest.fn(),
};
const mockOtherModifier = {
  GetAbility: jest.fn(() => ({ GetAbilityName: () => 'other_ability' })),
  Destroy: jest.fn(),
};
let heroAbilityPoints = 0;
const mockHero = {
  AddAbility: jest.fn(),
  GetAbilityCount: jest.fn(() => 0),
  GetAbilityByIndex: jest.fn(() => undefined),
  GetPlayerOwnerID: jest.fn(() => 3),
  FindAbilityByName: jest.fn((_name: string) => ({ GetLevel: () => 3 })),
  FindAllModifiers: jest.fn(() => [mockModifier, mockOtherModifier]),
  RemoveAbility: jest.fn(),
  GetAbilityPoints: jest.fn(() => heroAbilityPoints),
  SetAbilityPoints: jest.fn((points: number) => {
    heroAbilityPoints = points;
  }),
};
global.PlayerResource = {
  GetSelectedHeroEntity: jest.fn(() => mockHero),
  GetSteamAccountID: jest.fn(() => 12345),
};
global.IsValidEntity = jest.fn(() => true);

let mockPoints = 0;
const mockDeductUseableMemberPoint = jest.fn();
jest.mock('../../../api/player', () => ({
  Player: {
    GetUseableMemberPoint: () => mockPoints,
    DeductUseableMemberPoint: (steamId: number, point: number) =>
      mockDeductUseableMemberPoint(steamId, point),
  },
}));
const mockUseMemberPoint = jest.fn();
jest.mock('../../../api/player-member-point', () => ({
  PlayerMemberPointApi: {
    UseMemberPoint: (steamId: number, point: number, reason: string) =>
      mockUseMemberPoint(steamId, point, reason),
  },
}));

import { PassiveTomeLottery } from './passive-tome-lottery';

describe('PassiveTomeLottery', () => {
  let lottery: PassiveTomeLottery;

  beforeEach(() => {
    for (const k of Object.keys(netTable)) delete netTable[k];
    mockHero.AddAbility.mockClear();
    mockHero.RemoveAbility.mockClear();
    mockModifier.Destroy.mockClear();
    mockOtherModifier.Destroy.mockClear();
    mockDeductUseableMemberPoint.mockClear();
    mockUseMemberPoint.mockClear();
    mockPoints = 1000;
    heroAbilityPoints = 0;
    global.RandomInt = jest.fn((min: number, _max: number) => min);
    lottery = new PassiveTomeLottery();
  });

  describe('onTriggered', () => {
    it('写入 4 个候选到 net table', () => {
      lottery.onTriggered(mockHero as any);
      const entry = netTable['lottery_passive_tome']?.['3'];
      expect(entry).toBeDefined();
      expect(entry.candidates).toHaveLength(PassiveTomeLottery.CANDIDATE_COUNT);
      expect(entry.candidates[0]).toMatchObject({
        name: expect.any(String),
        level: expect.any(Number),
      });
    });

    it('候选无重复', () => {
      // 落到含多个技能的档，去重逻辑才有验证意义
      global.RandomInt = jest.fn(() => 50);
      lottery.onTriggered(mockHero as any);
      const entry = netTable['lottery_passive_tome']['3'] as { candidates: { name: string }[] };
      const names = entry.candidates.map((c) => c.name);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  describe('pickAbility', () => {
    it('正常选择：候选匹配则学习技能 + 清行', () => {
      lottery.onTriggered(mockHero as any);
      const entry = netTable['lottery_passive_tome']['3'] as {
        candidates: { name: string; level: number }[];
      };
      const target = entry.candidates[1];
      lottery.pickAbility(3 as PlayerID, { name: target.name, level: target.level } as any);

      expect(mockHero.AddAbility).toHaveBeenCalledWith(target.name);
      expect(netTable['lottery_passive_tome']['3'].candidates).toEqual([]);
    });

    it('无 pending 抽奖时 noop', () => {
      lottery.pickAbility(3 as PlayerID, { name: 'anything', level: 1 } as any);
      expect(mockHero.AddAbility).not.toHaveBeenCalled();
    });

    it('伪造非候选技能时 noop（防客户端伪造）', () => {
      lottery.onTriggered(mockHero as any);
      lottery.pickAbility(3 as PlayerID, { name: 'fake_ability', level: 99 } as any);
      expect(mockHero.AddAbility).not.toHaveBeenCalled();
      // net table 未清空，玩家可以再次选合法候选
      expect(netTable['lottery_passive_tome']['3'].candidates).toHaveLength(
        PassiveTomeLottery.CANDIDATE_COUNT,
      );
    });

    it('正确名字但 level 不匹配时 noop', () => {
      lottery.onTriggered(mockHero as any);
      const entry = netTable['lottery_passive_tome']['3'] as {
        candidates: { name: string; level: number }[];
      };
      const candidate = entry.candidates[0];
      lottery.pickAbility(
        3 as PlayerID,
        {
          name: candidate.name,
          level: candidate.level + 99,
        } as any,
      );
      expect(mockHero.AddAbility).not.toHaveBeenCalled();
    });
  });

  describe('refreshAbility', () => {
    it('首次刷新免费，不扣积分', () => {
      lottery.onTriggered(mockHero as any);
      lottery.refreshAbility(3 as PlayerID);

      const entry = netTable['lottery_passive_tome']['3'];
      expect(entry.isRefreshed).toBe(true);
      expect(entry.paidRefreshCount).toBe(0);
      expect(entry.candidates).toHaveLength(PassiveTomeLottery.CANDIDATE_COUNT);
      expect(mockDeductUseableMemberPoint).not.toHaveBeenCalled();
    });

    it('第二次起按档位扣积分，付费第 6 次起拒绝', () => {
      lottery.onTriggered(mockHero as any);
      for (let i = 0; i < 7; i++) lottery.refreshAbility(3 as PlayerID);

      const costs = mockDeductUseableMemberPoint.mock.calls.map((c) => c[1]);
      expect(costs).toEqual([10, 20, 30, 50, 50]);
      expect(netTable['lottery_passive_tome']['3'].paidRefreshCount).toBe(5);
      expect(mockUseMemberPoint).toHaveBeenCalledWith(12345, 10, 'lottery_refresh_passive_tome');
    });

    it('积分不足时拒绝，不扣积分，候选不变', () => {
      lottery.onTriggered(mockHero as any);
      lottery.refreshAbility(3 as PlayerID);
      mockPoints = 9;
      const before = netTable['lottery_passive_tome']['3'].candidates;
      lottery.refreshAbility(3 as PlayerID);

      expect(mockDeductUseableMemberPoint).not.toHaveBeenCalled();
      expect(netTable['lottery_passive_tome']['3'].candidates).toBe(before);
      expect(netTable['lottery_passive_tome']['3'].paidRefreshCount).toBe(0);
    });

    it('没有待选抽奖时 noop', () => {
      lottery.refreshAbility(3 as PlayerID);
      expect(netTable['lottery_passive_tome']).toBeUndefined();
    });
  });

  describe('遗忘', () => {
    const pickFirst = () => {
      lottery.onTriggered(mockHero as any);
      const entry = netTable['lottery_passive_tome']['3'] as {
        candidates: { name: string; level: number }[];
      };
      const target = entry.candidates[0];
      lottery.pickAbility(3 as PlayerID, { name: target.name, level: target.level } as any);
      return target.name;
    };
    const mockItem = () => ({
      SpendCharge: jest.fn(),
      GetCurrentCharges: jest.fn(() => 0),
      RemoveSelf: jest.fn(),
    });

    it('选中的技能按获得顺序记入 owned', () => {
      const name = pickFirst();
      expect(netTable['lottery_passive_tome']['3'].owned).toEqual([name]);
      expect(lottery.hasOwnedAbility(3 as PlayerID)).toBe(true);
    });

    it('遗忘：销毁该技能的 modifier、移除技能、退还技能点与使用次数、消耗书', () => {
      const name = pickFirst();
      mockHero.FindAbilityByName.mockReturnValueOnce({ GetLevel: () => 3 });
      mockModifier.GetAbility.mockReturnValue({ GetAbilityName: () => name });
      const item = mockItem();
      lottery.openForget(mockHero as any, item as any);
      lottery.forgetAbility(3 as PlayerID, name);

      expect(mockModifier.Destroy).toHaveBeenCalled();
      expect(mockOtherModifier.Destroy).not.toHaveBeenCalled();
      expect(mockHero.RemoveAbility).toHaveBeenCalledWith(name);
      expect(heroAbilityPoints).toBe(3);
      expect(lottery.isUsageLimitReached(3 as PlayerID)).toBe(false);
      expect(item.SpendCharge).toHaveBeenCalled();
      expect(item.RemoveSelf).toHaveBeenCalled();
      expect(netTable['lottery_passive_tome']['3'].owned).toEqual([]);
      expect(netTable['lottery_passive_tome']['3'].forgetting).toBe(false);
    });

    it('使用次数退回后不会小于 0', () => {
      const name = pickFirst();
      lottery.openForget(mockHero as any, mockItem() as any);
      lottery.forgetAbility(3 as PlayerID, name);
      lottery.onTriggered(mockHero as any);
      expect(lottery.isUsageLimitReached(3 as PlayerID)).toBe(false);
      lottery.onTriggered(mockHero as any);
      expect(lottery.isUsageLimitReached(3 as PlayerID)).toBe(true);
    });

    it('技能不在 owned 里时拒绝', () => {
      pickFirst();
      const item = mockItem();
      lottery.openForget(mockHero as any, item as any);
      lottery.forgetAbility(3 as PlayerID, 'lottery_start_passive');

      expect(mockHero.RemoveAbility).not.toHaveBeenCalled();
      expect(item.SpendCharge).not.toHaveBeenCalled();
    });

    it('窗口没打开时拒绝', () => {
      const name = pickFirst();
      lottery.forgetAbility(3 as PlayerID, name);
      expect(mockHero.RemoveAbility).not.toHaveBeenCalled();
    });

    it('取消不消耗书，技能保留', () => {
      const name = pickFirst();
      const item = mockItem();
      lottery.openForget(mockHero as any, item as any);
      lottery.cancelForget(3 as PlayerID);

      expect(netTable['lottery_passive_tome']['3'].forgetting).toBe(false);
      expect(netTable['lottery_passive_tome']['3'].owned).toEqual([name]);
      expect(item.SpendCharge).not.toHaveBeenCalled();
    });

    it('没有记录的被动时不打开窗口', () => {
      lottery.openForget(mockHero as any, mockItem() as any);
      expect(netTable['lottery_passive_tome']).toBeUndefined();
    });
  });

  describe('event listener', () => {
    it('事件注册到 CustomGameEventManager', () => {
      expect(eventListeners['lottery_pick_passive_tome']).toBeDefined();
      expect(eventListeners['lottery_refresh_passive_tome']).toBeDefined();
      expect(eventListeners['lottery_forget_passive_tome']).toBeDefined();
      expect(eventListeners['lottery_cancel_forget_passive_tome']).toBeDefined();
    });
  });
});
