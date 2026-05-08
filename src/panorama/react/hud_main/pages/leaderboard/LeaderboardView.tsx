import { RefObject, useEffect, useRef, useState } from 'react';
import { GetPlayer } from '@utils/net-table';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';

interface RankingScore {
  top1000: number;
  top2000: number;
  top3000: number;
  top4000: number;
  top5000: number;
}

interface LeaderboardColumn {
  className: string;
  text: string;
}

interface LeaderboardViewProps {
  title: string;
  currentRank?: string | number;
  columns: LeaderboardColumn[];
  // 兼容旧调用签名；当前实现使用内部 ref。
  listRef?: RefObject<Panel>;
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
 * 格式化排名显示。
 */
function formatRank(rank: string | number, rankScores: RankingScore): string {
  if (rank === 'N/A') {
    return '无排名';
  }
  const rankNum = typeof rank === 'number' ? rank : parseInt(rank);
  if (isNaN(rankNum)) {
    return '无排名';
  }
  if (rankNum >= rankScores.top5000) return '5000+';
  if (rankNum >= rankScores.top4000) return '4000+';
  if (rankNum >= rankScores.top3000) return '3000+';
  if (rankNum >= rankScores.top2000) return '2000+';
  if (rankNum >= rankScores.top1000) return '1000+';
  return rankNum.toString();
}

/**
 * 可复用的排行榜视图组件。
 */
export function LeaderboardView({ title, columns }: LeaderboardViewProps) {
  const [currentPlayerRank, setCurrentPlayerRank] = useState<string | number>('N/A');
  const [topPlayers, setTopPlayers] = useState<PlayerRankInfo[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const localSteamId = GetLocalPlayerSteamAccountID();
  const listRef = useRef<Panel>(null);

  useEffect(() => {
    const loadRankingData = () => {
      const topSteamIds = CustomNetTables.GetTableValue('ranking_table', 'topSteamIds') as
        | Record<string, string>
        | undefined;

      const rankScores = CustomNetTables.GetTableValue('ranking_table', 'rankScores') as
        | RankingScore
        | undefined;

      const player = GetPlayer(localSteamId);

      if (!topSteamIds) {
        // 数据未加载，稍后重试
        setTimeout(loadRankingData, 500);
        return;
      }

      const players: PlayerRankInfo[] = [];
      let currentRank: string | number = player?.seasonPointTotal || 'N/A';

      for (const index in topSteamIds) {
        const rank = parseInt(index) + 1;
        const steamId = topSteamIds[index];

        if (rank <= 100) {
          players.push({ rank, steamId });
        }
        if (steamId === localSteamId) {
          currentRank = rank;
        }
      }

      setTopPlayers(players);
      setCurrentPlayerRank(formatRank(currentRank, rankScores as RankingScore));
    };

    loadRankingData();

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

  // DOM 渲染后给头像/名字组件设置 accountid（必须延迟一帧）
  useEffect(() => {
    if (!listRef.current || topPlayers.length === 0) return;

    $.Schedule(0.01, () => {
      topPlayers.forEach((player, index) => {
        const playerItem = listRef.current?.FindChildTraverse(`player-item-${index}`);
        if (playerItem) {
          const avatarPanel = playerItem.FindChildTraverse(`player-avatar-${index}`);
          const namePanel = playerItem.FindChildTraverse(`player-name-${index}`);

          if (avatarPanel) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (avatarPanel as any).accountid = player.steamId;
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
      <Panel className="leaderboard-header">
        <Label className="leaderboard-title" text={title} />
        <Panel className="current-rank-display">
          <Label text="你的排名：" />
          <DOTAAvatarImage style={{ width: '20px', height: '20px' }} steamid="local" />
          <Label className="current-rank-value" text={currentPlayerRank} />
        </Panel>
      </Panel>

      <Panel style={LeaderboardTableHeaderStyle}>
        {columns.map((column, index) => (
          <Label key={index} className={column.className} text={column.text} />
        ))}
      </Panel>

      <Panel style={LeaderboardListStyle} ref={listRef}>
        {topPlayers.map((player, index) => {
          const isCurrentPlayer = player.steamId === localSteamId;
          const isHovered = hoveredIndex === index;
          return (
            <Panel
              key={`${player.steamId}-${index}`}
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

const LeaderboardListStyle: Partial<VCSSStyleDeclaration> = {
  width: '100%',
  height: '260px',
  flowChildren: 'down',
  overflow: 'squish scroll',
};

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
    return { ...baseStyle, backgroundColor: '#4e56c044', borderLeft: '5px solid #fdcffa' };
  } else if (isHovered) {
    return { ...baseStyle, backgroundColor: '#00000066', borderLeft: '3px solid #9b5de0' };
  } else {
    return { ...baseStyle, backgroundColor: '#00000044', borderLeft: '3px solid #4e56c0' };
  }
}

function getPlayerRankStyle(isCurrentPlayer: boolean): Partial<VCSSStyleDeclaration> {
  const baseStyle: Partial<VCSSStyleDeclaration> = {
    width: '15%',
    fontSize: '26px',
    fontWeight: 'bold',
    color: '#d78fee',
    verticalAlign: 'center',
  };
  if (isCurrentPlayer) {
    return { ...baseStyle, color: '#fdcffa' };
  }
  return baseStyle;
}

function getPlayerNameStyle(isCurrentPlayer: boolean): Partial<VCSSStyleDeclaration> {
  const baseStyle: Partial<VCSSStyleDeclaration> = {
    width: '70%',
    fontSize: '14px',
    color: '#9b5de0',
    verticalAlign: 'center',
  };
  if (isCurrentPlayer) {
    return { ...baseStyle, color: '#fdcffa', fontWeight: 'bold' };
  }
  return baseStyle;
}
