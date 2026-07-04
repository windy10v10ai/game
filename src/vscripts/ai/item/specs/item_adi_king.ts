import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 阿迪王：常驻 buff，不受距离限制，CD 好了就用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_adi_king',
    targetSide: TargetSide.Self,
  },
];
