import {
  getTidehunterAwakenCarrierTotalDamageOutgoingPercentage,
  shouldTriggerTidehunterAwakenProcCarrier,
} from './tidehunter-anchor-smash-awaken-logic';

const REFLECTION = 16;

function createEvent(
  overrides: Partial<Parameters<typeof shouldTriggerTidehunterAwakenProcCarrier>[0]> = {},
) {
  return {
    attackerMatches: true,
    awakenAbilityActive: true,
    carrierAttackInProgress: false,
    inflictorAbilityName: 'tidehunter_anchor_smash',
    damageFlags: REFLECTION,
    reflectionFlag: REFLECTION,
    damage: 100,
    targetIsValid: true,
    ...overrides,
  };
}

describe('shouldTriggerTidehunterAwakenProcCarrier', () => {
  it('accepts reflected Anchor Smash damage while the awakening is active', () => {
    expect(shouldTriggerTidehunterAwakenProcCarrier(createEvent())).toBe(true);
  });

  it.each([
    { awakenAbilityActive: false },
    { damageFlags: 0 },
    { inflictorAbilityName: 'tidehunter_anchor_smash', damageFlags: 0 },
    { inflictorAbilityName: 'item_blade_mail' },
    { attackerMatches: false },
    { carrierAttackInProgress: true },
    { damage: 0 },
    { targetIsValid: false },
  ])('rejects inactive awakening, unrelated damage, or recursion: %o', (overrides) => {
    expect(shouldTriggerTidehunterAwakenProcCarrier(createEvent(overrides))).toBe(false);
  });

  it('rejects an actively cast Anchor Smash because it is not reflection damage', () => {
    expect(
      shouldTriggerTidehunterAwakenProcCarrier(
        createEvent({ inflictorAbilityName: 'tidehunter_anchor_smash', damageFlags: 0 }),
      ),
    ).toBe(false);
  });

  it('accepts separate targets independently when the native smash reports damage for each one', () => {
    expect(shouldTriggerTidehunterAwakenProcCarrier(createEvent({ damage: 80 }))).toBe(true);
    expect(shouldTriggerTidehunterAwakenProcCarrier(createEvent({ damage: 120 }))).toBe(true);
  });
});

describe('getTidehunterAwakenCarrierTotalDamageOutgoingPercentage', () => {
  const ATTACK_DAMAGE_CATEGORY = 1;
  const SPELL_DAMAGE_CATEGORY = 0;

  it('removes only the normal attack damage from the proc-carrier record', () => {
    expect(
      getTidehunterAwakenCarrierTotalDamageOutgoingPercentage(
        true,
        ATTACK_DAMAGE_CATEGORY,
        ATTACK_DAMAGE_CATEGORY,
      ),
    ).toBe(-100);
  });

  it('preserves spell-like damage produced by attack effects on the carrier record', () => {
    expect(
      getTidehunterAwakenCarrierTotalDamageOutgoingPercentage(
        true,
        SPELL_DAMAGE_CATEGORY,
        ATTACK_DAMAGE_CATEGORY,
      ),
    ).toBe(0);
  });

  it('does not modify unrelated attack records', () => {
    expect(
      getTidehunterAwakenCarrierTotalDamageOutgoingPercentage(
        false,
        ATTACK_DAMAGE_CATEGORY,
        ATTACK_DAMAGE_CATEGORY,
      ),
    ).toBe(0);
  });
});
