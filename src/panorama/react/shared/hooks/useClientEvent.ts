import { useEffect } from 'react';

/**
 * 订阅客户端 Game Event 的封装。
 *
 * 用于跨 entry（不同 layout.xml 渲染上下文）通信，发送方使用：
 *   GameEvents.SendEventClientSide('hud_open_page', { page: 'home' });
 *
 * 接收方在某个组件内：
 *   useClientEvent('hud_open_page', (data) => openPage(data.page));
 */
export function useClientEvent<TEvent extends keyof CustomGameEventDeclarations>(
  eventName: TEvent,
  handler: (data: NetworkedData<CustomGameEventDeclarations[TEvent]>) => void,
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
