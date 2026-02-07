interface Tab {
  id: string;
  label: string;
}

interface SubTabNavigationProps {
  tabs: Tab[];
  currentTab: string;
  onTabChange: (tabId: string) => void;
}

const containerStyle: Partial<VCSSStyleDeclaration> = {
  width: '30%',
  flowChildren: 'down',
  marginRight: '10px',
  borderRadius: '8px',
  verticalAlign: 'top',
  padding: '8px',
};

const subTabButtonStyle: Partial<VCSSStyleDeclaration> = {
  width: '100%',
  height: '50px',
  backgroundColor: '#2a2a3e',
  borderRadius: '8px',
  margin: '4px 0px',
  flowChildren: 'down',
  transitionDuration: '0.25s',
  transitionTimingFunction: 'ease-in-out',
  backgroundImage: 'none',
};

const subTabLabelStyle: Partial<VCSSStyleDeclaration> = {
  width: '100%',
  height: '100%',
  padding: '15px 0px',
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#80A1BA',
  textAlign: 'center',
  verticalAlign: 'center',
};

const subTabButtonActiveStyle: Partial<VCSSStyleDeclaration> = {
  ...subTabButtonStyle,
  backgroundColor: '#80A1BA',
  transform: 'translateX(4px)',
};

const subTabLabelActiveStyle: Partial<VCSSStyleDeclaration> = {
  ...subTabLabelStyle,
  color: '#ffffff',
};

/**
 * 可复用的竖向 Sub Tab 导航栏组件
 */
export function SubTabNavigation({ tabs, currentTab, onTabChange }: SubTabNavigationProps) {
  return (
    <Panel style={containerStyle}>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <RadioButton
            key={tab.id}
            style={isActive ? subTabButtonActiveStyle : subTabButtonStyle}
            selected={isActive}
            onactivate={() => onTabChange(tab.id)}
          >
            <Label style={isActive ? subTabLabelActiveStyle : subTabLabelStyle} text={tab.label} />
          </RadioButton>
        );
      })}
    </Panel>
  );
}
