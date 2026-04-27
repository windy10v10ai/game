import { useEffect } from 'react';

/**
 * 订阅客户端 Game Event 的封装。
 *
 * 用于跨 entry（不同 layout.xml 渲染上下文）通信，发送方使用：
 *   GameEvents.SendEventClientSide('hud_open_page', { page: 'profile' });
 *
 * 接收方在某个组件内：
 *   useClientEvent('hud_open_page', (data) => openPage(data.page));
 *
 * 类型签名直接对齐 panorama-types 中 GameEvents.Subscribe 的回调类型
 * （NetworkedData<InferGameEventType<TEvent, object>>），避免与 SDK 类型推断冲突。
 */
export function useClientEvent<TEvent extends keyof CustomGameEventDeclarations>(
  eventName: TEvent,
  handler: (data: NetworkedData<GameEvents.InferGameEventType<TEvent, object>>) => void,
) {
  useEffect(() => {
    const id = GameEvents.Subscribe(eventName, handler);
    return () => {
      GameEvents.Unsubscribe(id);
    };
    // handler 故意不入依赖：业务方一般每次渲染会传新引用，
    // 反复订阅/退订会浪费帧。如需动态 handler 请用 ref。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName]);
}
