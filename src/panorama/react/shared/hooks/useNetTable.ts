import {
  transformLotteryStatus,
  transformMember,
  transformPlayer,
} from '@utils/net-table-transform';
import { useEffect, useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformers: Partial<Record<keyof CustomNetTableDeclarations, (raw: any) => any>> = {
  member_table: transformMember,
  player_table: transformPlayer,
  lottery_status: transformLotteryStatus,
};

/**
 * 通用 net table 订阅 hook。
 * 自动处理初始读取、订阅、过滤 key、卸载时取消订阅。
 * member_table / player_table / lottery_status 会自动进行类型转换（0/1 → boolean 等）。
 *
 * @param tableName Net table 名称（必须是 CustomNetTableDeclarations 中已声明的 key）
 * @param key 行 key（如 steamAccountID）。传 null 时表示尚未就绪，hook 不会订阅。
 */
export function useNetTable<
  TName extends keyof CustomNetTableDeclarations,
  TValue = CustomNetTableDeclarations[TName] extends Record<string, infer V> ? V : never,
>(tableName: TName, key: string | null): TValue | null {
  const finalTransform = transformers[tableName];

  const [value, setValue] = useState<TValue | null>(() => {
    if (!key) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = CustomNetTables.GetTableValue(tableName, key as any);
    if (!raw) return null;
    return finalTransform ? finalTransform(raw) : (raw as unknown as TValue);
  });

  useEffect(() => {
    if (!key) {
      return () => {
        /* noop */
      };
    }
    const listenerId = CustomNetTables.SubscribeNetTableListener(
      tableName,
      (_tableName, rowKey, rowValue) => {
        if (rowKey !== key) return;
        if (!rowValue) {
          setValue(null);
          return;
        }
        setValue(finalTransform ? finalTransform(rowValue) : (rowValue as unknown as TValue));
      },
    );
    return () => {
      CustomNetTables.UnsubscribeNetTableListener(listenerId);
    };
    // finalTransform 是模块级稳定函数，不放进依赖避免无限重订阅。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName, key]);

  return value;
}
