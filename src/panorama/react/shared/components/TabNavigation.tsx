interface Tab<T = string> {
  id: T;
  label: string;
}

interface TabNavigationProps<T = string> {
  tabs: Tab<T>[];
  currentTab: T;
  onTabChange: (tabId: T) => void;
}

// 容器：透明背景，融入 modal 主体；底部一条金色细线作为 tab 栏与内容分隔
const containerStyle: Partial<VCSSStyleDeclaration> = {
  width: '100%',
  height: '50px',
  flowChildren: 'right',
  padding: '0px 12px',
  borderBottom: '1px solid #daa52055',
};

// 用 Button 而不是 RadioButton，避免 Panorama 默认渲染圆形选中标记。
// Panorama 的 border 短手不接受 'none'；用 borderWidth: 0 把边框关掉。
const buttonBaseStyle: Partial<VCSSStyleDeclaration> = {
  width: '33.33%',
  height: '100%',
  flowChildren: 'down',
  backgroundColor: 'transparent',
  borderWidth: '0px',
  padding: '0px',
  transitionProperty: 'background-color',
  transitionDuration: '0.15s',
  transitionTimingFunction: 'ease-out',
};

const labelBaseStyle: Partial<VCSSStyleDeclaration> = {
  width: '100%',
  height: '100%',
  textAlign: 'center',
  verticalAlign: 'center',
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#ffffff99',
  transitionProperty: 'color',
  transitionDuration: '0.15s',
  transitionTimingFunction: 'ease-out',
};

const labelActiveStyle: Partial<VCSSStyleDeclaration> = {
  ...labelBaseStyle,
  color: '#daa520',
};

/**
 * 通用横向主 Tab 导航栏。
 *
 * 用 <Button> 而非 <RadioButton>，避免 Panorama 内置 radio 圆形选中标记。
 * 选中态靠文字颜色（金色 #daa520）区分。
 */
export function TabNavigation<T extends string = string>({
  tabs,
  currentTab,
  onTabChange,
}: TabNavigationProps<T>) {
  return (
    <Panel style={containerStyle}>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <Button key={tab.id} style={buttonBaseStyle} onactivate={() => onTabChange(tab.id)}>
            <Label style={isActive ? labelActiveStyle : labelBaseStyle} text={tab.label} />
          </Button>
        );
      })}
    </Panel>
  );
}
