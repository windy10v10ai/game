import {
  DailyChallengeModifierClassifierConstants,
  classifyDailyChallengeModifier,
} from './daily-challenge-modifier-classifier';

const constants: DailyChallengeModifierClassifierConstants = {
  rootedState: 0 as modifierstate,
  silencedState: 3 as modifierstate,
  stunnedState: 5 as modifierstate,
  passivesDisabledState: 30 as modifierstate,
  tauntedState: 48 as modifierstate,
  slowFunctions: [16 as modifierfunction, 20 as modifierfunction, 283 as modifierfunction],
  slowModifierNames: ['modifier_verified_slow'],
};

const modifier = ({
  name = 'modifier_test_debuff',
  debuff = true,
  stun = false,
  states = {},
  functions = [],
}: {
  name?: string;
  debuff?: boolean;
  stun?: boolean;
  states?: Record<number, boolean>;
  functions?: number[];
}) =>
  ({
    GetName: () => name,
    IsDebuff: () => debuff,
    IsStunDebuff: () => stun,
    CheckStateToTable: (target: Record<number, boolean>) => Object.assign(target, states),
    HasFunction: (func: modifierfunction) => functions.includes(func as number),
  }) as unknown as CDOTA_Buff;

describe('classifyDailyChallengeModifier', () => {
  it('classifies state controls, movement slows and one generic debuff bucket', () => {
    expect(
      classifyDailyChallengeModifier(
        modifier({ name: 'modifier_verified_slow', states: { 0: true, 3: true }, functions: [20] }),
        constants,
      ),
    ).toEqual(
      new Set([
        'root_duration_ms',
        'silence_duration_ms',
        'slow_duration_ms',
        'debuff_duration_ms',
      ]),
    );
  });

  it('classifies stun, taunt and break independently', () => {
    expect(
      classifyDailyChallengeModifier(
        modifier({ stun: true, states: { 5: true, 30: true, 48: true } }),
        constants,
      ),
    ).toEqual(
      new Set(['stun_duration_ms', 'taunt_duration_ms', 'break_duration_ms', 'debuff_duration_ms']),
    );
  });

  it('classifies any debuff that exposes a movement-speed modifier function', () => {
    expect(classifyDailyChallengeModifier(modifier({ functions: [20] }), constants)).toEqual(
      new Set(['slow_duration_ms', 'debuff_duration_ms']),
    );
    expect(
      classifyDailyChallengeModifier(
        modifier({ name: 'modifier_verified_slow', debuff: false, functions: [20] }),
        constants,
      ),
    ).toEqual(new Set());
  });

  it('recognizes Sniper Shrapnel slow with the production fallback list', () => {
    expect(
      classifyDailyChallengeModifier(modifier({ name: 'modifier_sniper_shrapnel_slow' })),
    ).toEqual(new Set(['slow_duration_ms', 'debuff_duration_ms']));
  });
  it('keeps explicit known slow names as a fallback when the engine omits the property function', () => {
    const constantsWithSniperSlow = {
      ...constants,
      slowModifierNames: [...constants.slowModifierNames, 'modifier_sniper_shrapnel_slow'],
    };

    expect(
      classifyDailyChallengeModifier(
        modifier({ name: 'modifier_sniper_shrapnel_slow' }),
        constantsWithSniperSlow,
      ),
    ).toEqual(new Set(['slow_duration_ms', 'debuff_duration_ms']));
  });
});
