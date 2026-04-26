import React from 'react';

/**
 * 统计页面组件
 */
export function StatsPage() {
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
