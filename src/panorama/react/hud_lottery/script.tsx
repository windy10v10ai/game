import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';

import { render } from 'react-panorama-x';
import * as React from 'react';
import ExpandButton from './components/ExpandButton';
import ContentPanel from './components/ContentPanel';

function DrawAbility() {
  const [isCollapsed, setIsCollapsed] = React.useState(true);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const collapseContainerStyle: Partial<VCSSStyleDeclaration> = {
    // 水平居中
    horizontalAlign: 'center',
  };

  return (
    <Panel style={collapseContainerStyle}>
      <ExpandButton isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />

      <ContentPanel isCollapsed={isCollapsed} />
    </Panel>
  );
}

render(<DrawAbility />, $.GetContextPanel());
