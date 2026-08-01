jest.mock('../../utils/dota_ts_adapter', () => ({
  BaseAbility: class {},
  registerAbility: () => (ability: unknown) => ability,
}));

import {
  advanceLichChainFrostState,
  createLichChainFrostState,
  isLichIceSpire,
} from './lich_chain_frost_awakened';

describe('awakened Lich Chain Frost state', () => {
  it('starts with native base damage and configured remaining bounce count', () => {
    expect(createLichChainFrostState(700, 25)).toEqual({ damage: 700, remainingJumps: 25 });
  });

  it('consumes one bounce and increases damage for the next projectile', () => {
    expect(advanceLichChainFrostState({ damage: 700, remainingJumps: 25 }, 100, 0)).toEqual({
      damage: 800,
      remainingJumps: 24,
    });
  });

  it('adds hero or creep kill bonus jumps after consuming the current bounce', () => {
    expect(advanceLichChainFrostState({ damage: 700, remainingJumps: 3 }, 100, 5)).toEqual({
      damage: 800,
      remainingJumps: 7,
    });
  });

  it('recognizes only the native Ice Spire unit name', () => {
    expect(isLichIceSpire('npc_dota_lich_ice_spire')).toBe(true);
    expect(isLichIceSpire('npc_dota_observer_wards')).toBe(false);
  });
});
