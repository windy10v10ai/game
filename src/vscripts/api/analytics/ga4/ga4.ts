import { GameConfig } from '../../../modules/GameConfig';
import { reloadable } from '../../../utils/tstl-utils';
import {
  GA4ConfigDto,
  GA4Event,
  GA4EventPayload,
  GA4UserProperty,
  SERVER_TYPE,
} from './dto/ga4-dto';

// 重新导出 SERVER_TYPE 供外部使用
export { SERVER_TYPE };

/**
 * GA4 - Google Analytics 4 集成
 *
 * 此类处理使用 Measurement Protocol 向 Google Analytics 4 发送事件
 * 参考: https://developers.google.com/analytics/devguides/collection/protocol/ga4
 *
 * 架构:
 * - 配置从 /api/game/start 接收（仅官方服务器）
 * - 事件直接发送到 GA4 Measurement Protocol 端点
 * - 使用 Dota 2 的 CreateHTTPRequestScriptVM 发送 HTTP 请求
 * - 在 Tools 模式下自动启用调试模式（IsInToolsMode）
 */
@reloadable
export class GA4 {
  // GA4 Measurement Protocol 端点
  private static readonly MEASUREMENT_PROTOCOL_URL = 'https://www.google-analytics.com/mp/collect';

  // 配置
  private static measurementId: string | null = null;
  private static apiSecret: string | null = null;
  private static serverType: SERVER_TYPE = SERVER_TYPE.UNKNOWN;
  private static isInitialized = false;
  private static isDebugMode = false;

  // 服务器位置
  public static countryCode: string = '';

  /**
   * 使用服务器配置初始化 GA4
   * 在 Dota 2 Tools 模式下自动启用调试模式
   * @param config GA4 配置（measurementId 和 apiSecret）
   */
  public static Initialize(config: GA4ConfigDto) {
    this.measurementId = config.measurementId;
    this.apiSecret = config.apiSecret;
    this.serverType = config.serverType;
    this.isInitialized = true;

    // 在 Tools 模式下自动启用调试模式
    if (IsInToolsMode()) {
      this.isDebugMode = true;
    }

    print(`[GA4] Initialized with measurementId: ${this.measurementId}`);
    print(`[GA4] Server type: ${this.serverType}`);
    print(`[GA4] Debug mode: ${this.isDebugMode ? 'enabled' : 'disabled'}`);
  }

  /**
   * 检查 GA4 是否已初始化并准备好发送事件
   */
  public static IsInitialized(): boolean {
    return this.isInitialized && this.measurementId !== null && this.apiSecret !== null;
  }

  /**
   * 构建带有标准参数的 GA4 事件
   * @param eventName 事件名称（例如 'game_start', 'ability_picked'）
   * @param steamId Steam ID（用于 session_id，非玩家单位时使用0）
   * @param eventParams 自定义事件参数
   * @param engagementTimeMsec 互动时间（毫秒，默认 1000）
   * @returns 带有标准参数的 GA4Event
   */
  public static BuildEvent(
    eventName: string,
    steamId: number,
    eventParams: { [key: string]: string | number | boolean },
    engagementTimeMsec?: number,
  ): GA4Event {
    const matchId = GameRules.Script_GetMatchID().toString();
    const event: GA4Event = {
      name: eventName,
      params: {
        ...eventParams,
        session_id: `${steamId}-${matchId}`,
        session_number: Number(matchId),
        version: GameConfig.GAME_VERSION,
        match_id: Number(matchId),
        server_type: this.serverType,
        country: this.countryCode,
        engagement_time_msec: engagementTimeMsec || eventParams.engagement_time_msec || 1000,
        debug_mode: this.isDebugMode,
      },
    };

    return event;
  }

  /**
   * 向 GA4 发送单个事件
   * @param steamId Steam ID（非玩家单位时使用0）
   * @param event GA4 事件（使用 BuildEvent 创建）
   * @param userProperties 用户属性（可选）
   */
  public static SendEvent(steamId: number, event: GA4Event, userProperties?: GA4UserProperty) {
    if (!this.IsInitialized()) {
      print('[GA4] Not initialized, skipping event send');
      return;
    }

    this.SendEvents(steamId, [event], userProperties);
  }

  /**
   * 向 GA4 发送多个事件，自动按 GA4 上限（25）分批
   * @param steamId Steam ID（非玩家单位时使用0）
   * @param events GA4 事件数组
   * @param userProperties 用户属性（可选）
   */
  public static SendEvents(steamId: number, events: GA4Event[], userProperties?: GA4UserProperty) {
    if (!this.IsInitialized()) {
      print('[GA4] Not initialized, skipping events send');
      return;
    }

    const BATCH_SIZE = 25;
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      const payload: GA4EventPayload = {
        client_id: steamId.toString(),
        user_id: steamId.toString(),
        events: events.slice(i, i + BATCH_SIZE),
      };

      if (userProperties) {
        payload.user_properties = userProperties;
      }

      this.SendPayload(payload);
    }
  }

  /**
   * 向 GA4 Measurement Protocol 发送 payload
   * @param payload GA4 事件 payload
   */
  private static SendPayload(payload: GA4EventPayload) {
    if (!this.IsInitialized()) {
      print('[GA4] Missing configuration, cannot send payload');
      return;
    }

    const fullUrl = `${this.MEASUREMENT_PROTOCOL_URL}?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`;

    print(`[GA4] Sending ${payload.events.length} event(s) to GA4: ${json.encode(payload)}`);

    const request = CreateHTTPRequestScriptVM('POST', fullUrl);
    // 游廊对局的服务端拿不到请求对象，不守这一下会抛错并中断调用方的后续逻辑
    if (!request) {
      print('[GA4] http unavailable, event dropped');
      return;
    }
    request.SetHTTPRequestHeaderValue('Content-Type', 'application/json');
    request.SetHTTPRequestRawPostBody('application/json', json.encode(payload));
    request.SetHTTPRequestNetworkActivityTimeout(10);

    request.Send((result: CScriptHTTPResponse) => {
      if (result.StatusCode >= 200 && result.StatusCode < 300) {
        print(`[GA4] Successfully sent events. Status: ${result.StatusCode}`);
      } else {
        print(
          `[GA4] Failed to send events. Status: ${result.StatusCode}, Response: ${result.Body}`,
        );
      }
    });
  }

  /**
   * 取服务器所在国家，结算上报与 GA4 事件都带上它
   */
  public static FetchCountryCode() {
    const apiUrl = 'https://cloudflare.com/cdn-cgi/trace';
    const request = CreateHTTPRequestScriptVM('GET', apiUrl);
    if (!request) {
      print('[GA4] http unavailable, cannot fetch server location');
      return;
    }
    request.SetHTTPRequestNetworkActivityTimeout(5);

    request.Send((result: CScriptHTTPResponse) => {
      if (result.StatusCode < 200 || result.StatusCode >= 300) {
        print(`[GA4] Location API request failed with status: ${result.StatusCode}`);
        return;
      }
      for (const line of result.Body.split('\n')) {
        if (line.startsWith('loc=')) {
          this.countryCode = line.substring(4);
          print(`[GA4] Successfully fetched server location: ${this.countryCode}`);
        }
      }
    });
  }
}
