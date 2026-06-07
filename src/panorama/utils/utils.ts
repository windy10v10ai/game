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

export function GetAfdianSubscribeUrl(): string {
  return (
    'https://ifdian.net/order/create?plan_id=6c206f360d4c11f0a2cb52540025c377&product_type=0&remark=' +
    GetLocalPlayerSteamAccountID()
  );
}

/**
 * 爱发电积分下单链接（按档位）。末尾追加 remark={steamId32} 让爱发电下单页带上账号，
 * 后台据此自动发积分（与会员订阅同机制）。三个 URL 对应 3500 / 11000 / 28000（从低到高）。
 * sku 参数保持 percent-encoded 原样（%5B%7B... 即 [{...}]），不要 decode——
 * 链接直接交给 ExternalBrowserGoToURL 打开，解码后的 " [ { 空格会破坏 URL 解析。
 */
const AFDIAN_POINTS_BASE_URLS = [
  'https://ifdian.net/order/create?product_type=1&plan_id=6f73a48e546011eda08052540025c377&sku=%5B%7B%22sku_id%22%3A%220c5d8f6c682511ed9b3852540025c377%22%2C%22count%22%3A1%7D%5D&viokrz_ex=0&fr=afcom',
  'https://ifdian.net/order/create?product_type=1&plan_id=29df1632688911ed9e7052540025c377&sku=%5B%7B%22sku_id%22%3A%2229e33974688911ed815d52540025c377%22%2C%22count%22%3A1%7D%5D&viokrz_ex=0&fr=afcom',
  'https://ifdian.net/order/create?product_type=1&plan_id=0783fa70688a11edacd452540025c377&sku=%5B%7B%22sku_id%22%3A%22078882b6688a11edb2ca52540025c377%22%2C%22count%22%3A1%7D%5D&viokrz_ex=0&fr=afcom',
];

export function GetAfdianPointsUrl(tierIndex: number): string {
  return AFDIAN_POINTS_BASE_URLS[tierIndex] + '&remark=' + GetLocalPlayerSteamAccountID();
}

export const KOFI_POINTS_URLS = [
  'https://ko-fi.com/s/74a1b5be84',
  'https://ko-fi.com/s/0e9591aa5d',
  'https://ko-fi.com/s/3d4304d9a7',
];

export const KOFI_SUBSCRIBE_URL = 'https://ko-fi.com/post/Membership-Z8Z01CDJLU';
export const AFDIAN_SHOP_URL = 'https://ifdian.net/a/windy10v10ai?tab=shop';
export const KOFI_SHOP_URL = 'https://ko-fi.com/windy10v10ai/shop';

export type PaymentPlatform = 'alipay' | 'afdian' | 'kofi';

/**
 * 支付方式展示顺序：简体中文玩家优先支付宝（折扣最大且仅限国内），
 * 其他语言优先 Ko-fi。数组首两项默认展示，第 3 项折叠。
 */
export function GetPaymentPlatformOrder(): PaymentPlatform[] {
  if ($.Language() === 'schinese') {
    return ['alipay', 'afdian', 'kofi'];
  }
  return ['kofi', 'afdian', 'alipay'];
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
