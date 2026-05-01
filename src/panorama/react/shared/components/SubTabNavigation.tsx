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
  width: '18%',
  flowChildren: 'down',
  marginRight: '12px',
  verticalAlign: 'top',
  padding: '4px',
};

const subTabButtonStyle: Partial<VCSSStyleDeclaration> = {
  width: '100%',
  height: '44px',
  backgroundColor: '#00000055',
  border: '1px solid #e0caa544',
  borderRadius: '6px',
  marginBottom: '6px',
  transitionProperty: 'background-color, border-color',
  transitionDuration: '0.15s',
  transitionTimingFunction: 'ease-out',
  backgroundImage: 'none',
};

const subTabLabelStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'center',
  verticalAlign: 'center',
  textAlign: 'center',
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#ffffffcc',
  textOverflow: 'shrink',
};

const subTabButtonActiveStyle: Partial<VCSSStyleDeclaration> = {
  ...subTabButtonStyle,
  backgroundColor: '#daa52022',
  border: '1px solid #daa520',
};

const subTabLabelActiveStyle: Partial<VCSSStyleDeclaration> = {
  ...subTabLabelStyle,
  color: '#daa520',
  textShadow: '2px 2px 8px #000000aa',
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
