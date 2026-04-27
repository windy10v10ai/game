import React from 'react';

/**
 * 战绩 Tab：场次 / 胜率 / KDA 等累计数据。
 * 当前为占位静态数据，后续由 player_table 等 net table 注入。
 */
export function StatsTab() {
  return (
    <Panel className="stats-container">
      <Panel className="stat-item">
        <Label className="stat-label" text="游戏场次：" />
        <Label className="stat-value" text="0" />
      </Panel>
      <Panel className="stat-item">
        <Label className="stat-label" text="胜率：" />
        <Label className="stat-value" text="0%" />
      </Panel>
      <Panel className="stat-item">
        <Label className="stat-label" text="击杀数：" />
        <Label className="stat-value" text="0" />
      </Panel>
      <Panel className="stat-item">
        <Label className="stat-label" text="死亡数：" />
        <Label className="stat-value" text="0" />
      </Panel>
      <Panel className="stat-item">
        <Label className="stat-label" text="助攻数：" />
        <Label className="stat-value" text="0" />
      </Panel>
    </Panel>
  );
}
