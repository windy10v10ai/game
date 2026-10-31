import { useEffect, useRef, useState } from 'react';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import { useDataOffline } from './useDataOffline';
import { useNetTable } from './useNetTable';

// 请求失败时 net table 不会更新，超时后也要解除刷新中状态
const REFRESH_TIMEOUT_S = 5;

/** 让服务端重新拉取玩家信息，用于同步网站或外部平台上的改动 */
export function usePlayerInfoRefresh() {
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const player = useNetTable('player_table', GetLocalPlayerSteamAccountID());
  // 刷新同样要经服务端拉取，读不到服务端时按钮没有意义
  const canRefresh = !useDataOffline();

  const finish = () => {
    if (refreshingRef.current) {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  };

  useEffect(() => {
    finish();
  }, [player]);

  const refresh = () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    GameEvents.SendCustomGameEventToServer('player_info_refresh', {});
    $.Schedule(REFRESH_TIMEOUT_S, finish);
  };

  return { refreshing, refresh, canRefresh };
}
