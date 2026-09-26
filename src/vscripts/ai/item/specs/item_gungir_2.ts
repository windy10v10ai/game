import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 风暴之锤：POINT 施法，无条件释放——bot 视野内可能只有 1 个敌人，不设数量下限。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_gungir_2',
    priority: ItemPriority.Control,
    targetSide: TargetSide.EnemyHero,
  },
];
