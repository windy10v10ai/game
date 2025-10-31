interface Tab {
  id: string;
  label: string;
}

interface SubTabNavigationProps {
  tabs: Tab[];
  currentTab: string;
  onTabChange: (tabId: string) => void;
}

const subTabButtonStyle: Partial<VCSSStyleDeclaration> = {
  width: '100%',
  height: '45px',
  backgroundColor: '#2a2a3e',
  borderRadius: '5px',
  margin: '5px 0px',
  fontSize: '65px',
  flowChildren: 'left',
};

const subTabLabelStyle: Partial<VCSSStyleDeclaration> = {
  fontSize: '25px',
  fontWeight: 'bold',
  color: '#9b5de0',
  textAlign: 'center',
  verticalAlign: 'center',
};

/**
 * 可复用的竖向 Sub Tab 导航栏组件
 */
export function SubTabNavigation({ tabs, currentTab, onTabChange }: SubTabNavigationProps) {
  return (
    <Panel className="sub-tab-container">
      {tabs.map((tab) => (
        <RadioButton
          key={tab.id}
          style={subTabButtonStyle}
          selected={currentTab === tab.id}
          onactivate={() => onTabChange(tab.id)}
        >
          <Label style={subTabLabelStyle} text={tab.label} />
        </RadioButton>
      ))}
    </Panel>
  );
}
