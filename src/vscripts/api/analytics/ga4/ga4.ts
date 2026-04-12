import { GameConfig } from '../../../modules/GameConfig';
import { reloadable } from '../../../utils/tstl-utils';
import { GameEndDto } from '../dto/game-end-dto';
import {
  GA4ConfigDto,
  GA4Event,
  GA4EventPayload,
  GA4UserProperty,
  SERVER_TYPE,
} from './dto/ga4-dto';
import { GA4ItemTracker, ItemSampleEntry } from './ga4-item-tracker';

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

  // 游戏时间记录
  private static gameStartRealTime: number | null = null; // Unix 时间戳（秒，保留小数部分）
  private static gameStartDotatime: number | null = null; // Dota 时间戳（秒）
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
   * 从互联网获取当前时间（Unix 时间戳，秒）
   */
  public static FetchCurrentTime(callback: (timestamp: number | null) => void) {
    // 使用 CloudFlare 的 trace API 获取时间戳
    // 格式: ts=1234567890.123
    const apiUrl = 'https://cloudflare.com/cdn-cgi/trace';

    print(`[GA4] Fetching current time from: ${apiUrl}`);
    const request = CreateHTTPRequestScriptVM('GET', apiUrl);
    request.SetHTTPRequestNetworkActivityTimeout(5);

    request.Send((result: CScriptHTTPResponse) => {
      if (result.StatusCode >= 200 && result.StatusCode < 300) {
        try {
          // 解析响应文本，提取 ts= 行
          const body = result.Body;
          const lines = body.split('\n');
          for (const line of lines) {
            if (line.startsWith('ts=')) {
              const timestamp = parseFloat(line.substring(3));
              if (!isNaN(timestamp)) {
                print(`[GA4] Successfully fetched time: ${timestamp}`);
                callback(timestamp);
              }
            }
            if (line.startsWith('loc=')) {
              this.countryCode = line.substring(4);
              print(`[GA4] Successfully fetched server location: ${this.countryCode}`);
            }
          }
        } catch {
          print(`[GA4] Failed to parse time API response: ${result.Body}`);
        }
      } else {
        print(`[GA4] Time API request failed with status: ${result.StatusCode}`);
      }
    });
  }

  /**
   * 记录游戏开始时间
   * 应在 GAME_IN_PROGRESS 状态时调用
   */
  public static RecordGameStartTime() {
    // 异步获取真实世界时间
    this.FetchCurrentTime((timestamp) => {
      if (timestamp !== null) {
        this.gameStartRealTime = timestamp;
        this.gameStartDotatime = Time();
      }
    });
  }

  /**
   * 发送游戏匹配时间事件（内部方法）
   * @param realDurationRatio 现实时间/游戏时间比例
   * @param dotaDuration Dota 游戏时长（秒）
   * @param realDuration 现实时长（秒）
   */
  private static SendMatchTimingEvent(
    realDurationRatio: number,
    dotaDuration: number,
    realDuration: number,
  ) {
    const eventName = 'game_end_match_time';
    const eventParams: { [key: string]: string | number | boolean } = {
      dota_duration: dotaDuration,
      real_duration: realDuration,
      real_duration_ratio: realDurationRatio,
    };

    const event = this.BuildEvent(eventName, 0, eventParams);
    this.SendEvent(0, event);
  }

  private static SendItemDurationEvents(
    gameEndDto: GameEndDto,
    trackedItems: Map<PlayerID, ItemSampleEntry[]>,
  ) {
    const eventName = 'game_end_item_duration';

    gameEndDto.players.forEach((player) => {
      const playerItems = trackedItems.get(player.playerId);
      if (!playerItems || playerItems.length === 0) return;

      const isBot = player.steamId <= 0;
      const steamId = isBot ? 0 : player.steamId;

      const itemEvents: GA4Event[] = [];
      playerItems.forEach((entry) => {
        const eventParams: { [key: string]: string | number | boolean } = {
          hero_name: player.heroName,
          item_name: entry.itemName,
          type: entry.type,
          is_carried_at_end: entry.isCarriedAtEnd,
          is_bot: isBot,
          difficulty: gameEndDto.difficulty,
          team_id: player.teamId,
        };

        itemEvents.push(this.BuildEvent(eventName, steamId, eventParams));
      });

      if (itemEvents.length > 0) {
        this.SendEvents(steamId, itemEvents);
      }
    });
  }

  /**
   * 发送游戏结束相关的所有事件
   * 包括匹配时间事件和物品持有时长事件
   * @param gameEndDto 游戏结束数据
   */
  public static SendGameEndEvents(gameEndDto: GameEndDto) {
    // 先收集物品数据，确保游戏单位仍存在
    const trackedItems = GA4ItemTracker.CollectAtGameEnd();

    // 物品持有时长事件不依赖真实时间，直接发送
    this.SendItemDurationEvents(gameEndDto, trackedItems);

    // 匹配时间事件需要异步获取真实时间
    this.FetchCurrentTime((endRealTime) => {
      if (this.gameStartRealTime === null || this.gameStartDotatime === null) {
        print('[GA4] Game start real time not recorded, skipping event send');
        return;
      }
      if (endRealTime === null) {
        print('[GA4] Failed to fetch end real time, skipping event send');
        return;
      }

      const dotaDuration = Time() - this.gameStartDotatime;
      const realDuration = endRealTime - this.gameStartRealTime;
      const realDurationRatio = realDuration / dotaDuration;

      this.SendMatchTimingEvent(realDurationRatio, dotaDuration, realDuration);
    });
  }
}
