import React from 'react';

/**
 * 成就页面组件
 */
export function AchievementsPage() {
  // 示例成就数据
  const achievements = [
    { id: 1, title: '首次胜利', desc: '赢得第一场游戏', unlocked: true },
    { id: 2, title: '连胜达人', desc: '连续赢得 5 场游戏', unlocked: false },
    { id: 3, title: '杀戮机器', desc: '单局击杀超过 20 次', unlocked: false },
  ];

  return (
    <Panel className="achievements-container">
      {achievements.map((achievement) => (
        <Panel key={achievement.id} className="achievement-item">
          <Panel className={`achievement-icon ${achievement.unlocked ? 'unlocked' : 'locked'}`} />
          <Panel className="achievement-text-container">
            <Label className="achievement-title" text={achievement.title} />
            <Label className="achievement-desc" text={achievement.desc} />
          </Panel>
        </Panel>
      ))}
    </Panel>
  );
}
