import { transformDailyTask } from './net-table-transform';

// Lua 数组序列化成 JSON 会变成以数字字符串为 key 的对象（且 1-indexed），
// 用来复现真实的 net table 原始数据形状，而不是直接构造 JS 数组
function luaArray<T>(items: T[]): Record<string, T> {
  const result: Record<string, T> = {};
  items.forEach((item, index) => {
    result[String(index + 1)] = item;
  });
  return result;
}

describe('transformDailyTask', () => {
  it('顶层 history 为 Lua 数组时正确转换成 JS 数组', () => {
    const raw = {
      enabled: 1,
      candidates: luaArray([]),
      completedTasks: luaArray([]),
      history: luaArray([
        {
          dayId: '20260815',
          tasks: luaArray([{ taskId: 'general_kills', star: 1 }]),
          seasonPoint: 60,
        },
      ]),
    };
    const result = transformDailyTask(raw);
    expect(Array.isArray(result.history)).toBe(true);
    expect(result.history).toHaveLength(1);
  });

  it('history 每条记录里的 tasks 也是 Lua 数组时同样要转换，否则 index 0 取不到、最后一条会丢失', () => {
    const rawTasks = luaArray([
      { taskId: 'general_kills', star: 1 },
      { taskId: 'hero_lina_1', star: 2 },
      { taskId: 'general_healing', star: 3 },
    ]);
    const raw = {
      enabled: 1,
      candidates: luaArray([]),
      completedTasks: luaArray([]),
      history: luaArray([{ dayId: '20260815', tasks: rawTasks, seasonPoint: 240 }]),
    };
    const result = transformDailyTask(raw);
    const tasks = result.history[0].tasks;
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks).toHaveLength(3);
    expect(tasks[0]).toEqual({ taskId: 'general_kills', star: 1 });
    expect(tasks[2]).toEqual({ taskId: 'general_healing', star: 3 });
  });

  it('空 history 不会因为 Lua 空表被识别成对象而崩溃', () => {
    const raw = {
      enabled: 1,
      candidates: luaArray([]),
      completedTasks: luaArray([]),
      history: {},
    };
    const result = transformDailyTask(raw);
    expect(result.history).toEqual([]);
  });
});
