import {
  AFDIAN_SHOP_URL,
  GetAfdianSubscribeUrl,
  KOFI_SHOP_URL,
  KOFI_SUBSCRIBE_URL,
} from '@utils/utils';

export const enum MemberLevel {
  NORMAL = 1,
  PREMIUM = 2,
}

export const CROWN_GOLD = 'file://{images}/custom_game/golden_crown.png';
export const CROWN_GREY = 'file://{images}/custom_game/golden_crown_grey.png';
export const AFDIAN_ICON = 'file://{images}/custom_game/afdian.png';
export const KOFI_LOGO = 'file://{images}/custom_game/member/ko-fi-logo-small.png';

export type MemberSubTab = 'status' | 'subscribe' | 'points';

export const MEMBER_SUB_TABS: { id: MemberSubTab; label: string }[] = [
  { id: 'status', label: $.Localize('#member_subtab_status') },
  { id: 'subscribe', label: $.Localize('#member_subtab_subscribe') },
  { id: 'points', label: $.Localize('#member_subtab_points') },
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

/** 单个档位（月数 → 价格 + 折扣信息） */
export interface MembershipPlanTier {
  quantity: number; // 月数
  price: string; // 总价（已含折扣，直接展示）
  /** 折扣百分比，如 10 表示 10% off */
  discountPercent: number;
  /** 折合每月单价（仅用于展示）；单月档位与 price 相同 */
  pricePerMonth: string;
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
    tiers: [
      { quantity: 1, price: '28.00', discountPercent: 6, pricePerMonth: '28.00' },
      { quantity: 3, price: '80.40', discountPercent: 10, pricePerMonth: '26.80' },
      { quantity: 12, price: '300.00', discountPercent: 16, pricePerMonth: '25.00' },
      { quantity: 36, price: '856.80', discountPercent: 20, pricePerMonth: '23.80' },
    ],
  },
  afdian: {
    currency: 'cny',
    tiers: [{ quantity: 1, price: '29.80', discountPercent: 0, pricePerMonth: '29.80' }],
  },
  kofi: {
    currency: 'usd',
    tiers: [{ quantity: 1, price: '4.00', discountPercent: 0, pricePerMonth: '4.00' }],
  },
};

/**
 * 支付宝积分档位（点击直接二维码下单）。
 * savedAmount 是相对爱发电原价的差价（营销展示用，非精算），直接写在档位上随价格一起改，
 * 避免与爱发电原价数组靠 index 隐式对齐而出错。
 */
export interface AlipayPointsTier {
  productCode: AlipayProductCode;
  points: number;
  price: string;
  savedAmount: number;
}

export const ALIPAY_POINTS_TIERS: AlipayPointsTier[] = [
  { productCode: AlipayProductCode.POINTS_TIER1, points: 3500, price: '78.00', savedAmount: 20 },
  { productCode: AlipayProductCode.POINTS_TIER2, points: 11000, price: '238.00', savedAmount: 42 },
  { productCode: AlipayProductCode.POINTS_TIER3, points: 28000, price: '568.00', savedAmount: 80 },
];

export { AFDIAN_SHOP_URL, GetAfdianSubscribeUrl, KOFI_SHOP_URL, KOFI_SUBSCRIBE_URL };
