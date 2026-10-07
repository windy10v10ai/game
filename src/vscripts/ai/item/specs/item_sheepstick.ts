import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/**
 * 邪恶镰刀 / 死灵法杖（升级链）。
 * 邪恶镰刀跳过已被控目标，避免浪费；死灵法杖带伤害，目标已被控制也照放，让控制重叠。
 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_sheepstick',
    priority: ItemPriority.Control,
    targetSide: TargetSide.EnemyHero,
    control: true,
    condition: { target: { unitCondition: { notActionable: true } } },
  },
  {
    itemName: 'item_necronomicon_staff',
    priority: ItemPriority.Control,
    targetSide: TargetSide.EnemyHero,
    control: true,
  },
];
