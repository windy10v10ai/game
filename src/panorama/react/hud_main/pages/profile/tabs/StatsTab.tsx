import { useRef } from 'react';
import { useNetTable } from '../../../../shared/hooks/useNetTable';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';

const AVATAR_BORDER_GOLD =
  'url("s2r://panorama/images/custom_game/profile/avatar-square-gold-border.png")';
const AVATAR_BORDER_NORMAL =
  'url("s2r://panorama/images/custom_game/profile/avatar-square-normal-border.png")';

/**
 * 战绩 Tab：左侧头像/昵称面板 + 右侧数据卡片。
 * 头像边框根据 player.member.enable 切换 gold / normal。
 */
export function StatsTab() {
  const steamId = GetLocalPlayerSteamAccountID();
  const player = useNetTable('player_table', steamId);
  const isMember = player?.member?.enable === true;
  const borderUrl = isMember ? AVATAR_BORDER_GOLD : AVATAR_BORDER_NORMAL;

  const matchCount = player?.matchCount ?? 0;
  const winRate =
    matchCount > 0 ? Math.round(((player?.winCount ?? 0) / matchCount) * 100) + '%' : '0%';
  const conductPoint = player?.conductPoint ?? 100;
  const conductColor =
    conductPoint < 60
      ? '#E87D7D'
      : conductPoint < 80
        ? '#F5A623'
        : conductPoint >= 110
          ? '#E8C07D'
          : '#7FD47F';
  const commendCount = player?.commendCount ?? 0;
  const reportCount = player?.reportCount ?? 0;

  const conductTipRef = useRef<ImagePanel | null>(null);

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
        <Panel className="stats-conduct-counts">
          <Label className="stats-conduct-count commend" text={'👍 ' + commendCount} />
          <Label className="stats-conduct-count report" text={'👎 ' + reportCount} />
        </Panel>
      </Panel>

      <Panel className="stats-container">
        <Panel className="stat-item">
          <Label className="stat-label" text={$.Localize('#profile_stat_games')} />
          <Label className="stat-value" text={String(matchCount)} />
        </Panel>
        <Panel className="stat-item">
          <Label className="stat-label" text={$.Localize('#profile_stat_winrate')} />
          <Label className="stat-value" text={winRate} />
        </Panel>
        <Panel className="stat-item">
          <Label className="stat-label" text={$.Localize('#profile_stat_conduct')} />
          <Label
            className="stat-value"
            text={String(conductPoint)}
            style={conductColor ? { color: conductColor } : undefined}
          />
          <Image
            ref={conductTipRef}
            className="stat-tip-icon"
            src="s2r://panorama/images/status_icons/information_psd.vtex"
            onmouseover={() =>
              conductTipRef.current &&
              $.DispatchEvent(
                'DOTAShowTextTooltip',
                conductTipRef.current,
                $.Localize('#profile_stat_conduct_tooltip'),
              )
            }
            onmouseout={() => $.DispatchEvent('DOTAHideTextTooltip')}
          />
        </Panel>
        <Label className="stat-coming-soon" text={$.Localize('#profile_stat_coming_soon')} />
      </Panel>
    </Panel>
  );
}
