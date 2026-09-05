import { type PlayerProperty } from '../../api/player';
import { DEATH_PROPHET_POSSESSION_TARGET_MODIFIER } from '../../abilities/ts_abilities/death-prophet-ai-possession-constants';
import {
  property_aoe_bonus_constant_stacking,
  property_attack_range_bonus,
  property_attackspeed_bonus_constant,
  property_bonus_vision,
  property_cannot_miss,
  property_cast_range_bonus_stacking,
  property_cooldown_percentage,
  property_evasion_constant,
  property_flying,
  property_health_regen_percentage,
  property_ignore_movespeed_limit,
  property_incoming_damage_percentage,
  property_lifesteal,
  property_magical_resistance_bonus,
  property_mana_regen_total_percentage,
  property_movespeed_bonus_constant,
  property_physical_armor_bonus,
  property_preattack_bonus_damage,
  property_slow_immune,
  property_spell_amplify_percentage,
  property_spell_lifesteal,
  property_stats_agility_bonus,
  property_stats_intellect_bonus,
  property_stats_strength_bonus,
  property_status_resistance_stacking,
} from '../../modifiers/property/property_declare';
import { reloadable } from '../../utils/tstl-utils';
import { PlayerHelper } from '../helper/player-helper';

/** 临时载体使用的单 modifier 属性快照，避免批量创建/移除玩家属性 modifier。 */
export interface TemporaryHeroPropertyValues {
  cooldownPercentage: number;
  castRangeBonus: number;
  aoeBonus: number;
  spellAmplifyPercentage: number;
  statusResistance: number;
  evasion: number;
  magicalResistance: number;
  incomingDamagePercentage: number;
  attackRangeBonus: number;
  physicalArmor: number;
  preattackDamage: number;
  attackSpeed: number;
  strength: number;
  agility: number;
  intellect: number;
  healthRegenPercentage: number;
  manaRegenPercentage: number;
  lifesteal: number;
  spellLifesteal: number;
  moveSpeed: number;
  bonusVision: number;
  ignoreMoveSpeedLimit: 0 | 1;
  cannotMiss: 0 | 1;
  slowImmune: 0 | 1;
  flying: 0 | 1;
}

interface PlayerModifierKeyValues {
  item_player_modifiers?: {
    Modifiers?: Record<string, { Properties?: Record<string, string> }>;
  };
}

@reloadable
export class PropertyController {
  /**
   * Lua modifier Map
   * key: property name
   * value: value per level
   */
  private static propertyLuaModiferMap = new Map<string, number>();
  /**
   * DataDriven modifier Map
   * key: property name (property_movespeed_bonus_constant)
   * value: data-driven modifier name
   */
  private static propertyDataDrivenModifierMap = new Map<string, string>();
  private static propertyDataDrivenPropertyKeyMap = new Map<string, string>();
  private static playerModifierKeyValues?: PlayerModifierKeyValues;
  private static PLAYER_MODIFER_DATA_DRIVEN_ITEM: CDOTA_Item_DataDriven;
  /**
   * 记录英雄上一次实际应用的属性档位。
   *
   * 英雄一次获得大量经验时，Dota 会连续派发多个升级事件。过去每个事件都会把全部
   * 玩家属性 modifier 删除后重建，夺舍结束处决目标时尤其容易造成明显卡顿。
   */
  private static appliedPropertyLevels = new Map<string, number>();

  private static bnusSkillPointsAdded = new Map<number, number>();

  // 每N级加点一次
  public static HERO_LEVEL_PER_POINT = 2;
  /** 非 _level_ 后缀的 DataDriven 玩家属性，生效所需最低属性等级 */
  private static readonly SINGLE_DATA_DRIVEN_PROPERTY_MIN_LEVEL = 8;

  constructor() {
    print('PropertyController init');
    PropertyController.playerModifierKeyValues = LoadKeyValues(
      'scripts/npc/npc_items_modifier.txt',
    ) as PlayerModifierKeyValues | undefined;
    // lua modifier
    PropertyController.propertyLuaModiferMap.set(property_cast_range_bonus_stacking.name, 25);
    PropertyController.propertyLuaModiferMap.set(property_spell_amplify_percentage.name, 5);
    PropertyController.propertyLuaModiferMap.set(property_status_resistance_stacking.name, 4);
    PropertyController.propertyLuaModiferMap.set(property_incoming_damage_percentage.name, -4);
    PropertyController.propertyLuaModiferMap.set(property_attack_range_bonus.name, 25);
    PropertyController.propertyLuaModiferMap.set(property_lifesteal.name, 10);
    PropertyController.propertyLuaModiferMap.set(property_spell_lifesteal.name, 8);
    PropertyController.propertyLuaModiferMap.set(property_health_regen_percentage.name, 0.3);
    PropertyController.propertyLuaModiferMap.set(property_mana_regen_total_percentage.name, 0.3);
    PropertyController.propertyLuaModiferMap.set(property_ignore_movespeed_limit.name, 0.125);
    PropertyController.propertyLuaModiferMap.set(property_slow_immune.name, 0.125);
    PropertyController.propertyLuaModiferMap.set(property_aoe_bonus_constant_stacking.name, 15);

    // data driven modifier
    // 多档属性名须以 '_level_' 结尾；单档则为完整 modifier 名
    PropertyController.propertyDataDrivenModifierMap.set(
      property_cooldown_percentage.name,
      'modifier_player_property_cooldown_percentage_level_',
    );
    PropertyController.propertyDataDrivenModifierMap.set(
      property_movespeed_bonus_constant.name,
      'modifier_player_property_movespeed_bonus_constant_level_',
    );
    PropertyController.propertyDataDrivenModifierMap.set(
      property_bonus_vision.name,
      'modifier_player_property_bonus_vision_level_',
    );
    PropertyController.propertyDataDrivenModifierMap.set(
      property_evasion_constant.name,
      'modifier_player_property_evasion_constant_level_',
    );
    PropertyController.propertyDataDrivenModifierMap.set(
      property_magical_resistance_bonus.name,
      'modifier_player_property_magical_resistance_bonus_level_',
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
    PropertyController.propertyDataDrivenModifierMap.set(
      property_cannot_miss.name,
      'modifier_player_property_cannot_miss',
    );
    PropertyController.propertyDataDrivenModifierMap.set(
      property_flying.name,
      'modifier_player_property_flying',
    );

    PropertyController.propertyDataDrivenPropertyKeyMap.set(
      property_cooldown_percentage.name,
      'MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE',
    );
    PropertyController.propertyDataDrivenPropertyKeyMap.set(
      property_movespeed_bonus_constant.name,
      'MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT',
    );
    PropertyController.propertyDataDrivenPropertyKeyMap.set(
      property_bonus_vision.name,
      'MODIFIER_PROPERTY_BONUS_DAY_VISION',
    );
    PropertyController.propertyDataDrivenPropertyKeyMap.set(
      property_evasion_constant.name,
      'MODIFIER_PROPERTY_EVASION_CONSTANT',
    );
    PropertyController.propertyDataDrivenPropertyKeyMap.set(
      property_magical_resistance_bonus.name,
      'MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS',
    );
    PropertyController.propertyDataDrivenPropertyKeyMap.set(
      property_physical_armor_bonus.name,
      'MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS',
    );
    PropertyController.propertyDataDrivenPropertyKeyMap.set(
      property_preattack_bonus_damage.name,
      'MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE',
    );
    PropertyController.propertyDataDrivenPropertyKeyMap.set(
      property_attackspeed_bonus_constant.name,
      'MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT',
    );
    PropertyController.propertyDataDrivenPropertyKeyMap.set(
      property_stats_strength_bonus.name,
      'MODIFIER_PROPERTY_STATS_STRENGTH_BONUS',
    );
    PropertyController.propertyDataDrivenPropertyKeyMap.set(
      property_stats_agility_bonus.name,
      'MODIFIER_PROPERTY_STATS_AGILITY_BONUS',
    );
    PropertyController.propertyDataDrivenPropertyKeyMap.set(
      property_stats_intellect_bonus.name,
      'MODIFIER_PROPERTY_STATS_INTELLECT_BONUS',
    );
  }

  /**
   * 限制属性，只有达到特定等级后才生效，不限制的属性从1级开始生效
   */
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

  // 重置属性
  public static RemoveAllPlayerProperty(steamAccountId: number) {
    const hero = PlayerHelper.FindHeroBySteeamAccountId(steamAccountId);
    if (!hero) {
      return;
    }

    PropertyController.ClearAppliedPropertyLevels(hero);

    // 移除Lua modifier
    for (const key of PropertyController.propertyLuaModiferMap.keys()) {
      hero.RemoveModifierByName(key);
    }

    // 移除DataDriven modifier
    for (const key of PropertyController.propertyDataDrivenModifierMap.keys()) {
      const value = PropertyController.propertyDataDrivenModifierMap.get(key);
      if (value) {
        PropertyController.RemoveDataDrivenPlayerPropertyModifiers(hero, value);
      }
    }
  }

  /** 按注册名卸下：多档卸 1–8，单档卸该名 */
  private static RemoveDataDrivenPlayerPropertyModifiers(
    hero: CDOTA_BaseNPC_Hero,
    registeredModifierName: string,
  ) {
    if (registeredModifierName.endsWith('_level_')) {
      for (let i = 1; i <= 8; i++) {
        hero.RemoveModifierByName(`${registeredModifierName}${i}`);
      }
    } else {
      hero.RemoveModifierByName(registeredModifierName);
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

  /**
   * 英雄升级专用入口：档位没有变化时不重复删除/创建 modifier。
   * 属性主动加点、重置和英雄出生仍走 LevelupHeroProperty，保证可以强制刷新。
   */
  public static RefreshHeroPropertyOnLevelUp(
    hero: CDOTA_BaseNPC_Hero,
    property: PlayerProperty,
  ): boolean {
    if (hero.HasModifier(DEATH_PROPHET_POSSESSION_TARGET_MODIFIER)) return false;

    const activeLevel = PropertyController.GetPropertyActiveLevel(hero, property);
    const cacheKey = PropertyController.GetAppliedPropertyLevelKey(hero, property.name);
    if (PropertyController.appliedPropertyLevels.get(cacheKey) === activeLevel) return false;

    PropertyController.LevelupHeroProperty(hero, property);
    return true;
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
    // 夺舍目标的玩家成长由单一可见状态提供快照。其临时 PlayerID 不能触发正式属性 modifier，
    // 否则附身期间升级后会把死亡先知的永久属性留到目标复活。
    if (hero.HasModifier(DEATH_PROPHET_POSSESSION_TARGET_MODIFIER)) {
      return;
    }

    const name = property.name;
    const activeLevel = PropertyController.GetPropertyActiveLevel(hero, property);

    // 先记录当前档位。即使当前数值为 0 或功能被关闭，连续升级事件也不应重复扫描它；
    // 主动加点/重置仍会无条件调用本方法并覆盖缓存。
    PropertyController.appliedPropertyLevels.set(
      PropertyController.GetAppliedPropertyLevelKey(hero, name),
      activeLevel,
    );

    // 移速属性作为例外,即使禁用玩家属性也生效
    const isMoveSpeedProperty = property.name === 'property_movespeed_bonus_constant';
    if (!GameRules.Option.enablePlayerAttribute && !isMoveSpeedProperty) return;

    // 设置额外技能点
    if (name === 'property_skill_points_bonus') {
      PropertyController.SetBonusSkillPoints(hero, property, activeLevel);
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
        PropertyController.RefreshDataDrivenPlayerProperty(
          hero,
          dataDrivenModifierName,
          activeLevel,
        );
      }
    }
  }

  private static GetAppliedPropertyLevelKey(
    hero: CDOTA_BaseNPC_Hero,
    propertyName: string,
  ): string {
    return `${hero.GetEntityIndex()}:${propertyName}`;
  }

  private static ClearAppliedPropertyLevels(hero: CDOTA_BaseNPC_Hero): void {
    const prefix = `${hero.GetEntityIndex()}:`;
    for (const key of PropertyController.appliedPropertyLevels.keys()) {
      if (key.startsWith(prefix)) PropertyController.appliedPropertyLevels.delete(key);
    }
  }

  /**
   * 把指定玩家的局外成长折叠成一份纯数值快照。
   * 夺舍状态直接声明这些属性，不创建/扫描/移除玩家属性 modifier，也不会覆盖目标原有成长。
   */
  public static BuildTemporaryHeroPropertyValues(
    hero: CDOTA_BaseNPC_Hero,
    properties: PlayerProperty[],
  ): TemporaryHeroPropertyValues {
    const values: TemporaryHeroPropertyValues = {
      cooldownPercentage: 0,
      castRangeBonus: 0,
      aoeBonus: 0,
      spellAmplifyPercentage: 0,
      statusResistance: 0,
      evasion: 0,
      magicalResistance: 0,
      incomingDamagePercentage: 0,
      attackRangeBonus: 0,
      physicalArmor: 0,
      preattackDamage: 0,
      attackSpeed: 0,
      strength: 0,
      agility: 0,
      intellect: 0,
      healthRegenPercentage: 0,
      manaRegenPercentage: 0,
      lifesteal: 0,
      spellLifesteal: 0,
      moveSpeed: 0,
      bonusVision: 0,
      ignoreMoveSpeedLimit: 0,
      cannotMiss: 0,
      slowImmune: 0,
      flying: 0,
    };

    for (const property of properties) {
      const isMoveSpeedProperty = property.name === property_movespeed_bonus_constant.name;
      if (!GameRules.Option.enablePlayerAttribute && !isMoveSpeedProperty) continue;
      if (property.name === 'property_skill_points_bonus') continue;

      const activeLevel = PropertyController.GetPropertyActiveLevel(hero, property);
      if (activeLevel <= 0) continue;

      switch (property.name) {
        case property_cooldown_percentage.name:
          values.cooldownPercentage = PropertyController.GetDataDrivenPropertyValue(
            property.name,
            activeLevel,
          );
          break;
        case property_cast_range_bonus_stacking.name:
          values.castRangeBonus = 25 * activeLevel;
          break;
        case property_aoe_bonus_constant_stacking.name:
          values.aoeBonus = 15 * activeLevel;
          break;
        case property_spell_amplify_percentage.name:
          values.spellAmplifyPercentage = 5 * activeLevel;
          break;
        case property_status_resistance_stacking.name:
          values.statusResistance = 4 * activeLevel;
          break;
        case property_evasion_constant.name:
          values.evasion = PropertyController.GetDataDrivenPropertyValue(
            property.name,
            activeLevel,
          );
          break;
        case property_magical_resistance_bonus.name:
          values.magicalResistance = PropertyController.GetDataDrivenPropertyValue(
            property.name,
            activeLevel,
          );
          break;
        case property_incoming_damage_percentage.name:
          values.incomingDamagePercentage = -4 * activeLevel;
          break;
        case property_attack_range_bonus.name:
          values.attackRangeBonus = 25 * activeLevel;
          break;
        case property_physical_armor_bonus.name:
          values.physicalArmor = PropertyController.GetDataDrivenPropertyValue(
            property.name,
            activeLevel,
          );
          break;
        case property_preattack_bonus_damage.name:
          values.preattackDamage = PropertyController.GetDataDrivenPropertyValue(
            property.name,
            activeLevel,
          );
          break;
        case property_attackspeed_bonus_constant.name:
          values.attackSpeed = PropertyController.GetDataDrivenPropertyValue(
            property.name,
            activeLevel,
          );
          break;
        case property_stats_strength_bonus.name:
          values.strength = PropertyController.GetDataDrivenPropertyValue(
            property.name,
            activeLevel,
          );
          break;
        case property_stats_agility_bonus.name:
          values.agility = PropertyController.GetDataDrivenPropertyValue(
            property.name,
            activeLevel,
          );
          break;
        case property_stats_intellect_bonus.name:
          values.intellect = PropertyController.GetDataDrivenPropertyValue(
            property.name,
            activeLevel,
          );
          break;
        case property_health_regen_percentage.name:
          values.healthRegenPercentage = 0.3 * activeLevel;
          break;
        case property_mana_regen_total_percentage.name:
          values.manaRegenPercentage = 0.3 * activeLevel;
          break;
        case property_lifesteal.name:
          values.lifesteal = 10 * activeLevel;
          break;
        case property_spell_lifesteal.name:
          values.spellLifesteal = 8 * activeLevel;
          break;
        case property_movespeed_bonus_constant.name:
          values.moveSpeed = PropertyController.GetDataDrivenPropertyValue(
            property.name,
            activeLevel,
          );
          break;
        case property_bonus_vision.name:
          values.bonusVision = PropertyController.GetDataDrivenPropertyValue(
            property.name,
            activeLevel,
          );
          break;
        case property_ignore_movespeed_limit.name:
          values.ignoreMoveSpeedLimit = 1;
          break;
        case property_cannot_miss.name:
          values.cannotMiss =
            activeLevel >= PropertyController.SINGLE_DATA_DRIVEN_PROPERTY_MIN_LEVEL ? 1 : 0;
          break;
        case property_slow_immune.name:
          values.slowImmune = 1;
          break;
        case property_flying.name:
          values.flying =
            activeLevel >= PropertyController.SINGLE_DATA_DRIVEN_PROPERTY_MIN_LEVEL ? 1 : 0;
          break;
      }
    }

    return values;
  }

  /** 从现有玩家属性 KV 的实际档位读取数值，避免为夺舍维护第二套成长常量。 */
  private static GetDataDrivenPropertyValue(propertyName: string, activeLevel: number): number {
    const modifierPrefix = PropertyController.propertyDataDrivenModifierMap.get(propertyName);
    const propertyKey = PropertyController.propertyDataDrivenPropertyKeyMap.get(propertyName);
    if (!modifierPrefix || !propertyKey) return 0;

    const modifierName = modifierPrefix.endsWith('_level_')
      ? `${modifierPrefix}${activeLevel}`
      : modifierPrefix;
    const rawValue =
      PropertyController.playerModifierKeyValues?.item_player_modifiers?.Modifiers?.[modifierName]
        ?.Properties?.[propertyKey];
    return Number(rawValue ?? 0);
  }

  private static SetBonusSkillPoints(
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

  private static RefreshDataDrivenPlayerProperty(
    hero: CDOTA_BaseNPC_Hero,
    modifierName: string,
    level: number,
  ) {
    const registeredName = modifierName;
    PropertyController.RemoveDataDrivenPlayerPropertyModifiers(hero, registeredName);

    let applyName = modifierName;
    if (registeredName.endsWith('_level_')) {
      if (level === 0) {
        return;
      }
      applyName = registeredName + level;
    } else if (level < PropertyController.SINGLE_DATA_DRIVEN_PROPERTY_MIN_LEVEL) {
      return;
    }

    if (!this.PLAYER_MODIFER_DATA_DRIVEN_ITEM) {
      this.PLAYER_MODIFER_DATA_DRIVEN_ITEM = CreateItem(
        'item_player_modifiers',
        undefined,
        undefined,
      ) as CDOTA_Item_DataDriven;
    }
    this.PLAYER_MODIFER_DATA_DRIVEN_ITEM.ApplyDataDrivenModifier(hero, hero, applyName, {
      duration: -1,
    });
  }
}
