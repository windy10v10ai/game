import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';

import { render } from 'react-panorama-x';
import * as React from 'react';
import DrawAbilities from './components/DrawAbilities';

function DrawAbility() {
  const [isCollapsed, setIsCollapsed] = React.useState(true);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const collapseContainerStyle: Partial<VCSSStyleDeclaration> = {
    padding: '10px',
    borderRadius: '15px', // 圆角
    marginTop: '65px',
    marginLeft: '350px',
    backgroundColor: '#1b1e28f2', // 深蓝色背景
    boxShadow: 'inset 0 0 1px #62758B', // 内阴影
    border: '2px solid #ffd700', // 金色边框
  };

  const CollapseButtonStyle: Partial<VCSSStyleDeclaration> = {
    color: 'white',
  };

  const ContentStyle: Partial<VCSSStyleDeclaration> = {
    flowChildren: 'right' /* 确保内容按顺序排列 */,
    marginTop: '50px',
  };

  return (
    <Panel style={collapseContainerStyle} className={isCollapsed ? 'collapsed' : 'expanded'}>
      <Button style={CollapseButtonStyle} onactivate={toggleCollapse}>
        <Label text={isCollapsed ? '展开' : '折叠'} />
      </Button>

      {!isCollapsed && (
        <Panel style={ContentStyle}>
          {/* 展开后显示的内容 */}
          <DrawAbilities />
        </Panel>
      )}
    </Panel>
  );
}

render(<DrawAbility />, $.GetContextPanel());
