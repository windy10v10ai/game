/**
 * 服务器类型枚举
 * 标识游戏运行在哪个服务器上
 */
export enum SERVER_TYPE {
  WINDY = 'WINDY',
  TEST = 'TEST',
  TENVTEN = 'TENVTEN',
  LOCAL = 'LOCAL',
  UNKNOWN = 'UNKNOWN',
}

/**
 * GA4 配置 DTO
 * 从 /api/game/start 端点接收（仅官方服务器）
 */
export interface GA4ConfigDto {
  measurementId: string;
  apiSecret: string;
  serverType: SERVER_TYPE;
}

/**
 * GA4 事件参数
 * GA4 事件参数的基础结构
 */
export interface GA4EventParam {
  [key: string]: string | number | boolean;
}

/**
 * GA4 事件
 * 单个 GA4 事件的结构
 */
export interface GA4Event {
  name: string;
  params?: GA4EventParam;
}

/**
 * GA4 用户属性
 * GA4 用户属性的结构
 */
export interface GA4UserProperty {
  [key: string]: {
    value: string | number | boolean;
  };
}

/**
 * GA4 事件 Payload
 * GA4 Measurement Protocol 的完整 payload 结构
 */
export interface GA4EventPayload {
  client_id: string;
  user_id?: string;
  events: GA4Event[];
  user_properties?: GA4UserProperty;
}
