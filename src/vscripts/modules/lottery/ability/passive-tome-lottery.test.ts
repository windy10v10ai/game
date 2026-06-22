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

const mockHero = {
  AddAbility: jest.fn(),
  GetAbilityCount: jest.fn(() => 0),
  GetAbilityByIndex: jest.fn(() => undefined),
  GetPlayerOwnerID: jest.fn(() => 3),
};
global.PlayerResource = {
  GetSelectedHeroEntity: jest.fn(() => mockHero),
};

import { PassiveTomeLottery } from './passive-tome-lottery';

describe('PassiveTomeLottery', () => {
  let lottery: PassiveTomeLottery;

  beforeEach(() => {
    for (const k of Object.keys(netTable)) delete netTable[k];
    mockHero.AddAbility.mockClear();
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

  describe('event listener', () => {
    it('lottery_pick_passive_tome 注册到 CustomGameEventManager', () => {
      expect(eventListeners['lottery_pick_passive_tome']).toBeDefined();
    });
  });
});
