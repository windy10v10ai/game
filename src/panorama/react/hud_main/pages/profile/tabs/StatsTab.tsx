import React from 'react';
import { useNetTable } from '../../../../shared/hooks/useNetTable';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';

const AVATAR_BORDER_GOLD =
  'url("s2r://panorama/images/custom_game/profile/avatar-square-gold-border.png")';
const AVATAR_BORDER_NORMAL =
  'url("s2r://panorama/images/custom_game/profile/avatar-square-normal-border.png")';

/**
 * 战绩 Tab：左侧头像/昵称面板 + 右侧数据卡片。
 * 头像边框根据 member_table.enable 切换 gold / normal。
 */
export function StatsTab() {
  const steamId = GetLocalPlayerSteamAccountID();
  const member = useNetTable('member_table', steamId);
  const isMember = member != null && (member.enable as unknown as number) === 1;
  const borderUrl = isMember ? AVATAR_BORDER_GOLD : AVATAR_BORDER_NORMAL;

  return (
    <Panel className="stats-layout">
      <Panel className="stats-player-card">
        <Panel className="stats-avatar-wrap" style={{ backgroundImage: borderUrl }}>
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
