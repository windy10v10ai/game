/**
 * 击杀时分给未拿到击杀的队友的保底金币。
 *
 * @param victimLevel - 被击杀英雄的等级。
 * @param multiplayer - 是否多人局，多人局的队友更依赖这份补偿。
 * @returns 经过倍率前的金币。
 */
export function teamKillGold(victimLevel: number, multiplayer: boolean): number {
  let gold = 40;
  if (victimLevel <= 30) {
    gold = 5 + victimLevel * 0.5;
  } else if (victimLevel <= 50) {
    gold = 20 + (victimLevel - 30);
  }
  return Math.ceil(gold) * (multiplayer ? 2 : 1);
}
