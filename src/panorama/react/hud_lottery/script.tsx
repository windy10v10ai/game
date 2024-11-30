import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';

import { render } from 'react-panorama-x';
import * as React from 'react';
import ExpandButton from './components/ExpandButton';
import ContentContainer from './components/ContentContainer';

function DrawAbility() {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

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

      <ContentContainer isCollapsed={isCollapsed} />
    </Panel>
  );
}

render(<DrawAbility />, $.GetContextPanel());
