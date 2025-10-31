import { RefObject } from 'react';

interface LeaderboardColumn {
  className: string;
  text: string;
}

interface LeaderboardViewProps {
  title: string;
  currentRank: string | number;
  columns: LeaderboardColumn[];
  listRef: RefObject<Panel>;
}

/**
 * 可复用的排行榜视图组件
 */
export function LeaderboardView({ title, currentRank, columns, listRef }: LeaderboardViewProps) {
  return (
    <Panel className="leaderboard-content">
      {/* 标题和当前玩家排名 */}
      <Panel className="leaderboard-header">
        <Label className="leaderboard-title" text={title} />
        <Panel className="current-rank-display">
          <Label className="current-rank-label" text="你的排名：" />
          <Label className="current-rank-value" text={currentRank.toString()} />
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
        {/* 排行榜列表内容 */}
      </Panel>
    </Panel>
  );
}
