/**
 * 获取当前玩家的 Steam 账号 ID
 * @returns Steam 账号 ID
 */
export function GetLocalPlayerSteamAccountID(): string {
  const steamId64 = Game.GetLocalPlayerInfo().player_steamid;
  const steamId32 = ConvertSteamIdTo32Bit(steamId64);
  return steamId32;
}

/**
 * 将 Steam ID 转换为 32 位数字
 * @param steamId64 Steam ID 64 位
 * @returns Steam ID 32 位
 */
export function ConvertSteamIdTo32Bit(steamId64: string): string {
  const steamId32 = (BigInt(steamId64) - BigInt('76561197960265728')).toString();
  return steamId32;
}
