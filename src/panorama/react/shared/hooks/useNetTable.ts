import { useEffect, useState } from 'react';

/**
 * 通用 net table 订阅 hook。
 * 自动处理初始读取、订阅、过滤 key、卸载时取消订阅。
 *
 * @param tableName Net table 名称（必须是 CustomNetTableDeclarations 中已声明的 key）
 * @param key 行 key（如 steamAccountID）。传 null 时表示尚未就绪，hook 不会订阅。
 * @param transform 可选的数据转换函数，用于把 NetworkedData 转成业务类型（例如 0/1 -> boolean）。
 */
export function useNetTable<
  TName extends keyof CustomNetTableDeclarations,
  TValue = CustomNetTableDeclarations[TName] extends Record<string, infer V> ? V : never,
  TOut = TValue,
>(
  tableName: TName,
  key: string | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform?: (raw: any) => TOut,
): TOut | null {
  const [value, setValue] = useState<TOut | null>(() => {
    if (!key) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = CustomNetTables.GetTableValue(tableName, key as any);
    if (!raw) return null;
    return transform ? transform(raw) : (raw as unknown as TOut);
  });

  useEffect(() => {
    if (!key) {
      // 返回 noop 清理函数，保持 useEffect 返回类型一致（避免 consistent-return）
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
        setValue(transform ? transform(rowValue) : (rowValue as unknown as TOut));
      },
    );
    return () => {
      CustomNetTables.UnsubscribeNetTableListener(listenerId);
    };
    // transform 是稳定函数（业务方一般定义为模块级），不放进依赖避免无限重订阅。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName, key]);

  return value;
}
