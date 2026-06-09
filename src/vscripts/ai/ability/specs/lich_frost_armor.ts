import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 霜冻护甲：UNIT_TARGET | FRIENDLY。给友军（含自己）上护甲并减速攻击者。
 *
 * 项目把奥术法师寒冰盔甲克隆给巫妖，走正常主动释放（非 autocast），
 * noModifier 防止持续期内重复刷新。modifier 名见项目本地化 addon_schinese.txt。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'lich_frost_armor',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: {
        unitCondition: { noModifier: 'modifier_lich_frost_armor' },
      },
    },
  },
];
