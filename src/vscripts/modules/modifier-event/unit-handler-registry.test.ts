import { UnitHandlerRegistry } from './unit-handler-registry';

const unitA = 1 as EntityIndex;
const unitB = 2 as EntityIndex;

describe('UnitHandlerRegistry', () => {
  let registry: UnitHandlerRegistry<string>;

  beforeEach(() => {
    registry = new UnitHandlerRegistry<string>();
  });

  it('dispatches only to handlers registered on the event unit', () => {
    const received: string[] = [];
    registry.Add(unitA, {}, (event) => received.push(`a:${event}`));
    registry.Add(unitB, {}, (event) => received.push(`b:${event}`));

    registry.Dispatch(unitA, 'hit');

    expect(received).toEqual(['a:hit']);
  });

  it('calls every owner registered on the same unit', () => {
    const received: string[] = [];
    registry.Add(unitA, {}, () => received.push('lifesteal'));
    registry.Add(unitA, {}, () => received.push('spell_lifesteal'));

    registry.Dispatch(unitA, 'hit');

    expect(received).toEqual(['lifesteal', 'spell_lifesteal']);
  });

  it('replaces the handler when the same owner registers twice', () => {
    const owner = {};
    const received: string[] = [];
    registry.Add(unitA, owner, () => received.push('old'));
    registry.Add(unitA, owner, () => received.push('new'));

    registry.Dispatch(unitA, 'hit');

    expect(received).toEqual(['new']);
  });

  it('keeps other owners on the unit after one is removed', () => {
    const removed = {};
    const received: string[] = [];
    registry.Add(unitA, removed, () => received.push('removed'));
    registry.Add(unitA, {}, () => received.push('kept'));

    registry.Remove(unitA, removed);
    registry.Dispatch(unitA, 'hit');

    expect(received).toEqual(['kept']);
    expect(registry.IsEmpty()).toBe(false);
  });

  it('becomes empty after the last owner is removed', () => {
    const owner = {};
    registry.Add(unitA, owner, () => undefined);

    registry.Remove(unitA, owner);

    expect(registry.IsEmpty()).toBe(true);
  });

  it('ignores removing an owner that was never registered', () => {
    registry.Add(unitA, {}, () => undefined);

    registry.Remove(unitA, {});
    registry.Remove(unitB, {});

    expect(registry.IsEmpty()).toBe(false);
  });
});
