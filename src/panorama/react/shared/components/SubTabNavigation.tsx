interface Tab<T = string> {
  id: T;
  label: string;
}

interface SubTabNavigationProps<T = string> {
  tabs: Tab<T>[];
  currentTab: T;
  onTabChange: (tabId: T) => void;
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
 * 通用竖向 Sub Tab 导航栏。
 *
 * 用 <Button> 而非 <RadioButton>，避免 Panorama 内置 radio 圆形选中标记。
 */
export function SubTabNavigation<T extends string = string>({
  tabs,
  currentTab,
  onTabChange,
}: SubTabNavigationProps<T>) {
  return (
    <Panel style={containerStyle}>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <Button
            key={tab.id}
            style={isActive ? subTabButtonActiveStyle : subTabButtonStyle}
            onactivate={() => onTabChange(tab.id)}
          >
            <Label style={isActive ? subTabLabelActiveStyle : subTabLabelStyle} text={tab.label} />
          </Button>
        );
      })}
    </Panel>
  );
}
