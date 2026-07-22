import {
  getDoomAwakenedEffectiveRadius,
  getDoomAwakenedNativeScepterRadius,
  getDoomAwakenedTalentStates,
  isDoomAwakenedFriendlyTarget,
} from './doom-awaken-logic';

describe('getDoomAwakenedNativeScepterRadius', () => {
  it('reads the current native Scepter aura radius instead of using cast range', () => {
    expect(
      getDoomAwakenedNativeScepterRadius(
        {
          AbilityValues: {
            scepter_aura_radius: {
              value: '0',
              special_bonus_scepter: '+350',
            },
          },
        },
        4,
      ),
    ).toBe(350);
  });

  it('selects the current ability level and clamps invalid values to zero', () => {
    expect(
      getDoomAwakenedNativeScepterRadius(
        {
          AbilityValues: {
            scepter_aura_radius: {
              value: '100 200 300 400',
              special_bonus_scepter: '10 20 30 40',
            },
          },
        },
        3,
      ),
    ).toBe(330);
    expect(getDoomAwakenedNativeScepterRadius({}, 1)).toBe(0);
  });
});

describe('getDoomAwakenedEffectiveRadius', () => {
  it('adds the caster current AoE bonus to the native Scepter radius', () => {
    expect(getDoomAwakenedEffectiveRadius(350, 150)).toBe(500);
  });

  it('clamps invalid radius and bonus values to zero', () => {
    expect(getDoomAwakenedEffectiveRadius(-50, -20)).toBe(0);
  });
});

describe('isDoomAwakenedFriendlyTarget', () => {
  it('allows a real allied hero while the caster has Scepter', () => {
    expect(
      isDoomAwakenedFriendlyTarget({
        hasScepter: true,
        sameTeam: true,
        isRealHero: true,
      }),
    ).toBe(true);
  });

  it.each([
    { hasScepter: false, sameTeam: true, isRealHero: true },
    { hasScepter: true, sameTeam: false, isRealHero: true },
    { hasScepter: true, sameTeam: true, isRealHero: false },
  ])('rejects an invalid friendly target: %o', (input) => {
    expect(isDoomAwakenedFriendlyTarget(input)).toBe(false);
  });
});

describe('getDoomAwakenedTalentStates', () => {
  it('inherits Doom Mute from special_bonus_unique_doom_10', () => {
    expect(getDoomAwakenedTalentStates({ hasMuteTalent: true, hasBreakTalent: false })).toEqual({
      muted: true,
      passivesDisabled: false,
    });
  });

  it('inherits Doom Break from special_bonus_unique_doom_11', () => {
    expect(getDoomAwakenedTalentStates({ hasMuteTalent: false, hasBreakTalent: true })).toEqual({
      muted: false,
      passivesDisabled: true,
    });
  });

  it('adds neither state when the corresponding talents are unlearned', () => {
    expect(getDoomAwakenedTalentStates({ hasMuteTalent: false, hasBreakTalent: false })).toEqual({
      muted: false,
      passivesDisabled: false,
    });
  });
});
