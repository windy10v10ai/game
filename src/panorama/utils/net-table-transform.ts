import { LotteryStatusDto } from '../../common/dto/lottery-status';
import { MemberDto, PlayerDto } from '../../vscripts/api/player';

type FieldSchema =
  | { type: 'boolean' }
  | { type: 'array' }
  | { type: 'nested'; fields: Record<string, FieldSchema> };

type TransformSchema<T> = {
  [K in keyof T]?: FieldSchema;
};

function applySchema(raw: any, schema: Record<string, FieldSchema>): any {
  const result = { ...raw };
  for (const key of Object.keys(schema)) {
    const rule = schema[key];
    if (rule.type === 'boolean') result[key] = raw[key] === 1;
    else if (rule.type === 'array') result[key] = Object.values(raw[key]);
    else if (rule.type === 'nested') result[key] = applySchema(raw[key], rule.fields);
  }
  return result;
}

export function createTransform<T>(schema: TransformSchema<T>): (raw: any) => T {
  return (raw: any) => applySchema(raw, schema as Record<string, FieldSchema>) as T;
}

export const transformMember = createTransform<MemberDto>({
  enable: { type: 'boolean' },
});

export const transformLotteryStatus = createTransform<LotteryStatusDto>({
  isActiveAbilityRefreshed: { type: 'boolean' },
  isPassiveAbilityRefreshed: { type: 'boolean' },
  isPassiveAbilityRefreshed2: { type: 'boolean' },
  showAbilityResetButton: { type: 'boolean' },
});

export const transformPlayer = createTransform<PlayerDto>({
  properties: { type: 'array' },
  playerSetting: {
    type: 'nested',
    fields: {
      isRememberAbilityKey: { type: 'boolean' },
      activeAbilityQuickCast: { type: 'boolean' },
      passiveAbilityQuickCast: { type: 'boolean' },
      passiveAbilityQuickCast2: { type: 'boolean' },
    },
  },
});
