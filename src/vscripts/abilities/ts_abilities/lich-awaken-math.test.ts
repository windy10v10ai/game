import {
  calculateLichAwakenDamage,
  calculateLichAwakenDetonationDamage,
  isLichAwakenMarkTarget,
  isRoshanUnitName,
} from './lich-awaken-math';

describe('lich awaken math', () => {
  it('scales each Chain Frost hit from current intelligence', () => {
    expect(calculateLichAwakenDamage(400, 0.75)).toBe(300);
  });

  it('scales the natural three-stack detonation from current intelligence', () => {
    expect(calculateLichAwakenDetonationDamage(400, 2.25, 1)).toBe(900);
  });

  it('scales Frost Nova early detonation by consumed stacks', () => {
    expect(calculateLichAwakenDetonationDamage(400, 0.75, 2)).toBe(600);
  });

  it('recognizes only npc_dota_roshan as Roshan', () => {
    expect(isRoshanUnitName('npc_dota_roshan')).toBe(true);
    expect(isRoshanUnitName('npc_dota_roshan_custom')).toBe(false);
    expect(isRoshanUnitName('npc_dota_roshan_2')).toBe(false);
  });

  it('allows real heroes and Roshan to receive marks but rejects illusions and creeps', () => {
    expect(isLichAwakenMarkTarget(false, true, false)).toBe(true);
    expect(isLichAwakenMarkTarget(false, true, true)).toBe(false);
    expect(isLichAwakenMarkTarget(true, false, false)).toBe(true);
    expect(isLichAwakenMarkTarget(false, false, false)).toBe(false);
  });
});
