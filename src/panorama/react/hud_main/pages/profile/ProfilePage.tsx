import React, { useState } from 'react';
import { TabNavigation } from '../../../shared/components';
import { useNavigation } from '../../store/NavigationContext';
import { StatsTab } from './tabs/StatsTab';

type ProfileTabId = 'stats';

interface ProfilePageProps {
  initialTab?: ProfileTabId;
}

const PROFILE_TABS: { id: ProfileTabId; label: string }[] = [
  { id: 'stats', label: $.Localize('#profile_tab_stats') },
];

export function ProfilePage({ initialTab = 'stats' }: ProfilePageProps) {
  const [currentTab, setCurrentTab] = useState<ProfileTabId>(initialTab);
  const { closePage } = useNavigation();

  return (
    <Panel className="modal-backdrop">
      <Panel className="modal-panel profile-modal" hittest={true}>
        <Panel className="modal-header">
          <Label className="modal-title" text={$.Localize('#profile_title')} />
          <Button className="btn-close" onactivate={closePage} />
        </Panel>

        <Panel className="tab-nav-wrapper">
          <TabNavigation tabs={PROFILE_TABS} currentTab={currentTab} onTabChange={setCurrentTab} />
        </Panel>

        <Panel className="content-area">{currentTab === 'stats' && <StatsTab />}</Panel>
      </Panel>
    </Panel>
  );
}
