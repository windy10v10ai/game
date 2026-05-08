import { LotteryStatusDto } from '../../common/dto/lottery-status';
import { PlayerInfoDto } from '../../vscripts/api/player';

type FieldSchema =
  | { type: 'boolean' }
  | { type: 'array' }
  | { type: 'nested'; fields: Record<string, FieldSchema> }
  | { type: 'optional-nested'; fields: Record<string, FieldSchema> };

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
  playerSetting: {
    type: 'optional-nested',
    fields: {
      isRememberAbilityKey: { type: 'boolean' },
      activeAbilityQuickCast: { type: 'boolean' },
      passiveAbilityQuickCast: { type: 'boolean' },
      passiveAbilityQuickCast2: { type: 'boolean' },
    },
  },
  member: {
    type: 'optional-nested',
    fields: {
      enable: { type: 'boolean' },
    },
  },
});
