import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';

import { useState } from 'react';
import ExpandButton from './components/ExpandButton';
import KeyBindContainer from './components/KeyBindContainer';

const containerStyle: Partial<VCSSStyleDeclaration> = {
  flowChildren: 'down',
  horizontalAlign: 'left',
  verticalAlign: 'bottom',
  marginBottom: '270px',
};

function KeyBind() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <Panel style={containerStyle}>
      <KeyBindContainer isCollapsed={isCollapsed} />
      <Panel style={{ horizontalAlign: 'left', verticalAlign: 'bottom' }}>
        <ExpandButton
          textToken={isCollapsed ? '#key_bind' : '#key_bind_collapsed'}
          toggleCollapse={toggleCollapse}
        />
      </Panel>
    </Panel>
  );
}

export default KeyBind;
