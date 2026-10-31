import { useCallback, useState } from 'react';

// 失败/超时兜底，避免请求无声丢失时按钮永久卡灰；需要和 daily-task.ts 的 REFRESH_TIMEOUT_SECONDS 保持一致
const REFRESH_PENDING_TIMEOUT_S = 10;

/**
 * 每日任务刷新按钮的交互状态：候选页和选英雄悬浮框共用，避免两处各自维护一份 pending 逻辑。
 * 点击后本地立即置灰等待响应；成功由 refreshRemaining 归零驱动继续保持灰态，
 * 失败或超时则没有等到 net table 变化，靠 schedule 兜底自动恢复可点。
 */
export function useDailyTaskRefreshButton(refreshRemaining: number | undefined) {
  const [pending, setPending] = useState(false);
  const used = (refreshRemaining ?? 0) <= 0;

  const handleClick = useCallback(() => {
    if (pending || used) return;
    setPending(true);
    $.Schedule(REFRESH_PENDING_TIMEOUT_S, () => setPending(false));
    GameEvents.SendCustomGameEventToServer('dailytask_refresh_candidates', {});
  }, [pending, used]);

  return { enabled: !pending && !used, used, handleClick };
}
