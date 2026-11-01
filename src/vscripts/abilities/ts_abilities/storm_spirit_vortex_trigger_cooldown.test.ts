import { StormSpiritVortexTriggerCooldowns } from './storm_spirit_vortex_trigger_cooldown';

describe('Storm Spirit awakened Electric Vortex trigger cooldowns', () => {
  it('blocks the same enemy until three seconds have elapsed', () => {
    const cooldowns = new StormSpiritVortexTriggerCooldowns();

    expect(cooldowns.tryAcquire(101, 10, 3)).toBe(true);
    expect(cooldowns.tryAcquire(101, 12.99, 3)).toBe(false);
    expect(cooldowns.tryAcquire(101, 13, 3)).toBe(true);
  });

  it('tracks each enemy independently', () => {
    const cooldowns = new StormSpiritVortexTriggerCooldowns();

    expect(cooldowns.tryAcquire(101, 10, 3)).toBe(true);
    expect(cooldowns.tryAcquire(202, 10, 3)).toBe(true);
    expect(cooldowns.tryAcquire(101, 11, 3)).toBe(false);
    expect(cooldowns.tryAcquire(202, 13, 3)).toBe(true);
  });
});
