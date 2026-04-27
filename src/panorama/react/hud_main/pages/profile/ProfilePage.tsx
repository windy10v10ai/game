import React, { useState } from 'react';
import { TabNavigation } from '../../../shared/components';
import { useNavigation } from '../../store/NavigationContext';
import { StatsTab } from './tabs/StatsTab';
import { LevelsTab } from './tabs/LevelsTab';
import { AttributesTab } from './tabs/AttributesTab';

type ProfileTabId = 'stats' | 'levels' | 'attributes';

interface ProfilePageProps {
  initialTab?: ProfileTabId;
}

const PROFILE_TABS: { id: ProfileTabId; label: string }[] = [
  { id: 'stats', label: '战绩' },
  { id: 'levels', label: '等级' },
  { id: 'attributes', label: '属性' },
];

/**
 * 个人中心页面（Profile）。
 *
 * 内含三个 tab：战绩 / 等级 / 属性。
 * 由 PageRouter 渲染，关闭通过 useNavigation().closePage()（也可点击入口按钮 toggle）。
 */
export function ProfilePage({ initialTab = 'stats' }: ProfilePageProps) {
  const [currentTab, setCurrentTab] = useState<ProfileTabId>(initialTab);
  const { closePage } = useNavigation();

  return (
    <Panel className="modal-backdrop">
      <Panel className="modal-panel">
        <Panel className="modal-header">
          <Label className="modal-title" text="个人中心" />
          <Button className="btn-close" onactivate={closePage} />
        </Panel>

        <TabNavigation tabs={PROFILE_TABS} currentTab={currentTab} onTabChange={setCurrentTab} />

        <Panel className="content-area">
          {currentTab === 'stats' && <StatsTab />}
          {currentTab === 'levels' && <LevelsTab />}
          {currentTab === 'attributes' && <AttributesTab />}
        </Panel>
      </Panel>
    </Panel>
  );
}
