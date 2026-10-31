/** 全图找活着的肉山：两队共用一份，肉山不在时隔一段时间才查一次，不靠刷新时间推算。 */

const CHECK_SECONDS = 10;
// 每只肉山留给玩家的时间在这个范围里随机，玩家猜不到 bot 什么时候来
const WAIT_MIN = 60;
const WAIT_MAX = 150;

let roshan: CDOTA_BaseNPC | undefined;
let checkedAt = -Infinity;
let seenAt = 0;
let waitSeconds = WAIT_MAX;

export function FindRoshan(): CDOTA_BaseNPC | undefined {
  if (roshan && IsValidEntity(roshan) && roshan.IsAlive()) {
    return roshan;
  }
  const now = GameRules.GetGameTime();
  if (now - checkedAt < CHECK_SECONDS) {
    return undefined;
  }
  checkedAt = now;
  const found = Entities.FindByClassname(undefined, 'npc_dota_roshan') as CDOTA_BaseNPC | undefined;
  if (found && found.IsAlive() && found !== roshan) {
    seenAt = now;
    waitSeconds = RandomFloat(WAIT_MIN, WAIT_MAX);
  }
  roshan = found;
  return roshan && roshan.IsAlive() ? roshan : undefined;
}

/** 当前这只肉山被发现的时间（按查找间隔算，比真正刷出晚最多一个间隔）与留给玩家的时间。 */
export function RoshanTiming(): { seenAt: number; waitSeconds: number } {
  return { seenAt, waitSeconds };
}
