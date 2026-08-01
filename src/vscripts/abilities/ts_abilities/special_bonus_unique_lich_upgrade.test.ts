jest.mock('../../utils/dota_ts_adapter', () => ({
  BaseAbility: class {},
  BaseModifier: class {},
  registerAbility: () => (ability: unknown) => ability,
  registerModifier: () => (modifier: unknown) => modifier,
}));

import { isLichChainFrostAbility } from './special_bonus_unique_lich_upgrade';

describe('isLichChainFrostAbility', () => {
  it('accepts both the native and awakened Chain Frost ability names', () => {
    expect(isLichChainFrostAbility('lich_chain_frost')).toBe(true);
    expect(isLichChainFrostAbility('lich_chain_frost_awakened')).toBe(true);
    expect(isLichChainFrostAbility('lich_frost_nova')).toBe(false);
  });
});
