import { BotBaseAIModifier } from '../ai/hero/bot-base';
import { tinker_ai_modifier } from '../ai/hero/hero-tinker';
import { modifier_global_melee_status_resistance } from './global/melee_status_resistance';
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
  // AI modifier 会同步到客户端，不登记的话客户端每次同步都报 unknown modifier type
  LinkLuaModifier(BotBaseAIModifier.name, 'ai/hero/bot-base', LuaModifierMotionType.NONE);
  LinkLuaModifier(tinker_ai_modifier.name, 'ai/hero/hero-tinker', LuaModifierMotionType.NONE);
  LinkLuaModifier(
    modifier_global_melee_status_resistance.name,
    'modifiers/global/melee_status_resistance',
    LuaModifierMotionType.NONE,
  );
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
