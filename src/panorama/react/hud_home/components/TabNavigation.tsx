interface Tab<T = string> {
  id: T;
  label: string;
}

interface TabNavigationProps<T = string> {
  tabs: Tab<T>[];
  currentTab: T;
  onTabChange: (tabId: T) => void;
}

// 容器样式
const containerStyle: Partial<VCSSStyleDeclaration> = {
  width: '100%',
  height: '60px',
  flowChildren: 'right',
  backgroundColor: '#1a1a2e',
  padding: '8px 15px',
  // visibility: 'collapse',
};

// 按钮基础样式
const buttonBaseStyle: Partial<VCSSStyleDeclaration> = {
  width: '33.33%',
  height: '100%',
  flowChildren: 'right',
  backgroundColor: '#1a1a2e',
  padding: '8px 15px',
};

// 激活状态按钮样式
const buttonActiveStyle: Partial<VCSSStyleDeclaration> = {
  ...buttonBaseStyle,
  backgroundColor: '#9b5de0',
};

// Label 样式
const labelStyle: Partial<VCSSStyleDeclaration> = {
  width: '100%',
  height: '100%',
  textAlign: 'center',
  fontSize: '20px',
  fontWeight: 'bold',
};

/**
 * 可复用的横向主 Tab 导航栏组件
 */
export function TabNavigation<T extends string = string>({
  tabs,
  currentTab,
  onTabChange,
}: TabNavigationProps<T>) {
  return (
    <Panel style={containerStyle}>
      {tabs.map((tab) => (
        <RadioButton
          key={tab.id}
          style={currentTab === tab.id ? buttonActiveStyle : buttonBaseStyle}
          selected={currentTab === tab.id}
          onactivate={() => onTabChange(tab.id)}
        >
          <Label style={labelStyle} text={tab.label} />
        </RadioButton>
      ))}
    </Panel>
  );
}
