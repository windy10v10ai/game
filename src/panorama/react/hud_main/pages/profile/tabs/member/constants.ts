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

// ============================================================
// 会员订阅平台 / 商品配置
// ============================================================

export type MembershipPlatform = 'alipay' | 'afdian' | 'kofi';
export type MembershipCurrency = 'cny' | 'usd';

/** 与后端 api/src/alipay/enums/alipay-product-code.enum.ts 保持一致 */
export enum AlipayProductCode {
  MEMBER_PREMIUM = 'MEMBER_PREMIUM',
  POINTS_TIER1 = 'POINTS_TIER1',
  POINTS_TIER2 = 'POINTS_TIER2',
  POINTS_TIER3 = 'POINTS_TIER3',
}

/** 单个档位（月数 → 价格）。未来可加 discountPercent / originalPrice 等折扣字段。 */
export interface MembershipPlanTier {
  quantity: number; // 月数
  price: string; // 总价（已含折扣，直接展示）
}

/** 平台配置：货币、可选档位列表。alipay 额外需要 productCode 传给后端。 */
export interface MembershipPlatformConfig {
  currency: MembershipCurrency;
  /** 仅内部支付平台（alipay）需要；外链平台留空 */
  productCode?: AlipayProductCode;
  tiers: MembershipPlanTier[];
}

export const MEMBERSHIP_PLATFORMS: Record<MembershipPlatform, MembershipPlatformConfig> = {
  alipay: {
    currency: 'cny',
    productCode: AlipayProductCode.MEMBER_PREMIUM,
    tiers: [{ quantity: 1, price: '28.00' }],
  },
  afdian: {
    currency: 'cny',
    tiers: [{ quantity: 1, price: '29.80' }],
  },
  kofi: {
    currency: 'usd',
    tiers: [{ quantity: 1, price: '4.00' }],
  },
};

export { GetAfdianSubscribeUrl, KOFI_SUBSCRIBE_URL, AFDIAN_SHOP_URL, KOFI_SHOP_URL };
