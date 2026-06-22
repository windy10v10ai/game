import React, { useRef, useState } from 'react';
import { TabNavigation } from '../../../shared/components';
import { useNetTable } from '../../../shared/hooks/useNetTable';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import { useNavigation } from '../../store/NavigationContext';
import { StatsTab } from './tabs/StatsTab';
import { AwakenTab } from './tabs/AwakenTab';
import { MemberTab } from './tabs/member';
import { MemberSubTab } from './tabs/member/constants';

export type ProfileTabId = 'stats' | 'awaken' | 'member';

interface ProfilePageProps {
  // 支持 'tab' 或 'tab:subTab'（如 'member:points'）定位到一级 tab 内的子页
  initialTab?: string;
}

const PROFILE_TABS: { id: ProfileTabId; label: string }[] = [
  { id: 'stats', label: $.Localize('#profile_tab_stats') },
  { id: 'awaken', label: $.Localize('#profile_tab_awaken') },
  { id: 'member', label: $.Localize('#profile_tab_member') },
];

export function ProfilePage({ initialTab = 'stats' }: ProfilePageProps) {
  const [tab, subTab] = initialTab.split(':');
  const [currentTab, setCurrentTab] = useState<ProfileTabId>(tab as ProfileTabId);
  const { closePage } = useNavigation();
  const steamId = GetLocalPlayerSteamAccountID();
  const player = useNetTable('player_table', steamId);
  const seasonPointTotal = player?.seasonPointTotal ?? 0;
  const memberPointTotal = player?.memberPointTotal ?? 0;
  const useableSeasonPoint = player?.useableSeasonPoint ?? 0;
  const useableMemberPoint = player?.useableMemberPoint ?? 0;
  const seasonPointRef = useRef<Panel | null>(null);
  const memberPointRef = useRef<Panel | null>(null);

  return (
    <Panel className="profile-overlay" onactivate={closePage}>
      <Panel className="modal-panel profile-modal" hittest={true} onactivate={() => {}}>
        <Panel className="modal-header">
          <Label className="modal-title" text={$.Localize('#profile_title')} />
          <Panel className="profile-header-points">
            <Panel
              ref={seasonPointRef}
              className="profile-header-point-item"
              onmouseover={() =>
                seasonPointRef.current &&
                $.DispatchEvent(
                  'DOTAShowTextTooltip',
                  seasonPointRef.current,
                  $.Localize('#data_panel_season_point'),
                )
              }
              onmouseout={() => $.DispatchEvent('DOTAHideTextTooltip')}
            >
              <Image
                className="profile-header-point-icon"
                src="s2r://panorama/images/custom_game/battlepass/pts_earned_png.vtex"
              />
              <Label
                className="profile-header-point-value-season"
                text={String(useableSeasonPoint)}
              />
              <Label className="profile-header-point-total" text={` / ${seasonPointTotal}`} />
            </Panel>
            <Panel
              ref={memberPointRef}
              className="profile-header-point-item"
              onmouseover={() =>
                memberPointRef.current &&
                $.DispatchEvent(
                  'DOTAShowTextTooltip',
                  memberPointRef.current,
                  $.Localize('#data_panel_member_point'),
                )
              }
              onmouseout={() => $.DispatchEvent('DOTAHideTextTooltip')}
            >
              <Image
                className="profile-header-point-icon"
                src="s2r://panorama/images/custom_game/battlepass/charge_point_png.vtex"
              />
              <Label className="profile-header-point-value" text={String(useableMemberPoint)} />
              <Label className="profile-header-point-total" text={` / ${memberPointTotal}`} />
            </Panel>
          </Panel>
          <Button className="btn-close" onactivate={closePage} />
        </Panel>

        <Panel className="tab-nav-wrapper">
          <TabNavigation tabs={PROFILE_TABS} currentTab={currentTab} onTabChange={setCurrentTab} />
        </Panel>

        <Panel className="content-area">
          {currentTab === 'stats' && <StatsTab />}
          {currentTab === 'awaken' && <AwakenTab />}
          {currentTab === 'member' && (
            <MemberTab initialSubTab={subTab as MemberSubTab | undefined} />
          )}
        </Panel>
      </Panel>
    </Panel>
  );
}
