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
 * 格式化排名显示
 * @param rank 排名数字，可以是数字或 'N/A'
 * @returns 格式化后的排名字符串
 */
function formatRank(rank: string | number): string {
  if (rank === 'N/A') {
    return '无排名';
  }

  const rankNum = typeof rank === 'number' ? rank : parseInt(rank);

  if (isNaN(rankNum)) {
    return '无排名';
  }

  if (rankNum >= 2000) {
    return '2000+';
  } else if (rankNum >= 1000) {
    return '1000+';
  } else if (rankNum >= 500) {
    return '500+';
  } else {
    return rankNum.toString();
  }
}

/**
 * 可复用的排行榜视图组件
 */
export function LeaderboardView({ title, columns }: LeaderboardViewProps) {
  const [currentPlayerRank, setCurrentPlayerRank] = useState<string | number>('N/A');
  const [topPlayers, setTopPlayers] = useState<PlayerRankInfo[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
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

      // 转换为数组格式，显示前 100 名
      const players: PlayerRankInfo[] = [];
      let currentRank: string | number = 'N/A';

      for (const index in topSteamIds) {
        const rank = parseInt(index) + 1; // 排名从 1 开始
        const steamId = topSteamIds[index];

        if (rank <= 100) {
          players.push({ rank, steamId });
        }

        // 查找当前玩家排名
        if (steamId === localSteamId) {
          currentRank = rank;
        }
      }

      setTopPlayers(players);
      setCurrentPlayerRank(formatRank(currentRank));
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
          <Label className="current-rank-value" text={currentPlayerRank} />
        </Panel>
      </Panel>

      {/* 表头 */}
      <Panel style={LeaderboardTableHeaderStyle}>
        {columns.map((column, index) => (
          <Label key={index} className={column.className} text={column.text} />
        ))}
      </Panel>

      {/* 排行榜列表 */}
      <Panel style={LeaderboardListStyle} ref={listRef}>
        {/* 排行榜列表内容将通过 ref 动态添加 */}
        {topPlayers.map((player, index) => {
          const isCurrentPlayer = player.steamId === localSteamId;
          const isHovered = hoveredIndex === index;

          return (
            <Panel
              // key={`${player.steamId}-${index}`}
              id={`player-item-${index}`}
              style={getLeaderboardItemStyle(isCurrentPlayer, isHovered)}
              onmouseover={() => setHoveredIndex(index)}
              onmouseout={() => setHoveredIndex(null)}
            >
              <Label style={getPlayerRankStyle(isCurrentPlayer)} text={`${index + 1}`} />
              <DOTAAvatarImage style={AvatarIMGStyle} id={`player-avatar-${index}`} />
              <DOTAUserName
                style={getPlayerNameStyle(isCurrentPlayer)}
                id={`player-name-${index}`}
              />
            </Panel>
          );
        })}
      </Panel>
    </Panel>
  );
}

/* 表头 */
const LeaderboardTableHeaderStyle: Partial<VCSSStyleDeclaration> = {
  width: '100%',
  height: '30px',
  flowChildren: 'right',
  padding: '5px 15px',
  backgroundColor: '#2a2a3e',
  border: '1px solid #4e56c0',
  borderRadius: '3px',
  marginBottom: '5px',
};

/* 排行榜列表样式 */
const LeaderboardListStyle: Partial<VCSSStyleDeclaration> = {
  width: '100%',
  height: '260px',
  flowChildren: 'down',
  overflow: 'squish scroll', // 水平方向压缩，垂直方向滚动
};

/**
 * 获取排行榜项样式
 * @param isCurrentPlayer 是否是当前玩家
 * @param isHovered 是否被悬停
 */
function getLeaderboardItemStyle(
  isCurrentPlayer: boolean,
  isHovered: boolean,
): Partial<VCSSStyleDeclaration> {
  const baseStyle: Partial<VCSSStyleDeclaration> = {
    width: '100%',
    height: '55px',
    flowChildren: 'right',
    padding: '5px 15px',
    marginBottom: '3px',
    transitionProperty: 'background-color, border-left-color',
    transitionDuration: '0.15s',
  };

  if (isCurrentPlayer) {
    // 当前玩家样式
    return {
      ...baseStyle,
      backgroundColor: '#4e56c044',
      borderLeft: '5px solid #fdcffa',
    };
  } else if (isHovered) {
    // 悬停样式
    return {
      ...baseStyle,
      backgroundColor: '#00000066',
      borderLeft: '3px solid #9b5de0',
    };
  } else {
    // 默认样式
    return {
      ...baseStyle,
      backgroundColor: '#00000044',
      borderLeft: '3px solid #4e56c0',
    };
  }
}

/**
 * 获取玩家排名样式
 * @param isCurrentPlayer 是否是当前玩家
 */
function getPlayerRankStyle(isCurrentPlayer: boolean): Partial<VCSSStyleDeclaration> {
  const baseStyle: Partial<VCSSStyleDeclaration> = {
    width: '15%',
    fontSize: '26px',
    fontWeight: 'bold',
    color: '#d78fee',
    verticalAlign: 'center',
  };

  if (isCurrentPlayer) {
    return {
      ...baseStyle,
      color: '#fdcffa',
    };
  }

  return baseStyle;
}

/**
 * 获取玩家名称样式
 * @param isCurrentPlayer 是否是当前玩家
 */
function getPlayerNameStyle(isCurrentPlayer: boolean): Partial<VCSSStyleDeclaration> {
  const baseStyle: Partial<VCSSStyleDeclaration> = {
    width: '70%',
    fontSize: '14px',
    color: '#9b5de0',
    verticalAlign: 'center',
  };

  if (isCurrentPlayer) {
    return {
      ...baseStyle,
      color: '#fdcffa',
      fontWeight: 'bold',
    };
  }

  return baseStyle;
}
