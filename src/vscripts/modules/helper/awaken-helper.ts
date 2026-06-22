import { Player } from '../../api/player';
import { applyAwakenByHero } from '../awaken/awaken-replacer';
import { PlayerHelper } from './player-helper';

export class AwakenHelper {
  /**
   * 按玩家账号已用积分永久解锁的英雄列表赋予觉醒技能，效果与觉醒石一致。
   * applyAwakenByHero 本身幂等，与觉醒石使用顺序无关。
   */
  static ApplyUnlockedAwaken(hero: CDOTA_BaseNPC_Hero, steamAccountId: number): void {
    if (!PlayerHelper.IsHumanPlayer(hero)) return;
    const awakenedHeroes = Player.GetAwakenedHeroes(steamAccountId);
    if (awakenedHeroes.some((h) => h.heroName === hero.GetUnitName())) {
      applyAwakenByHero(hero);
    }
  }
}
