import { PlayerHelper } from '../helper/player-helper';
import { CMD } from './debug-cmd';

/** 给每个已有已选英雄添加指定物品。 */
export function addItemToAllSelectedHeroes(itemName: string): void {
  PlayerHelper.ForEachPlayer((playerId) => {
    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    if (!hero) return;
    hero.AddItemByName(itemName);
  });
}

/** 处理无需参数、给全体英雄发放固定物品的调试命令。 */
export function handleGlobalItemDebugCommand(cmd: string): void {
  if (cmd === CMD.ADD_BKB_ALL) {
    addItemToAllSelectedHeroes('item_black_king_bar_2');
  }
  if (cmd === CMD.ADD_PHASE_AXE_ALL) {
    addItemToAllSelectedHeroes('item_manta_2');
  }
}
