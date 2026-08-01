import { getDoomAwakenedNativeScepterRadius } from './doom-awaken-logic';

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
