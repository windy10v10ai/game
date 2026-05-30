import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNetTable } from '../../../../../../shared/hooks/useNetTable';
import { AlipayProductCode } from '../constants';
import { ALIPAY_POLL_INTERVAL_S, ALIPAY_SEND_COOLDOWN_S } from './constants';

// 模块级 epoch 计数器：跨组件 mount 单调递增，避免 Date.now() 的 13 位大整数被
// panorama event 序列化截断的问题。
let epochCounter = 0;

/**
 * 封装支付宝订单的 net table 订阅 + 轮询。
 *
 * 与之前版本不同，本 hook 不主动下单 —— 仅根据 net table 当前状态决定是否需要轮询。
 * 下单 / 重试 / 清空均由调用方按需触发：
 *   - start()：用户点击订阅按钮。若 net table 已有订单则不下单（只让 UI 切到 paying）；
 *              否则发起新订单。
 *   - retry()：用户点击「重试」或「刷新二维码」。强制发新单（自增 epoch + 重置 net table）。
 *   - clear()：用户点击「关闭」（成功状态后）。清空 net table。
 *
 * WAITING 状态下自动轮询 query；非 WAITING 自动停止。
 */
export function useAlipayOrder() {
  const steamId = GetLocalPlayerSteamAccountID();
  const order = useNetTable('alipay_order', steamId || null);

  // schedule 通过 token ref 实现"取消"
  const pollTokenRef = useRef(0);
  // 创建/重试按钮的共享冷却状态：所有商品 / 所有触发 sendCreate 的入口共用此一份
  const [cooling, setCooling] = useState(false);
  // 记录最近一次下单的 quantity，供 retry 复用
  const lastQuantityRef = useRef(0);
  // 记录最近一次下单的 productCode，供 retry 复用
  const lastProductCodeRef = useRef<AlipayProductCode | null>(null);

  const sendCreate = useCallback(
    (productCode: AlipayProductCode, quantity: number) => {
      if (cooling) return; // 冷却期内忽略，按钮已 disable，理论上不会触发
      setCooling(true);
      $.Schedule(ALIPAY_SEND_COOLDOWN_S, () => setCooling(false));
      lastQuantityRef.current = quantity;
      lastProductCodeRef.current = productCode;
      // 模块级递增 epoch：跨组件 mount 单调递增；后端用它丢弃旧响应
      epochCounter += 1;
      const clientEpoch = epochCounter;
      GameEvents.SendCustomGameEventToServer('alipay_order_create', {
        productCode,
        quantity,
        clientEpoch,
      });
    },
    [cooling],
  );

  const sendQuery = useCallback((outTradeNo: string) => {
    GameEvents.SendCustomGameEventToServer('alipay_order_query', { outTradeNo });
  }, []);

  /**
   * 用户点订阅按钮。仅当已有「同一 productCode」的活动订单时不重发（UI 直接展示当前状态）；
   * 若活动订单属于其他商品（在另一 subtab/档位下的残留单），直接发新单覆盖 ——
   * sendCreate 会重置整张 net table，否则切卡点击会因旧订单存在而静默无响应。
   */
  const start = useCallback(
    (productCode: AlipayProductCode, quantity: number) => {
      const hasActiveOrder = order && order.status && order.status !== 'IDLE';
      if (!hasActiveOrder || order.productCode !== productCode) {
        sendCreate(productCode, quantity);
      }
    },
    [order, sendCreate],
  );

  /** 用户点重试 / 刷新：强制发新单（沿用上次 productCode + quantity） */
  const retry = useCallback(() => {
    if (lastProductCodeRef.current) {
      sendCreate(lastProductCodeRef.current, lastQuantityRef.current);
    }
  }, [sendCreate]);

  /** 用户点关闭：清空 net table（任何状态都直接清空，不复用旧订单） */
  const clear = useCallback(() => {
    GameEvents.SendCustomGameEventToServer('alipay_order_clear', {});
  }, []);

  // WAITING 状态启动 2s 轮询；其他状态停止
  useEffect(() => {
    if (order?.status !== 'WAITING' || !order?.outTradeNo) {
      pollTokenRef.current += 1; // 让在途 schedule 失效
      return undefined;
    }
    pollTokenRef.current += 1;
    const myToken = pollTokenRef.current;
    const outTradeNo = order.outTradeNo;
    const tick = () => {
      if (pollTokenRef.current !== myToken) return;
      sendQuery(outTradeNo);
      $.Schedule(ALIPAY_POLL_INTERVAL_S, tick);
    };
    $.Schedule(ALIPAY_POLL_INTERVAL_S, tick);
    return () => {
      pollTokenRef.current += 1;
    };
  }, [order?.status, order?.outTradeNo, sendQuery]);

  return { order, start, retry, clear, cooling };
}
