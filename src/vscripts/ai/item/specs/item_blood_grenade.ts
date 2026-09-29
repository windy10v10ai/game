import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 血腥榴弹：扔向施法距离内的敌方英雄，扣血施放，血量低时不扔。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_blood_grenade',
    priority: ItemPriority.Damage,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { ignoresMagicImmune: true },
      self: { unitCondition: { healthPercent: { gte: 40 } } },
    },
  },
];
