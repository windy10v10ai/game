import {
  GetAfdianSubscribeUrl,
  KOFI_SUBSCRIBE_URL,
  AFDIAN_SHOP_URL,
  KOFI_SHOP_URL,
} from '@utils/utils';

export const enum MemberLevel {
  NORMAL = 1,
  PREMIUM = 2,
}

export const CROWN_GOLD = 'file://{images}/custom_game/golden_crown.png';
export const CROWN_GREY = 'file://{images}/custom_game/golden_crown_grey.png';
export const AFDIAN_ICON = 'file://{images}/custom_game/afdian.png';
export const KOFI_LOGO = 'file://{images}/custom_game/member/ko-fi-logo-small.png';

export type MemberSubTab = 'status' | 'subscribe';

export const MEMBER_SUB_TABS: { id: MemberSubTab; label: string }[] = [
  { id: 'status', label: $.Localize('#member_subtab_status') },
  { id: 'subscribe', label: $.Localize('#member_subtab_subscribe') },
];

export const AFDIAN_ACTIVATE_URL = 'https://windy10v10ai.com/regist/afdian';
export const KOFI_ACTIVATE_URL = 'https://windy10v10ai.com/regist/kofi';

export const openUrl = (url: string) => () => $.DispatchEvent('ExternalBrowserGoToURL', url);

export { GetAfdianSubscribeUrl, KOFI_SUBSCRIBE_URL, AFDIAN_SHOP_URL, KOFI_SHOP_URL };
