import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 诡计之雾：1200 范围内有 3 个以上己方英雄（凑齐一支小队），且 1800 内没有敌方英雄/建筑时释放。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_smoke_of_deceit',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: { range: { lte: 1200 }, count: { gte: 3 }, ignoresMagicImmune: true },
      self: {
        unitCondition: { noModifier: 'modifier_smoke_of_deceit' },
        noEnemyHeroInRange: 1800,
        noEnemyBuildingInRange: 1800,
      },
    },
    usableFromBackpack: true,
  },
];
