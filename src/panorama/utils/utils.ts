/**
 * 获取当前玩家的 Steam 账号 ID
 * @returns Steam 账号 ID
 */
export function GetLocalPlayerSteamAccountID(): string {
  const localPlayerInfo = Game.GetLocalPlayerInfo();
  if (!localPlayerInfo) {
    return '';
  }
  const steamId64 = localPlayerInfo.player_steamid;
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

export function GetOpenMemberUrl(): string {
  // const urlNormal =
  //   'https://afdian.com/order/create?plan_id=6e27c8103bd011ed887852540025c377&product_type=0&remark=';
  const urlPremium =
    'https://afdian.com/order/create?plan_id=6c206f360d4c11f0a2cb52540025c377&product_type=0&remark=';
  return urlPremium + GetLocalPlayerSteamAccountID();
  // const member = GetMember(GetLocalPlayerSteamAccountID());
  // if (member && member.level === 2) {
  // }
  // return urlNormal + GetLocalPlayerSteamAccountID();
}

/**
 * 添加自定义键位绑定
 * @param keyName 键位名称
 * @param keydownCallback 按下键位时的回调函数
 * @param keyupCallback 松开键位时的回调函数
 */
export function AddKeyBind(
  keyName: string,
  keydownCallback?: () => void,
  keyupCallback?: () => void,
) {
  const command = `${keyName}${Date.now()}`;

  Game.CreateCustomKeyBind(keyName, `+${command}`);
  if (keydownCallback) {
    Game.AddCommand(`+${command}`, keydownCallback, '', 1 << 32);
  }
  if (keyupCallback) {
    Game.AddCommand(`-${command}`, keyupCallback, '', 1 << 32);
  }
}

export function GetDotaHud() {
  let panel: Panel | null = $.GetContextPanel();
  while (panel && panel.id !== 'Hud') {
    panel = panel.GetParent();
  }

  if (!panel) {
    throw new Error('Could not find Hud root from panel with id: ' + $.GetContextPanel().id);
  }

  return panel;
}

export function FindDotaHudElement(id: string) {
  return GetDotaHud().FindChildTraverse(id);
}
