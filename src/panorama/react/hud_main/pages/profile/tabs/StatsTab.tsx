import React from 'react';

/**
 * 战绩 Tab：左侧头像/昵称面板 + 右侧数据卡片。
 */
export function StatsTab() {
  return (
    <Panel className="stats-layout">
      <Panel className="stats-player-card">
        <Panel className="stats-avatar-wrap">
          <DOTAAvatarImage
            className="stats-avatar"
            steamid="local"
            style={{ width: '112px', height: '112px' }}
          />
        </Panel>
        <DOTAUserName className="stats-username" steamid="local" />
      </Panel>

      <Panel className="stats-container">
        <Panel className="stat-item">
          <Label className="stat-label" text={$.Localize('#profile_stat_games')} />
          <Label className="stat-value" text="0" />
        </Panel>
        <Panel className="stat-item">
          <Label className="stat-label" text={$.Localize('#profile_stat_winrate')} />
          <Label className="stat-value" text="0%" />
        </Panel>
        <Panel className="stat-item">
          <Label className="stat-label" text={$.Localize('#profile_stat_kills')} />
          <Label className="stat-value" text="0" />
        </Panel>
        <Panel className="stat-item">
          <Label className="stat-label" text={$.Localize('#profile_stat_deaths')} />
          <Label className="stat-value" text="0" />
        </Panel>
        <Panel className="stat-item">
          <Label className="stat-label" text={$.Localize('#profile_stat_assists')} />
          <Label className="stat-value" text="0" />
        </Panel>
      </Panel>
    </Panel>
  );
}
