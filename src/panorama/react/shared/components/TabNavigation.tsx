interface Tab<T = string> {
  id: T;
  label: string;
}

interface TabNavigationProps<T = string> {
  tabs: Tab<T>[];
  currentTab: T;
  onTabChange: (tabId: T) => void;
}

/**
 * 通用横向主 Tab 导航栏。
 *
 * 用 <Button> 而非 <RadioButton>，避免 Panorama 内置 radio 圆形选中标记。
 * 样式走 shared/styles/tab-navigation.less —— inline style 不支持 :hover 伪类。
 * 选中态：文字金色 + 底部 2px 金色指示线。
 */
export function TabNavigation<T extends string = string>({
  tabs,
  currentTab,
  onTabChange,
}: TabNavigationProps<T>) {
  return (
    <Panel className="tab-nav-container">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        const buttonClass = isActive ? 'tab-nav-button tab-nav-button-active' : 'tab-nav-button';
        const labelClass = isActive ? 'tab-nav-label tab-nav-label-active' : 'tab-nav-label';
        return (
          <Button key={tab.id} className={buttonClass} onactivate={() => onTabChange(tab.id)}>
            <Label className={labelClass} text={tab.label} />
          </Button>
        );
      })}
    </Panel>
  );
}
