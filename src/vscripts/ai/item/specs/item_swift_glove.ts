import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 无限手套：继承团队之手主动技能，条件与其一致。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_swift_glove',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: { unitCondition: { excludeAncient: true } },
    },
  },
];
