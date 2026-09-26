import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 绝杀秘技：POINT + AOE + CHANNELLED，召唤分身群殴目标。
 *
 * 运行时同时带指向单位的位，指向敌人会被拒绝，强制点地。
 * 施法距离定义在 AbilityValues 的 AbilityCastRange 子字段，engine 自动探测读不到，需显式指定。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'riki_tricks_of_the_trade',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { rangeFromAbilityValue: 'AbilityCastRange', castMode: 'targetPosition' },
    },
  },
  {
    abilityName: 'riki_tricks_of_the_trade',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: { rangeFromAbilityValue: 'AbilityCastRange', castMode: 'targetPosition' },
    },
  },
];
