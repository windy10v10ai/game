import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 鹰眼炮台：NO_TARGET buff 范围内有敌人即用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_hawkeye_turret',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1200 }, ignoresMagicImmune: true },
    },
  },
];
