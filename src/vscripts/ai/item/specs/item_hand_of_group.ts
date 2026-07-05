import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 团队之手 / 无限手套（升级链）：对小兵使用，排除远古野。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_hand_of_group',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: { unitCondition: { excludeAncient: true } },
    },
  },
  {
    itemName: 'item_swift_glove',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: { unitCondition: { excludeAncient: true } },
    },
  },
];
