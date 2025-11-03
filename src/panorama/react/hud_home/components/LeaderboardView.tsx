import { RefObject, useRef, useEffect, useState } from 'react';
// import { GetPlayer } from '../../../utils/net-table';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';

interface LeaderboardColumn {
  className: string;
  text: string;
}

interface LeaderboardViewProps {
  title: string;
  currentRank?: string | number;
  columns: LeaderboardColumn[];
  listRef: RefObject<Panel>;
}

// interface RankingData {
//   topSteamIds: string[] | null;
//   rankScores: {
//     top1000: number;
//     top2000: number;
//     top3000: number;
//     top4000: number;
//     top5000: number;
//   } | null;
// }

// /**
//  * 将 NetTable 返回的数据转换为数组
//  * NetTable 中的数组可能被序列化为对象
//  * 根据 net_tables.d.ts，topSteamIds 的类型是 string[]，但实际运行时可能是对象
//  */
// function convertToArray(
//   data:
//     | CustomNetTableDeclarations['ranking_table']['topSteamIds']
//     | { [key: number]: string }
//     | null
//     | undefined,
// ): string[] | null {
//   if (!data) {
//     return null;
//   }

//   // 如果已经是数组，直接返回
//   if (Array.isArray(data)) {
//     return data;
//   }

//   // 如果是对象，转换为数组
//   if (typeof data === 'object') {
//     // 使用 Object.values 获取值，并按索引排序
//     const values = Object.values(data) as string[];
//     // 如果对象有数字键，需要按索引排序
//     const keys = Object.keys(data)
//       .map(Number)
//       .filter((k) => !isNaN(k))
//       .sort((a, b) => a - b);

//     if (keys.length > 0) {
//       // 按索引顺序返回
//       return keys.map((k) => (data as Record<string, string>)[k.toString()]);
//     }

//     return values;
//   }

//   return null;
// }

/**
 * 计算当前玩家的排名
 */
// function calculateCurrentPlayerRank(
//   topSteamIds: string[] | null,
//   rankScores: RankingData['rankScores'],
//   localSteamId: string,
// ): string | number {
//   if (!topSteamIds || !Array.isArray(topSteamIds)) {
//     return 'N/A';
//   }

//   // 在前500名中查找玩家排名
//   const rankIndex = topSteamIds.indexOf(localSteamId);
//   if (rankIndex !== -1 && rankIndex <= 500) {
//     return rankIndex + 1; // 索引转换为排名（从1开始）
//   }

//   // 获取玩家分数
//   const playerData = GetPlayer(localSteamId);
//   const playerScore = playerData?.seasonPointTotal || 0;

//   // 根据分数段判断排名
//   if (!rankScores) {
//     return '500+';
//   }

//   if (playerScore < rankScores.top5000) {
//     return '5000+';
//   }
//   if (playerScore < rankScores.top4000) {
//     return '4000+';
//   }
//   if (playerScore < rankScores.top3000) {
//     return '3000+';
//   }
//   if (playerScore < rankScores.top2000) {
//     return '2000+';
//   }
//   if (playerScore < rankScores.top1000) {
//     return '1000+';
//   }

//   return '500+';
// }

const AvatarIMGStyle: Partial<VCSSStyleDeclaration> = {
  width: '52px',
  height: '52px',
  verticalAlign: 'center',
};
interface PlayerRankInfo {
  rank: number;
  steamId: string;
}

/**
 * 可复用的排行榜视图组件
 */
export function LeaderboardView({ title, columns }: LeaderboardViewProps) {
  const [currentPlayerRank, setCurrentPlayerRank] = useState<string | number>('N/A');
  const [topPlayers, setTopPlayers] = useState<PlayerRankInfo[]>([]);
  const localSteamId = GetLocalPlayerSteamAccountID().toString();
  const listRef = useRef<Panel>(null);

  useEffect(() => {
    // 加载排行榜数据
    const loadRankingData = () => {
      const topSteamIds = CustomNetTables.GetTableValue('ranking_table', 'topSteamIds') as
        | Record<string, string>
        | undefined;

      if (!topSteamIds) {
        // 数据未加载，稍后重试
        setTimeout(loadRankingData, 500);
        return;
      }

      // 转换为数组格式，显示前 20 名
      const players: PlayerRankInfo[] = [];
      let currentRank: string | number = 'N/A';

      for (const index in topSteamIds) {
        const rank = parseInt(index) + 1; // 排名从 1 开始
        const steamId = topSteamIds[index];

        if (rank <= 20) {
          players.push({ rank, steamId });
        }

        // 查找当前玩家排名
        if (steamId === localSteamId) {
          currentRank = rank;
        }
      }

      setTopPlayers(players);
      setCurrentPlayerRank(currentRank === 'N/A' ? '500+' : currentRank);
    };

    loadRankingData();

    // 订阅数据变化
    const listenerId = CustomNetTables.SubscribeNetTableListener(
      'ranking_table',
      (_tableName, key, _value) => {
        if (key === 'topSteamIds') {
          loadRankingData();
        }
      },
    );

    return () => {
      CustomNetTables.UnsubscribeNetTableListener(listenerId);
    };
  }, [localSteamId]);

  // 在 DOM 更新后设置玩家头像和名称
  useEffect(() => {
    if (!listRef.current || topPlayers.length === 0) return;

    // 延迟一帧确保 DOM 已渲染
    $.Schedule(0.01, () => {
      topPlayers.forEach((player, index) => {
        const playerItem = listRef.current?.FindChildTraverse(`player-item-${index}`);
        if (playerItem) {
          const avatarPanel = playerItem.FindChildTraverse(`player-avatar-${index}`);
          const namePanel = playerItem.FindChildTraverse(`player-name-${index}`);

          if (avatarPanel) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (avatarPanel as any).accountid = player.steamId;
            $.Msg(`Set avatar accountid: ${player.steamId} for rank ${player.rank}`);
          }

          if (namePanel) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (namePanel as any).accountid = player.steamId;
          }
        }
      });
    });
  }, [topPlayers]);
  return (
    <Panel className="leaderboard-content">
      {/* 标题和当前玩家排名 */}
      <Panel className="leaderboard-header">
        <Label className="leaderboard-title" text={title} />
        <Panel className="current-rank-display">
          <Label text="你的排名：" />
          <DOTAAvatarImage style={{ width: '20px', height: '20px' }} steamid="local" />
          <Label className="current-rank-value" text={currentPlayerRank.toString()} />
        </Panel>
      </Panel>

      {/* 表头 */}
      <Panel className="leaderboard-table-header">
        {columns.map((column, index) => (
          <Label key={index} className={column.className} text={column.text} />
        ))}
      </Panel>

      {/* 排行榜列表 */}
      <Panel className="leaderboard-list" ref={listRef}>
        {/* 排行榜列表内容将通过 ref 动态添加 */}
        {topPlayers.map((player, index) => (
          <Panel
            key={`${player.steamId}-${index}`}
            id={`player-item-${index}`}
            className={`leaderboard-item ${player.steamId === localSteamId ? 'is-current-player' : ''}`}
          >
            <Label className="player-rank" text={`#${player.rank}`} />
            <DOTAAvatarImage style={AvatarIMGStyle} id={`player-avatar-${index}`} />
            <DOTAUserName className="player-name" id={`player-name-${index}`} />
          </Panel>
        ))}
      </Panel>
    </Panel>
  );
}
