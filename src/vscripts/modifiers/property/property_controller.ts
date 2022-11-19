import { PlayerProperty } from "../../api/player";
import { property_attackspeed_bonus_constant, property_attack_range_bonus, property_cannot_miss, property_cast_range_bonus_stacking, property_cooldown_percentage, property_health_regen_percentage, property_ignore_movespeed_limit, property_lifesteal, property_magical_resistance_bonus, property_mana_regen_total_percentage, property_movespeed_bonus_constant, property_physical_armor_bonus, property_preattack_bonus_damage, property_spell_amplify_percentage, property_spell_lifesteal, property_stats_agility_bonus, property_stats_intellect_bonus, property_stats_strength_bonus, property_status_resistance_stacking } from "./property_declare";

export class PropertyController {
    private static propertyValuePerLevel = new Map<string, number>();
    constructor() {
        print("PropertyController init");
        PropertyController.propertyValuePerLevel.set(property_cooldown_percentage.name, 4);
        PropertyController.propertyValuePerLevel.set(property_cast_range_bonus_stacking.name, 25);
        PropertyController.propertyValuePerLevel.set(property_spell_amplify_percentage.name, 5);
        PropertyController.propertyValuePerLevel.set(property_status_resistance_stacking.name, 4);
        PropertyController.propertyValuePerLevel.set(property_magical_resistance_bonus.name, 4);
        PropertyController.propertyValuePerLevel.set(property_attack_range_bonus.name, 25);
        PropertyController.propertyValuePerLevel.set(property_physical_armor_bonus.name, 5);
        PropertyController.propertyValuePerLevel.set(property_preattack_bonus_damage.name, 15);
        PropertyController.propertyValuePerLevel.set(property_attackspeed_bonus_constant.name, 15);
        PropertyController.propertyValuePerLevel.set(property_stats_strength_bonus.name, 10);
        PropertyController.propertyValuePerLevel.set(property_stats_agility_bonus.name, 10);
        PropertyController.propertyValuePerLevel.set(property_stats_intellect_bonus.name, 10);
        PropertyController.propertyValuePerLevel.set(property_health_regen_percentage.name, 0.25);
        PropertyController.propertyValuePerLevel.set(property_mana_regen_total_percentage.name, 0.25);
        PropertyController.propertyValuePerLevel.set(property_lifesteal.name, 7.5);
        PropertyController.propertyValuePerLevel.set(property_spell_lifesteal.name, 7.5);
        PropertyController.propertyValuePerLevel.set(property_movespeed_bonus_constant.name, 25);
        PropertyController.propertyValuePerLevel.set(property_ignore_movespeed_limit.name, 0.125);
        PropertyController.propertyValuePerLevel.set(property_cannot_miss.name, 0.125);
    }

    public static addModifier(hero: CDOTA_BaseNPC_Hero, property: PlayerProperty) {
        const propertyValuePerLevel = PropertyController.propertyValuePerLevel.get(property.name);
        if (propertyValuePerLevel) {
            const value = propertyValuePerLevel * property.level;
            if (value > 0) {
                hero.RemoveModifierByName(property.name);
                hero.AddNewModifier(hero, undefined, property.name, {
                    value
                });
            }
        }
    }

    public static RefreshPlayerProperty(property: PlayerProperty) {
        const steamId = property.steamId;

        for (let i = 0; i < PlayerResource.GetPlayerCount(); i++) {
            if (PlayerResource.IsValidPlayer(i)) {
                const steamId = PlayerResource.GetSteamAccountID(i);
                if (steamId == property.steamId) {
                    const hero = PlayerResource.GetSelectedHeroEntity(i);
                    if (hero) {
                        PropertyController.addModifier(hero, property);
                    }
                }
            }
        }
    }
}
