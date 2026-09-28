import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 纷争面纱 / 赫拉的神秘面纱（升级链）：以自身为中心生效，范围内有敌方英雄就放。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_veil_of_discord',
    priority: ItemPriority.Damage,
    targetSide: TargetSide.EnemyHero,
    condition: { target: { rangeFromAbilityValue: 'debuff_radius', ignoresMagicImmune: true } },
  },
  {
    itemName: 'item_veil_of_discord_2',
    priority: ItemPriority.Damage,
    targetSide: TargetSide.EnemyHero,
    condition: { target: { rangeFromAbilityValue: 'debuff_radius', ignoresMagicImmune: true } },
  },
];
