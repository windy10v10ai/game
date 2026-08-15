export type KeyedNetTableListener<T> = (rowKey: string, value: T | null) => void;

export function bindKeyedNetTableSubscription<T>(
  key: string,
  readCurrent: (key: string) => T | null,
  subscribe: (listener: KeyedNetTableListener<T>) => number,
  unsubscribe: (listenerId: number) => void,
  onValue: (value: T | null) => void,
): () => void {
  const listenerId = subscribe((rowKey, value) => {
    if (rowKey !== key) return;
    onValue(value);
  });
  onValue(readCurrent(key));
  return () => unsubscribe(listenerId);
}
