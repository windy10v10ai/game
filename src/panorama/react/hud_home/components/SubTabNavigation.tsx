interface Tab {
  id: string;
  label: string;
}

interface SubTabNavigationProps {
  tabs: Tab[];
  currentTab: string;
  onTabChange: (tabId: string) => void;
}

/**
 * 可复用的竖向 Sub Tab 导航栏组件
 */
export function SubTabNavigation({ tabs, currentTab, onTabChange }: SubTabNavigationProps) {
  return (
    <Panel className="sub-tab-container">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          className={`sub-tab-button ${currentTab === tab.id ? 'active' : ''}`}
          onactivate={() => onTabChange(tab.id)}
        >
          <Label text={tab.label} />
        </Button>
      ))}
    </Panel>
  );
}

