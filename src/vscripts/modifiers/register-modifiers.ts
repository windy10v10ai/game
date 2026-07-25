import {
  property_aoe_bonus_constant_stacking,
  property_attack_range_bonus,
  property_cast_range_bonus_stacking,
  property_health_regen_percentage,
  property_ignore_movespeed_limit,
  property_incoming_damage_percentage,
  property_lifesteal,
  property_mana_regen_total_percentage,
  property_slow_immune,
  property_spell_amplify_percentage,
  property_spell_lifesteal,
  property_status_resistance_stacking,
} from './property/property_declare';

const PROPERTY_SCRIPT_PATH = 'modifiers/property/property_declare';

export function RegisterModifiers() {
  LinkLuaModifier(
    property_cast_range_bonus_stacking.name,
    PROPERTY_SCRIPT_PATH,
    LuaModifierMotionType.NONE,
  );
  LinkLuaModifier(
    property_spell_amplify_percentage.name,
    PROPERTY_SCRIPT_PATH,
    LuaModifierMotionType.NONE,
  );
  LinkLuaModifier(
    property_status_resistance_stacking.name,
    PROPERTY_SCRIPT_PATH,
    LuaModifierMotionType.NONE,
  );
  LinkLuaModifier(
    property_incoming_damage_percentage.name,
    PROPERTY_SCRIPT_PATH,
    LuaModifierMotionType.NONE,
  );
  LinkLuaModifier(
    property_attack_range_bonus.name,
    PROPERTY_SCRIPT_PATH,
    LuaModifierMotionType.NONE,
  );
  LinkLuaModifier(property_lifesteal.name, PROPERTY_SCRIPT_PATH, LuaModifierMotionType.NONE);
  LinkLuaModifier(property_spell_lifesteal.name, PROPERTY_SCRIPT_PATH, LuaModifierMotionType.NONE);
  LinkLuaModifier(
    property_health_regen_percentage.name,
    PROPERTY_SCRIPT_PATH,
    LuaModifierMotionType.NONE,
  );
  LinkLuaModifier(
    property_mana_regen_total_percentage.name,
    PROPERTY_SCRIPT_PATH,
    LuaModifierMotionType.NONE,
  );
  LinkLuaModifier(
    property_ignore_movespeed_limit.name,
    PROPERTY_SCRIPT_PATH,
    LuaModifierMotionType.NONE,
  );
  LinkLuaModifier(property_slow_immune.name, PROPERTY_SCRIPT_PATH, LuaModifierMotionType.NONE);
  LinkLuaModifier(
    property_aoe_bonus_constant_stacking.name,
    PROPERTY_SCRIPT_PATH,
    LuaModifierMotionType.NONE,
  );
}
