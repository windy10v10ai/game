import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 虚灵之刃：跳过已被控目标。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_ethereal_blade',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { unitCondition: { notActionable: true } },
    },
  },
];
