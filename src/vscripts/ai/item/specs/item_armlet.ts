import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 臂章及其升级链（plus / pro_max / light / dark / artifact）：始终 toggle on。 */
export const SPECS: ItemSpec[] = [
  // {
  //   itemName: 'item_armlet',
  //   targetSide: TargetSide.Self,
  //   condition: { action: { toggleOn: true } },
  // },
  // {
  //   itemName: 'item_armlet_plus',
  //   targetSide: TargetSide.Self,
  //   condition: { action: { toggleOn: true } },
  // },
  {
    itemName: 'item_armlet_pro_max',
    targetSide: TargetSide.Self,
    condition: { action: { toggleOn: true } },
  },
  // {
  //   itemName: 'item_armlet_light',
  //   targetSide: TargetSide.Self,
  //   condition: { action: { toggleOn: true } },
  // },
  // {
  //   itemName: 'item_armlet_dark',
  //   targetSide: TargetSide.Self,
  //   condition: { action: { toggleOn: true } },
  // },
  // {
  //   itemName: 'item_armlet_artifact',
  //   targetSide: TargetSide.Self,
  //   condition: { action: { toggleOn: true } },
  // },
];
