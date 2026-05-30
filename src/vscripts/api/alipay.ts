import { AlipayOrderState, AlipayOrderStatus } from '../../common/net_tables';
import { ApiClient, HttpMethod } from './api-client';

interface AlipayOrderCreateResponseDto {
  outTradeNo: string;
  qrCode: string;
  totalAmount: string;
  subject: string;
  expiresAt: string;
}

interface AlipayOrderQueryResponseDto {
  status: AlipayOrderStatus;
}

/** 一局游戏内同一玩家最多创建订单次数（含 retry / 刷新）；支付成功后计数器重置 */
const MAX_ORDERS_PER_GAME = 10;

export class AlipayApi {
  /** 整局累计 onCreate 次数，按 steamId。 */
  private orderCountMap = new Map<number, number>();
  /** 正在等响应的 query 玩家集合；防止前端轮询在响应慢时叠加并发请求 */
  private inFlightQuerySet = new Set<number>();

  constructor() {
    CustomGameEventManager.RegisterListener<AlipayOrderCreateEventData>(
      'alipay_order_create',
      (_, event) => this.onCreate(event),
    );
    CustomGameEventManager.RegisterListener<AlipayOrderQueryEventData>(
      'alipay_order_query',
      (_, event) => this.onQuery(event),
    );
    CustomGameEventManager.RegisterListener<Record<string, never>>(
      'alipay_order_clear',
      (_, event) => this.onClear(event),
    );
  }

  private onCreate(event: NetworkedData<AlipayOrderCreateEventData & { PlayerID: PlayerID }>) {
    const steamId = PlayerResource.GetSteamAccountID(event.PlayerID);
    const clientEpoch = event.clientEpoch;

    // 一局游戏内每位玩家最多 MAX_ORDERS_PER_GAME 次 onCreate（防 spam）
    const currentCount = this.orderCountMap.get(steamId) ?? 0;
    if (currentCount >= MAX_ORDERS_PER_GAME) {
      AlipayApi.ResetNetTable(steamId, {
        status: 'RATE_LIMITED',
        clientEpoch,
        updatedAt: GameRules.GetGameTime(),
      });
      return;
    }
    this.orderCountMap.set(steamId, currentCount + 1);

    // 重置整张 net table，避免旧订单字段（qrCode / SUCCESS 等）残留影响新一轮
    AlipayApi.ResetNetTable(steamId, {
      status: 'CREATING',
      productCode: event.productCode,
      clientEpoch,
      updatedAt: GameRules.GetGameTime(),
    });
    ApiClient.sendWithRetry({
      method: HttpMethod.POST,
      path: '/alipay/order/create',
      body: { steamId, productCode: event.productCode, quantity: event.quantity },
      successFunc: (data) => {
        const dto = json.decode(data)[0] as AlipayOrderCreateResponseDto;
        AlipayApi.WriteNetTableIfEpoch(steamId, clientEpoch, {
          status: 'WAITING',
          productCode: event.productCode,
          outTradeNo: dto.outTradeNo,
          qrCode: dto.qrCode,
          totalAmount: dto.totalAmount,
          subject: dto.subject,
          expiresAt: dto.expiresAt,
          updatedAt: GameRules.GetGameTime(),
        });
      },
      failureFunc: (data) => {
        AlipayApi.WriteNetTableIfEpoch(steamId, clientEpoch, {
          status: 'ERROR',
          errorMessage: data,
          updatedAt: GameRules.GetGameTime(),
        });
      },
    });
  }

  private onQuery(event: NetworkedData<AlipayOrderQueryEventData & { PlayerID: PlayerID }>) {
    const steamId = PlayerResource.GetSteamAccountID(event.PlayerID);
    // 防并发：上一次 query 还没回来时直接忽略本次（前端 2s 轮询，API 慢时会叠加）
    if (this.inFlightQuerySet.has(steamId)) return;
    this.inFlightQuerySet.add(steamId);

    const currentEpoch = AlipayApi.GetCurrentEpoch(steamId);
    ApiClient.sendWithRetry({
      method: HttpMethod.GET,
      path: '/alipay/order/query',
      querys: { outTradeNo: event.outTradeNo },
      // query 自身不重试 + 短超时；失败由前端下一次轮询接力
      retryTimes: 1,
      timeoutSeconds: 5,
      successFunc: (data) => {
        this.inFlightQuerySet.delete(steamId);
        const dto = json.decode(data)[0] as AlipayOrderQueryResponseDto;
        // 支付成功后重置该玩家的限流计数器，让用户继续可订阅其他商品
        if (dto.status === 'SUCCESS') {
          this.orderCountMap.delete(steamId);
        }
        AlipayApi.WriteNetTableIfEpoch(steamId, currentEpoch, {
          status: dto.status,
          updatedAt: GameRules.GetGameTime(),
        });
      },
      failureFunc: () => {
        this.inFlightQuerySet.delete(steamId);
        // query 失败不写 ERROR：保留当前 WAITING 状态，等下次轮询接力
      },
    });
  }

  /**
   * 清空指定玩家的订单 net table —— 用于用户在任意状态下点击关闭按钮。
   * 写入 status=IDLE 标记"无活动订单"，前端据此切回订阅按钮 UI。
   * （Panorama 没有"删除 key"的 API，直接传 undefined 不触发监听，所以用 IDLE 占位。）
   */
  private onClear(event: { PlayerID: PlayerID }) {
    const steamId = PlayerResource.GetSteamAccountID(event.PlayerID);
    AlipayApi.ResetNetTable(steamId, {
      status: 'IDLE',
      clientEpoch: 0,
      updatedAt: GameRules.GetGameTime(),
    });
  }

  private static GetCurrentEpoch(steamId: number): number {
    const key = steamId.toString();
    const current = (CustomNetTables.GetTableValue('alipay_order', key) ??
      {}) as Partial<AlipayOrderState>;
    return current.clientEpoch ?? 0;
  }

  /**
   * 整张表重置：用 partial 完全替换，避免 qrCode / outTradeNo 等旧字段残留。
   */
  private static ResetNetTable(steamId: number, value: AlipayOrderState) {
    const key = steamId.toString();
    CustomNetTables.SetTableValue('alipay_order', key, value);
  }

  /**
   * 仅当当前 net table 中的 clientEpoch 仍为指定值时才合并写入；
   * 用于丢弃在请求过程中被新一轮 create 抢占后的旧响应。
   */
  private static WriteNetTableIfEpoch(
    steamId: number,
    expectedEpoch: number,
    partial: Partial<AlipayOrderState>,
  ) {
    const key = steamId.toString();
    const current = (CustomNetTables.GetTableValue('alipay_order', key) ??
      {}) as Partial<AlipayOrderState>;
    if (current.clientEpoch !== expectedEpoch) {
      return; // 已被新一轮订单抢占，丢弃此响应
    }
    const next = { ...current, ...partial } as AlipayOrderState;
    CustomNetTables.SetTableValue('alipay_order', key, next);
  }
}
