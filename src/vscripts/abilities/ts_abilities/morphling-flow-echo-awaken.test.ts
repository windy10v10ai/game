jest.mock('../../utils/dota_ts_adapter', () => ({
  BaseAbility: class {},
  BaseModifier: class {},
  registerAbility: () => (ability: unknown) => ability,
  registerModifier: () => (modifier: unknown) => modifier,
}));

const modifierFunctionValues = {
  SPELL_AMPLIFY_PERCENTAGE: 'SPELL_AMPLIFY_PERCENTAGE',
  COOLDOWN_PERCENTAGE: 'COOLDOWN_PERCENTAGE',
  COOLDOWN_PERCENTAGE_ONGOING: 'COOLDOWN_PERCENTAGE_ONGOING',
  TOOLTIP: 'TOOLTIP',
  TOOLTIP2: 'TOOLTIP2',
} as const;
Object.assign(globalThis, { ModifierFunction: modifierFunctionValues });

import { modifier_morphling_flow_echo_awaken } from './morphling_flow_echo_awaken';

type MockAbility = {
  IsNull: jest.Mock<boolean, []>;
  GetLevel: jest.Mock<number, []>;
  GetSpecialValueFor: jest.Mock<number, [string]>;
};

type MockParent = {
  IsIllusion: jest.Mock<boolean, []>;
  PassivesDisabled: jest.Mock<boolean, []>;
  GetAgility: jest.Mock<number, []>;
  GetStrength: jest.Mock<number, []>;
};

type TestModifier = modifier_morphling_flow_echo_awaken & {
  GetAbility: () => MockAbility;
  GetParent: () => MockParent;
};

describe('modifier_morphling_flow_echo_awaken', () => {
  function createModifier() {
    const modifier = new modifier_morphling_flow_echo_awaken() as unknown as TestModifier;
    const ability: MockAbility = {
      IsNull: jest.fn(() => false),
      GetLevel: jest.fn(() => 1),
      GetSpecialValueFor: jest.fn((name: string) => {
        const values: Record<string, number> = {
          agility_per_spell_amp: 5,
          min_strength_agility_ratio: 50,
          max_strength_agility_ratio: 175,
          max_cooldown_speed_bonus: 60,
        };
        return values[name] ?? 0;
      }),
    };
    const parent: MockParent = {
      IsIllusion: jest.fn(() => false),
      PassivesDisabled: jest.fn(() => false),
      GetAgility: jest.fn(() => 100),
      GetStrength: jest.fn(() => 100),
    };
    const testModifier = modifier as unknown as {
      GetAbility: () => MockAbility;
      GetParent: () => MockParent;
    };
    testModifier.GetAbility = jest.fn(() => ability);
    testModifier.GetParent = jest.fn(() => parent);
    return { modifier, ability, parent };
  }

  it('keeps the awakening active without relying on IsActivated', () => {
    const { modifier } = createModifier();

    expect(modifier.GetModifierSpellAmplify_Percentage()).toBe(20);
    expect(modifier.OnTooltip()).toBe(20);
    expect(modifier.OnTooltip2()).toBe(24);
  });

  it('declares both initial and ongoing cooldown recovery hooks', () => {
    const { modifier, ability } = createModifier();
    const event = { ability } as unknown as ModifierAbilityEvent;

    expect(modifier.DeclareFunctions()).toEqual(
      expect.arrayContaining([
        ModifierFunction.COOLDOWN_PERCENTAGE,
        ModifierFunction.COOLDOWN_PERCENTAGE_ONGOING,
      ]),
    );
    expect(modifier.GetModifierPercentageCooldown(event)).toBe(24);
    expect(modifier.GetModifierPercentageCooldownOngoing(event)).toBe(24);
  });
});
