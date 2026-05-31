import { useRef } from 'react';
import { useNetTable } from '../../../../shared/hooks/useNetTable';
import { formatStatNumber } from '../../../../shared/utils/format-stat-number';
import { isMemberActive } from '../../../../shared/utils/member';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';

const AVATAR_BORDER_GOLD =
  'url("s2r://panorama/images/custom_game/profile/avatar-square-gold-border.png")';
const AVATAR_BORDER_NORMAL =
  'url("s2r://panorama/images/custom_game/profile/avatar-square-normal-border.png")';

const LIFETIME_STATS = [
  { key: 'kills', label: '#profile_stat_lifetime_kills', tone: 'good' },
  { key: 'deaths', label: '#profile_stat_lifetime_deaths', tone: 'bad' },
  { key: 'assists', label: '#profile_stat_lifetime_assists', tone: 'good' },
  { key: 'lastHits', label: '#profile_stat_lifetime_last_hits', tone: 'neutral' },
  { key: 'heroDamage', label: '#profile_stat_lifetime_hero_damage', tone: 'damage' },
  { key: 'damageTaken', label: '#profile_stat_lifetime_damage_taken', tone: 'bad' },
  { key: 'healing', label: '#profile_stat_lifetime_healing', tone: 'good' },
  { key: 'towerKills', label: '#profile_stat_lifetime_tower_kills', tone: 'neutral' },
  { key: 'totalGoldEarned', label: '#profile_stat_lifetime_total_gold', tone: 'gold' },
] as const;

/**
 * 战绩 Tab：左侧头像/昵称面板 + 右侧数据卡片。
 * 头像边框根据 player.member.enable 切换 gold / normal。
 */
export function StatsTab() {
  const steamId = GetLocalPlayerSteamAccountID();
  const player = useNetTable('player_table', steamId);
  const isMember = isMemberActive(player?.member);
  const borderUrl = isMember ? AVATAR_BORDER_GOLD : AVATAR_BORDER_NORMAL;

  const matchCount = player?.matchCount ?? 0;
  const winRate =
    matchCount > 0 ? Math.round(((player?.winCount ?? 0) / matchCount) * 100) + '%' : '0%';
  const conductPoint = player?.conductPoint ?? 100;
  const conductColor =
    conductPoint < 60
      ? '#E87D7D'
      : conductPoint < 80
        ? '#FFA726'
        : conductPoint >= 110
          ? '#FFD700'
          : '#7FD47F';
  const commendCount = player?.commendCount ?? 0;
  const reportCount = player?.reportCount ?? 0;
  const conductNet = commendCount - reportCount;
  const isPositive = conductNet >= 0;
  const conductIcon = isPositive
    ? 's2r://panorama/images/custom_game/conduct/thumb_up_fill_png.vtex'
    : 's2r://panorama/images/custom_game/conduct/thumb_down_fill_png.vtex';
  const conductTipRef = useRef<ImagePanel | null>(null);
  const conductNetRef = useRef<Panel | null>(null);
  const lifetimeStats = player?.statsLifetime;
  const isChinese = $.Language() === 'schinese';

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
          <Panel
            ref={conductNetRef}
            className={`stats-conduct-count ${isPositive ? 'commend' : 'report'}`}
            onmouseover={() =>
              conductNetRef.current &&
              $.DispatchEvent(
                'DOTAShowTextTooltip',
                conductNetRef.current,
                $.Localize('#profile_stat_conduct_net_tooltip'),
              )
            }
            onmouseout={() => $.DispatchEvent('DOTAHideTextTooltip')}
          >
            <Image className="stats-conduct-icon" src={conductIcon} />
            <Label className="stats-conduct-count-text" text={String(Math.abs(conductNet))} />
          </Panel>
        </Panel>
      </Panel>

      <Panel className="stats-container">
        <Panel className="stats-summary-column">
          <Panel className="stat-row">
            <Label className="stat-label" text={$.Localize('#profile_stat_games')} />
            <Label className="stat-value" text={String(matchCount)} />
          </Panel>
          <Panel className="stat-row">
            <Label className="stat-label" text={$.Localize('#profile_stat_winrate')} />
            <Label className="stat-value" text={winRate} />
          </Panel>
          <Panel className="stat-row">
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
        </Panel>

        <Panel className="stats-column-divider" />

        <Panel className="stats-lifetime-column">
          <Panel className="stats-lifetime-list">
            {LIFETIME_STATS.map(({ key, label, tone }) => (
              <Panel key={key} className={`stat-row lifetime-${tone}`}>
                <Label className="stat-label" text={$.Localize(label)} />
                <Label
                  className="stat-value"
                  text={formatStatNumber(lifetimeStats?.[key] ?? 0, isChinese)}
                />
              </Panel>
            ))}
          </Panel>
        </Panel>
      </Panel>
    </Panel>
  );
}
