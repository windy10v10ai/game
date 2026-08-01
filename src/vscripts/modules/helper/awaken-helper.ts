import { Player } from '../../api/player';
import { FREE_TRIAL_HEROES } from '../awaken/awaken-config';
import { applyAwakenByHero } from '../awaken/awaken-replacer';
import { PlayerHelper } from './player-helper';

export class AwakenHelper {
  /**
   * 按积分永久解锁记录或限时免费清单赋予觉醒技能，效果与觉醒石一致。
   * applyAwakenByHero 本身幂等，与觉醒石使用顺序无关。
   */
  static ApplyUnlockedAwaken(hero: CDOTA_BaseNPC_Hero, steamAccountId: number): void {
    if (!PlayerHelper.IsHumanPlayer(hero)) return;
    const heroName = hero.GetUnitName();
    const unlocked = Player.GetAwakenedHeroes(steamAccountId).some((h) => h.heroName === heroName);
    if (unlocked || FREE_TRIAL_HEROES.includes(heroName)) {
      applyAwakenByHero(hero);
    }
  }
}
