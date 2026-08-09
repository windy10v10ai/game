import { bindKeyedNetTableSubscription } from './net-table-subscription';

describe('bindKeyedNetTableSubscription', () => {
  it('immediately re-reads the current row when the subscribed key changes', () => {
    const values: Array<{ value: number } | null> = [];
    const calls: string[] = [];
    let listener: ((rowKey: string, value: { value: number } | null) => void) | undefined;
    const unsubscribe = jest.fn();

    const cleanup = bindKeyedNetTableSubscription(
      'new-key',
      (key) => {
        calls.push(`read:${key}`);
        return key === 'new-key' ? { value: 2 } : null;
      },
      (nextListener) => {
        calls.push('subscribe');
        listener = nextListener;
        return 77;
      },
      unsubscribe,
      (value) => values.push(value),
    );

    expect(calls).toEqual(['subscribe', 'read:new-key']);
    expect(values).toEqual([{ value: 2 }]);

    listener?.('old-key', { value: 1 });
    expect(values).toEqual([{ value: 2 }]);

    listener?.('new-key', { value: 3 });
    expect(values).toEqual([{ value: 2 }, { value: 3 }]);

    cleanup();
    expect(unsubscribe).toHaveBeenCalledWith(77);
  });
});
