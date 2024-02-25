import type { PlayerProperty } from "../../api/player";
import { PlayerHelper } from "../../helper/player-helper";
import {
  property_attack_range_bonus,
  property_attackspeed_bonus_constant,
  property_cannot_miss,
  property_cast_range_bonus_stacking,
  property_cooldown_percentage,
  property_evasion_constant,
  property_health_regen_percentage,
  property_ignore_movespeed_limit,
  property_incoming_damage_percentage,
  property_lifesteal,
  property_magical_resistance_bonus,
  property_mana_regen_total_percentage,
  property_movespeed_bonus_constant,
  property_physical_armor_bonus,
  property_preattack_bonus_damage,
  property_spell_amplify_percentage,
  property_spell_lifesteal,
  property_stats_agility_bonus,
  property_stats_intellect_bonus,
  property_stats_strength_bonus,
  property_status_resistance_stacking,
} from "../../modifiers/property/property_declare";

export class PropertyController {
  private static propertyValuePerLevel = new Map<string, number>();
  private static propertyDataDrivenModifierName = new Map<string, string>();
  private static bnusSkillPointsAdded = new Map<number, number>();
  constructor() {
    print("PropertyController init");
    PropertyController.propertyValuePerLevel.set(property_cooldown_percentage.name, 4);
    PropertyController.propertyValuePerLevel.set(property_cast_range_bonus_stacking.name, 25);
    PropertyController.propertyValuePerLevel.set(property_spell_amplify_percentage.name, 5);
    PropertyController.propertyValuePerLevel.set(property_status_resistance_stacking.name, 4);
    PropertyController.propertyValuePerLevel.set(property_evasion_constant.name, 4);
    PropertyController.propertyValuePerLevel.set(property_magical_resistance_bonus.name, 4);
    PropertyController.propertyValuePerLevel.set(property_incoming_damage_percentage.name, -4);
    PropertyController.propertyValuePerLevel.set(property_attack_range_bonus.name, 25);
    PropertyController.propertyValuePerLevel.set(property_health_regen_percentage.name, 0.3);
    PropertyController.propertyValuePerLevel.set(property_mana_regen_total_percentage.name, 0.3);
    PropertyController.propertyValuePerLevel.set(property_lifesteal.name, 10);
    PropertyController.propertyValuePerLevel.set(property_spell_lifesteal.name, 8);
    PropertyController.propertyValuePerLevel.set(property_ignore_movespeed_limit.name, 0.125);
    PropertyController.propertyValuePerLevel.set(property_cannot_miss.name, 0.125);

    // multi level property must end with '_level_'
    PropertyController.propertyDataDrivenModifierName.set(
      property_movespeed_bonus_constant.name,
      "modifier_player_property_movespeed_bonus_constant_level_",
    );

    PropertyController.propertyDataDrivenModifierName.set(
      property_physical_armor_bonus.name,
      "modifier_player_property_physical_armor_bonus_level_",
    );
    PropertyController.propertyDataDrivenModifierName.set(
      property_preattack_bonus_damage.name,
      "modifier_player_property_preattack_bonus_damage_level_",
    );
    PropertyController.propertyDataDrivenModifierName.set(
      property_attackspeed_bonus_constant.name,
      "modifier_player_property_attackspeed_bonus_constant_level_",
    );
    PropertyController.propertyDataDrivenModifierName.set(
      property_stats_strength_bonus.name,
      "modifier_player_property_stats_strength_bonus_level_",
    );
    PropertyController.propertyDataDrivenModifierName.set(
      property_stats_agility_bonus.name,
      "modifier_player_property_stats_agility_bonus_level_",
    );
    PropertyController.propertyDataDrivenModifierName.set(
      property_stats_intellect_bonus.name,
      "modifier_player_property_stats_intellect_bonus_level_",
    );
  }

  private static limitPropertyNames = [
    "property_skill_points_bonus",
    "property_cast_range_bonus_stacking",
    "property_spell_amplify_percentage",
    "property_status_resistance_stacking",
    "property_evasion_constant",
    "property_magical_resistance_bonus",
    "property_incoming_damage_percentage",
    "property_attack_range_bonus",
    "property_physical_armor_bonus",
    "property_preattack_bonus_damage",
    "property_attackspeed_bonus_constant",
    "property_stats_strength_bonus",
    "property_stats_agility_bonus",
    "property_stats_intellect_bonus",
    "property_lifesteal",
    "property_spell_lifesteal",
  ];

  // 每N级加点一次
  public static HERO_LEVEL_PER_POINT = 2;

  // 属性加点后更新属性
  public static RefreshPlayerProperty(property: PlayerProperty) {
    PlayerHelper.ForEachPlayer((playerId) => {
      const steamId = PlayerResource.GetSteamAccountID(playerId);
      if (steamId === property.steamId) {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (hero) {
          PropertyController.setModifier(hero, property);
        }
      }
    });
  }

  // 更新单条属性
  public static setModifier(hero: CDOTA_BaseNPC_Hero, property: PlayerProperty) {
    const name = property.name;
    let activeLevel = property.level;
    // 根据英雄等级设置点数
    if (PropertyController.limitPropertyNames.includes(name)) {
      const activeLevelMax = Math.floor(hero.GetLevel() / PropertyController.HERO_LEVEL_PER_POINT);
      activeLevel = Math.min(property.level, activeLevelMax);
    }
    // print(
    //   `[PropertyController] setModifier ${name} origin level ${property.level}, activeLevel ${activeLevel}`,
    // );

    // 设置额外技能点
    if (name === "property_skill_points_bonus") {
      PropertyController.setBonusSkillPoints(hero, property, activeLevel);
      return;
    }

    // 设置属性
    const propertyValuePerLevel = PropertyController.propertyValuePerLevel.get(property.name);
    if (propertyValuePerLevel) {
      const value = propertyValuePerLevel * activeLevel;
      // 由于可能有负数，必须判断是否为0
      if (value !== 0) {
        hero.RemoveModifierByName(property.name);
        hero.AddNewModifier(hero, undefined, property.name, {
          value,
        });
      }
    } else {
      const dataDrivenModifierName = PropertyController.propertyDataDrivenModifierName.get(
        property.name,
      );
      if (dataDrivenModifierName) {
        this.refreshDataDrivenPlayerProperty(hero, dataDrivenModifierName, activeLevel);
      }
    }
  }

  private static setBonusSkillPoints(
    hero: CDOTA_BaseNPC_Hero,
    property: PlayerProperty,
    activeLevel: number,
  ) {
    const steamId = property.steamId;
    const shoudAddSP = Math.floor(activeLevel / 2);
    const currentAddedSP = PropertyController.bnusSkillPointsAdded.get(steamId) || 0;
    const deltaSP = shoudAddSP - currentAddedSP;
    if (deltaSP <= 0) {
      return;
    }
    print(`[PropertyController] setBonusSkillPoints ${shoudAddSP} ${deltaSP}`);
    hero.SetAbilityPoints(hero.GetAbilityPoints() + deltaSP);
    PropertyController.bnusSkillPointsAdded.set(steamId, shoudAddSP);
  }

  private static refreshDataDrivenPlayerProperty(
    hero: CDOTA_BaseNPC_Hero,
    modifierName: string,
    level: number,
  ) {
    if (level === 0) {
      return;
    }

    if (modifierName.endsWith("_level_")) {
      // for 1-8 level
      for (let i = 1; i <= 8; i++) {
        hero.RemoveModifierByName(`${modifierName}${i}`);
      }
      modifierName = modifierName + level;
    } else {
      hero.RemoveModifierByName(modifierName);
    }

    const dataDrivenItem = CreateItem(
      "item_player_modifiers",
      undefined,
      undefined,
    ) as CDOTA_Item_DataDriven;
    dataDrivenItem.ApplyDataDrivenModifier(hero, hero, modifierName, {
      duration: -1,
    });
    UTIL_RemoveImmediate(dataDrivenItem);
  }
}
