import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 阿托斯之棍：缠住敌方英雄，跳过已被控制或已被缠住的目标。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_rod_of_atos',
    priority: ItemPriority.Control,
    targetSide: TargetSide.EnemyHero,
    control: true,
    condition: {
      target: {
        unitCondition: { notActionable: true, noModifier: ['modifier_rod_of_atos_debuff'] },
      },
    },
  },
];
