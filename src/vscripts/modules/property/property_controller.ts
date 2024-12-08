import { type PlayerProperty } from '../../api/player';
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
} from '../../modifiers/property/property_declare';
import { reloadable } from '../../utils/tstl-utils';
import { PlayerHelper } from '../helper/player-helper';

@reloadable
export class PropertyController {
  /**
   * DataDriven modifier Map
   * key: property name (property_cooldown_percentage)
   * value: value per level (4)
   */
  private static propertyLuaModiferMap = new Map<string, number>();
  /**
   * DataDriven modifier Map
   * key: property name (property_movespeed_bonus_constant)
   * value: data-driven modifier name
   */
  private static propertyDataDrivenModifierMap = new Map<string, string>();
  private static bnusSkillPointsAdded = new Map<number, number>();
  constructor() {
    print('PropertyController init');
    PropertyController.propertyLuaModiferMap.set(property_cooldown_percentage.name, 4);
    PropertyController.propertyLuaModiferMap.set(property_cast_range_bonus_stacking.name, 25);
    PropertyController.propertyLuaModiferMap.set(property_spell_amplify_percentage.name, 5);
    PropertyController.propertyLuaModiferMap.set(property_status_resistance_stacking.name, 4);
    PropertyController.propertyLuaModiferMap.set(property_evasion_constant.name, 4);
    PropertyController.propertyLuaModiferMap.set(property_magical_resistance_bonus.name, 4);
    PropertyController.propertyLuaModiferMap.set(property_incoming_damage_percentage.name, -4);
    PropertyController.propertyLuaModiferMap.set(property_attack_range_bonus.name, 25);
    PropertyController.propertyLuaModiferMap.set(property_health_regen_percentage.name, 0.3);
    PropertyController.propertyLuaModiferMap.set(property_mana_regen_total_percentage.name, 0.3);
    PropertyController.propertyLuaModiferMap.set(property_lifesteal.name, 10);
    PropertyController.propertyLuaModiferMap.set(property_spell_lifesteal.name, 8);
    PropertyController.propertyLuaModiferMap.set(property_ignore_movespeed_limit.name, 0.125);
    PropertyController.propertyLuaModiferMap.set(property_cannot_miss.name, 0.125);

    // multi level property must end with '_level_'
    PropertyController.propertyDataDrivenModifierMap.set(
      property_movespeed_bonus_constant.name,
      'modifier_player_property_movespeed_bonus_constant_level_',
    );

    PropertyController.propertyDataDrivenModifierMap.set(
      property_physical_armor_bonus.name,
      'modifier_player_property_physical_armor_bonus_level_',
    );
    PropertyController.propertyDataDrivenModifierMap.set(
      property_preattack_bonus_damage.name,
      'modifier_player_property_preattack_bonus_damage_level_',
    );
    PropertyController.propertyDataDrivenModifierMap.set(
      property_attackspeed_bonus_constant.name,
      'modifier_player_property_attackspeed_bonus_constant_level_',
    );
    PropertyController.propertyDataDrivenModifierMap.set(
      property_stats_strength_bonus.name,
      'modifier_player_property_stats_strength_bonus_level_',
    );
    PropertyController.propertyDataDrivenModifierMap.set(
      property_stats_agility_bonus.name,
      'modifier_player_property_stats_agility_bonus_level_',
    );
    PropertyController.propertyDataDrivenModifierMap.set(
      property_stats_intellect_bonus.name,
      'modifier_player_property_stats_intellect_bonus_level_',
    );
  }

  private static limitPropertyNames = [
    'property_skill_points_bonus',
    'property_cast_range_bonus_stacking',
    'property_spell_amplify_percentage',
    'property_status_resistance_stacking',
    'property_evasion_constant',
    'property_magical_resistance_bonus',
    'property_incoming_damage_percentage',
    'property_attack_range_bonus',
    'property_physical_armor_bonus',
    'property_preattack_bonus_damage',
    'property_attackspeed_bonus_constant',
    'property_stats_strength_bonus',
    'property_stats_agility_bonus',
    'property_stats_intellect_bonus',
    'property_lifesteal',
    'property_spell_lifesteal',
  ];

  // 每N级加点一次
  public static HERO_LEVEL_PER_POINT = 2;

  // 重置属性
  public static RemoveAllPlayerProperty(steamAccountId: number) {
    const hero = PlayerHelper.FindHeroBySteeamAccountId(steamAccountId);
    if (!hero) {
      return;
    }

    // 移除Lua modifier
    for (const key of PropertyController.propertyLuaModiferMap.keys()) {
      hero.RemoveModifierByName(key);
    }

    // 移除DataDriven modifier
    for (const key of PropertyController.propertyDataDrivenModifierMap.keys()) {
      const value = PropertyController.propertyDataDrivenModifierMap.get(key);
      if (value) {
        for (let i = 1; i <= 8; i++) {
          hero.RemoveModifierByName(`${value}${i}`);
        }
      }
    }
  }

  // 属性加点后更新属性
  public static LevelupPlayerProperty(property: PlayerProperty) {
    const hero = PlayerHelper.FindHeroBySteeamAccountId(property.steamId);
    if (!hero) {
      return;
    }
    PropertyController.LevelupHeroProperty(hero, property);
  }

  // 根据英雄等级和加点点数，计算当前应该生效的属性等级
  private static GetPropertyActiveLevel(hero: CDOTA_BaseNPC_Hero, property: PlayerProperty) {
    if (PropertyController.limitPropertyNames.includes(property.name)) {
      const activeLevelMax = Math.floor(hero.GetLevel() / PropertyController.HERO_LEVEL_PER_POINT);
      return Math.min(property.level, activeLevelMax);
    }
    return property.level;
  }

  // 升级单条属性
  public static LevelupHeroProperty(hero: CDOTA_BaseNPC_Hero, property: PlayerProperty) {
    const name = property.name;
    const activeLevel = PropertyController.GetPropertyActiveLevel(hero, property);

    // 设置额外技能点
    if (name === 'property_skill_points_bonus') {
      PropertyController.setBonusSkillPoints(hero, property, activeLevel);
      return;
    }

    // 如果英雄死亡，不更新属性 (死亡时无法添加modifier)
    if (!hero.IsAlive()) {
      print(`[PropertyController] LevelupHeroProperty hero is dead ${name} ${activeLevel}`);
      return;
    }

    print(`[PropertyController] LevelupHeroProperty ${name} ${activeLevel}`);
    // 设置属性
    const propertyValuePerLevel = PropertyController.propertyLuaModiferMap.get(property.name);
    if (propertyValuePerLevel) {
      const value = propertyValuePerLevel * activeLevel;
      if (value === 0) {
        // 属性不生效时，跳过。由于可能有负数，必须判断是否为0
        return;
      }
      hero.RemoveModifierByName(property.name);
      const addedModifier = hero.AddNewModifier(hero, undefined, property.name, {
        value,
      });
      print(
        `[PropertyController] UpgradeHeroProperty ${property.name} ${addedModifier.GetName()} ${value}`,
      );
    } else {
      const dataDrivenModifierName = PropertyController.propertyDataDrivenModifierMap.get(
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

    if (modifierName.endsWith('_level_')) {
      // for 1-8 level
      for (let i = 1; i <= 8; i++) {
        hero.RemoveModifierByName(`${modifierName}${i}`);
      }
      modifierName = modifierName + level;
    } else {
      hero.RemoveModifierByName(modifierName);
    }

    const dataDrivenItem = CreateItem(
      'item_player_modifiers',
      undefined,
      undefined,
    ) as CDOTA_Item_DataDriven;
    dataDrivenItem.ApplyDataDrivenModifier(hero, hero, modifierName, {
      duration: -1,
    });
    UTIL_RemoveImmediate(dataDrivenItem);
  }
}
