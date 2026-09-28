import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 相位鞋 / 阿迪王 / 阿迪王plus（升级链）：常驻 buff，不受距离限制，CD 好了就用，赶路也受益。 */
export const SPECS: ItemSpec[] = [
  { itemName: 'item_phase_boots', targetSide: TargetSide.Self },
  { itemName: 'item_adi_king', targetSide: TargetSide.Self },
  { itemName: 'item_adi_king_plus', targetSide: TargetSide.Self },
];
