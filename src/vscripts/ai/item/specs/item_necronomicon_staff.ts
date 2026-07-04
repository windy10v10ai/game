import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 死灵法杖：跳过已被控目标。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_necronomicon_staff',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { unitCondition: { notActionable: true } },
    },
  },
];
