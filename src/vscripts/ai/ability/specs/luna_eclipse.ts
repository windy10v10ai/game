import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 露娜 - 月蚀：NO_TARGET，有 A 杖时可以对友方单位或地面施放。
 *
 * 以自己为中心放：敌人进入身边范围就放。有 A 杖时优先对身边有敌人的队友放，让月光砸向队友所在的交战；
 * 敌人身边没有队友时，对敌人脚下的地面放。A 杖形态只接受友方单位或地面，不能指向敌人。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'luna_eclipse',
    targetSide: TargetSide.Self,
    condition: {
      self: { enemyHeroInRange: 675 },
    },
  },
  {
    abilityName: 'luna_eclipse',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      self: { unitCondition: { hasScepter: true } },
      target: {
        excludeSelf: true,
        enemiesNearby: { range: 675, count: 2 },
      },
    },
  },
  {
    abilityName: 'luna_eclipse',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: { unitCondition: { hasScepter: true } },
      target: { castMode: 'targetPosition' },
    },
  },
];
