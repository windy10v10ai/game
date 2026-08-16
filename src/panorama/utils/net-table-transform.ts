import { LotteryStatusDto } from '../../common/dto/lottery-status';
import { PlayerInfoDto } from '../../vscripts/api/player';
import { DailyTaskNetTableEntry } from '../../common/dto/daily-task';

type FieldSchema =
  | { type: 'boolean' }
  | { type: 'array' }
  | { type: 'nested'; fields: Record<string, FieldSchema> }
  | { type: 'optional-nested'; fields: Record<string, FieldSchema> }
  | { type: 'array-of-nested'; fields: Record<string, FieldSchema> };

type TransformSchema<T> = {
  [K in keyof T]?: FieldSchema;
};

function applySchema(
  raw: Record<string, unknown>,
  schema: Record<string, FieldSchema>,
): Record<string, unknown> {
  const result = { ...raw };
  for (const key of Object.keys(schema)) {
    const rule = schema[key];
    if (rule.type === 'boolean') result[key] = raw[key] === 1;
    else if (rule.type === 'array') {
      const arr = raw[key];
      result[key] = arr != null ? Object.values(arr as Record<string, unknown>) : [];
    } else if (rule.type === 'nested')
      result[key] = applySchema(raw[key] as Record<string, unknown>, rule.fields);
    else if (rule.type === 'optional-nested') {
      const nested = raw[key];
      if (nested != null) {
        result[key] = applySchema(nested as Record<string, unknown>, rule.fields);
      }
    } else if (rule.type === 'array-of-nested') {
      const arr = raw[key];
      const items = arr != null ? Object.values(arr as Record<string, unknown>) : [];
      result[key] = items.map((item) => applySchema(item as Record<string, unknown>, rule.fields));
    }
  }
  return result;
}

export function createTransform<T>(
  schema: TransformSchema<T>,
): (raw: Record<string, unknown>) => T {
  return (raw: Record<string, unknown>) =>
    applySchema(raw, schema as Record<string, FieldSchema>) as T;
}

export const transformLotteryStatus = createTransform<LotteryStatusDto>({
  isActiveAbilityRefreshed: { type: 'boolean' },
  isPassiveAbilityRefreshed: { type: 'boolean' },
  isPassiveAbilityRefreshed2: { type: 'boolean' },
  showAbilityResetButton: { type: 'boolean' },
});

export const transformPlayer = createTransform<PlayerInfoDto>({
  properties: { type: 'array' },
  awakenedHeroes: { type: 'array' },
  playerSetting: {
    type: 'optional-nested',
    fields: {
      isRememberAbilityKey: { type: 'boolean' },
      activeAbilityQuickCast: { type: 'boolean' },
      passiveAbilityQuickCast: { type: 'boolean' },
      passiveAbilityQuickCast2: { type: 'boolean' },
      wardObserverQuickCast: { type: 'boolean' },
      wardSentryQuickCast: { type: 'boolean' },
      inventorySlot7QuickCast: { type: 'boolean' },
      inventorySlot8QuickCast: { type: 'boolean' },
      inventorySlot9QuickCast: { type: 'boolean' },
    },
  },
  member: {
    type: 'optional-nested',
    fields: {
      enable: { type: 'boolean' },
    },
  },
  // 全为数字、可缺失；optional-nested 在 undefined 时不塞入残缺对象
  statsLifetime: {
    type: 'optional-nested',
    fields: {},
  },
});

export const transformDailyTask = createTransform<DailyTaskNetTableEntry>({
  enabled: { type: 'boolean' },
  candidates: { type: 'array' },
  completedTasks: { type: 'array' },
  // history 本身是数组，其中每条记录的 tasks 字段也是数组，两层都要转换——
  // 只转外层的话，Lua 1-indexed 序列化出的 tasks 会被当成对象直接索引，
  // 导致 tasks[0] 取不到（第一列看起来是空的）、最后一条也取不到（数量对不上）
  history: {
    type: 'array-of-nested',
    fields: { tasks: { type: 'array' } },
  },
});
