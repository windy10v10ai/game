import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 暗影萨满 - 枷锁：UNIT_TARGET | CHANNELLED / ENEMY / HERO | BASIC。
 *
 * 持续施法时间长，趁目标被控制时放更不容易被打断，让控制重叠。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'shadow_shaman_shackles',
    targetSide: TargetSide.EnemyHero,
    control: true,
  },
];
