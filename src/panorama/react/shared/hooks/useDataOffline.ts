import { useNetTable } from './useNetTable';

// 与 game.ts 中 loading_status 的离线取值一致
const LOADING_STATUS_OFFLINE = 3;

/** 是否处于离线模式：服务端不可达，玩家数据来自只读的离线快照，用于界面降级展示。 */
export function useDataOffline(): boolean {
  const loading = useNetTable('loading_status', 'loading_status');
  return loading?.status === LOADING_STATUS_OFFLINE;
}
