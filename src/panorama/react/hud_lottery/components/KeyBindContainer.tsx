import React from 'react';
import KeySettingButton from './KeySettingButton';

interface KeyBindContainerProps {
  isCollapsed: boolean;
}

const KeyBindContainer: React.FC<KeyBindContainerProps> = ({ isCollapsed }) => {
  const containerStyle: Partial<VCSSStyleDeclaration> = {
    padding: '30px',
    visibility: isCollapsed ? 'collapse' : 'visible',
    flowChildren: 'down',
  };

  return (
    <Panel style={containerStyle} className="container">
      <KeySettingButton abilityname={'brewmaster_fire_permanent_immolation'} bindKey={'F1'} />
    </Panel>
  );
};

export default KeyBindContainer;
