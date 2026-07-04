import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 邪恶镰刀：跳过已被控目标，避免浪费在无法再控的敌人身上。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_sheepstick',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { unitCondition: { notActionable: true } },
    },
  },
];
