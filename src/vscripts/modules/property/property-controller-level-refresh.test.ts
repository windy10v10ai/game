jest.mock('../../utils/tstl-utils', () => ({
  reloadable: <T>(target: T) => target,
}));

jest.mock('../helper/player-helper', () => ({
  PlayerHelper: {},
}));

jest.mock('../../abilities/ts_abilities/death-prophet-ai-possession-constants', () => ({
  DEATH_PROPHET_POSSESSION_TARGET_MODIFIER: 'modifier_death_prophet_ai_possession_target',
}));

jest.mock('../../modifiers/property/property_declare', () => {
  const property = (name: string) => ({ name });
  return {
    property_aoe_bonus_constant_stacking: property('property_aoe_bonus_constant_stacking'),
    property_attack_range_bonus: property('property_attack_range_bonus'),
    property_attackspeed_bonus_constant: property('property_attackspeed_bonus_constant'),
    property_bonus_vision: property('property_bonus_vision'),
    property_cannot_miss: property('property_cannot_miss'),
    property_cast_range_bonus_stacking: property('property_cast_range_bonus_stacking'),
    property_cooldown_percentage: property('property_cooldown_percentage'),
    property_evasion_constant: property('property_evasion_constant'),
    property_flying: property('property_flying'),
    property_health_regen_percentage: property('property_health_regen_percentage'),
    property_ignore_movespeed_limit: property('property_ignore_movespeed_limit'),
    property_incoming_damage_percentage: property('property_incoming_damage_percentage'),
    property_lifesteal: property('property_lifesteal'),
    property_magical_resistance_bonus: property('property_magical_resistance_bonus'),
    property_mana_regen_total_percentage: property('property_mana_regen_total_percentage'),
    property_movespeed_bonus_constant: property('property_movespeed_bonus_constant'),
    property_physical_armor_bonus: property('property_physical_armor_bonus'),
    property_preattack_bonus_damage: property('property_preattack_bonus_damage'),
    property_slow_immune: property('property_slow_immune'),
    property_spell_amplify_percentage: property('property_spell_amplify_percentage'),
    property_spell_lifesteal: property('property_spell_lifesteal'),
    property_stats_agility_bonus: property('property_stats_agility_bonus'),
    property_stats_intellect_bonus: property('property_stats_intellect_bonus'),
    property_stats_strength_bonus: property('property_stats_strength_bonus'),
    property_status_resistance_stacking: property('property_status_resistance_stacking'),
  };
});

import type { PlayerProperty } from '../../api/player';
import { PropertyController } from './property_controller';

describe('PropertyController hero-level refresh', () => {
  it('does not rebuild the same capped property for consecutive level-up events', () => {
    (
      globalThis as unknown as { GameRules: { Option: { enablePlayerAttribute: boolean } } }
    ).GameRules = { Option: { enablePlayerAttribute: true } };
    (globalThis as unknown as { LoadKeyValues: jest.Mock }).LoadKeyValues = jest.fn(() => ({}));
    (globalThis as unknown as { print: jest.Mock }).print = jest.fn();

    new PropertyController();

    let heroLevel = 14;
    const modifier = { GetName: jest.fn(() => 'property_cast_range_bonus_stacking') };
    const hero = {
      GetEntityIndex: jest.fn(() => 901),
      GetLevel: jest.fn(() => heroLevel),
      HasModifier: jest.fn(() => false),
      IsAlive: jest.fn(() => true),
      RemoveModifierByName: jest.fn(),
      AddNewModifier: jest.fn(() => modifier),
    } as unknown as CDOTA_BaseNPC_Hero;
    const property = {
      name: 'property_cast_range_bonus_stacking',
      level: 8,
    } as PlayerProperty;

    PropertyController.LevelupHeroProperty(hero, property);
    expect((hero as unknown as { AddNewModifier: jest.Mock }).AddNewModifier).toHaveBeenCalledTimes(
      1,
    );

    heroLevel = 15;
    expect(PropertyController.RefreshHeroPropertyOnLevelUp(hero, property)).toBe(false);

    heroLevel = 16;
    expect(PropertyController.RefreshHeroPropertyOnLevelUp(hero, property)).toBe(true);
    expect((hero as unknown as { AddNewModifier: jest.Mock }).AddNewModifier).toHaveBeenCalledTimes(
      2,
    );

    heroLevel = 25;
    expect(PropertyController.RefreshHeroPropertyOnLevelUp(hero, property)).toBe(false);
    expect((hero as unknown as { AddNewModifier: jest.Mock }).AddNewModifier).toHaveBeenCalledTimes(
      2,
    );
  });
});
