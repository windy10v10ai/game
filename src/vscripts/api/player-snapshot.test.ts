/* eslint-disable @typescript-eslint/no-explicit-any */
declare let global: any;

global.print = jest.fn();
// Lua 内置，node 下没有；语义等价于对非数字返回 undefined 的 Number()
global.tonumber = (value: any) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};
global.tostring = (value: any) => String(value);

import { PlayerSnapshot } from './player-snapshot';

// 私有静态方法承载了全部日历换算逻辑，测试直接取用
const snapshot = PlayerSnapshot as unknown as {
  DayFromTimestamp(unixSeconds: number): number;
  FormatDay(day: number): string;
  Today(): number;
};

describe('PlayerSnapshot 日历换算', () => {
  it('把 unix 时间戳换算成 UTC 年月日', () => {
    expect(snapshot.DayFromTimestamp(0)).toBe(19700101);
    expect(snapshot.DayFromTimestamp(1791849600)).toBe(20261013);
  });

  it('同一天内的秒数不影响结果', () => {
    expect(snapshot.DayFromTimestamp(1791849600 + 86399)).toBe(20261013);
    expect(snapshot.DayFromTimestamp(1791849600 + 86400)).toBe(20261014);
  });

  it('闰年 2 月末与世纪闰年边界正确', () => {
    expect(snapshot.DayFromTimestamp(Date.UTC(2024, 1, 29) / 1000)).toBe(20240229);
    expect(snapshot.DayFromTimestamp(Date.UTC(2000, 1, 29) / 1000)).toBe(20000229);
    expect(snapshot.DayFromTimestamp(Date.UTC(2100, 2, 1) / 1000)).toBe(21000301);
  });

  it('逐日比对标准日历，1970 至 2100 全部一致', () => {
    for (let ts = 0; ts < Date.UTC(2100, 0, 1) / 1000; ts += 86400) {
      const date = new Date(ts * 1000);
      const expected =
        date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
      expect(snapshot.DayFromTimestamp(ts)).toBe(expected);
    }
  });

  it('月日补零成 YYYY-MM-DD', () => {
    expect(snapshot.FormatDay(20261013)).toBe('2026-10-13');
    expect(snapshot.FormatDay(20260101)).toBe('2026-01-01');
  });
});

describe('PlayerSnapshot 解析系统日期', () => {
  const withSystemDate = (raw: string) => {
    (globalThis as Record<string, unknown>).GetSystemDate = () => raw;
    return snapshot.Today();
  };

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).GetSystemDate;
  });

  it('两位年份按 20xx 解析，结果可与会员到期日直接比较', () => {
    expect(withSystemDate('09/16/26')).toBe(20260916);
    expect(withSystemDate('01/02/27')).toBe(20270102);
  });

  it('解析结果与同一天的时间戳换算一致', () => {
    expect(withSystemDate('10/13/26')).toBe(snapshot.DayFromTimestamp(1791849600));
  });

  it('无法识别时返回 0，会员有效期改为不校验', () => {
    expect(withSystemDate('unknown')).toBe(0);
  });
});
