import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 疯狂面具：开启后无法施法，等技能交出去再开，转为普攻输出。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_mask_of_madness',
    priority: ItemPriority.Buff,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 }, ignoresMagicImmune: true },
      self: { abilitiesOnCooldown: { seconds: 4, count: 1 } },
    },
  },
];
