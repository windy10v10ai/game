import { HeroUtil } from './hero-util';

function fakeHero(modifiers: string[]): CDOTA_BaseNPC {
  return {
    IsAlive: () => true,
    IsStunned: () => false,
    IsNightmared: () => false,
    IsFrozen: () => false,
    IsHexed: () => false,
    HasModifier: (name: string) => modifiers.includes(name),
  } as unknown as CDOTA_BaseNPC;
}

describe('HeroUtil.IsHardDisabled', () => {
  it('treats duel as hard disabled', () => {
    expect(HeroUtil.IsHardDisabled(fakeHero(['modifier_legion_commander_duel']))).toBe(true);
  });

  it('does not treat Doom as hard disabled since the hero can still move and attack', () => {
    expect(HeroUtil.IsHardDisabled(fakeHero(['modifier_doom_bringer_doom']))).toBe(false);
  });
});
