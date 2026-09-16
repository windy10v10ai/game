import { useNetTable } from './useNetTable';

// 与 game.ts 中 loading_status 的失败取值一致
const LOADING_STATUS_FAILED = 3;

/** 玩家数据是否因服务端不可达而缺失，用于界面降级展示。 */
export function useDataOffline(): boolean {
  const loading = useNetTable('loading_status', 'loading_status');
  return loading?.status === LOADING_STATUS_FAILED;
}
