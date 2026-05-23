import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 冰霜魔盾：UNIT_TARGET / TEAM_FRIENDLY / HERO+BASIC+BUILDING（含 INVULNERABLE flag）。
 *
 * - 对友方英雄：血量低于 90% 才施加，避免给满血队友浪费。
 * - 对友方建筑（防御塔/兵营）：无血量限制，但要求目标未带 modifier_lich_frost_shield，
 *   避免在持续时间内重复刷新。
 *
 * Modifier 名来源：abilities_schinese.txt 中 DOTA_Tooltip_modifier_lich_frost_shield。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'lich_frost_shield',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: {
        unitCondition: {
          healthPercent: { lte: 90 },
          noModifier: 'modifier_lich_frost_shield',
        },
      },
    },
  },
  {
    abilityName: 'lich_frost_shield',
    targetSide: TargetSide.FriendlyBuilding,
    condition: {
      target: {
        unitCondition: {
          noModifier: 'modifier_lich_frost_shield',
        },
      },
    },
  },
];
