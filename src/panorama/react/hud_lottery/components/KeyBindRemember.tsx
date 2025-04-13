import React from 'react';

interface KeyBindRememberProps {
  isRememberAbilityKey: boolean;
  setIsRememberAbilityKey: (value: boolean) => void;
}

const KeyBindRemember: React.FC<KeyBindRememberProps> = ({
  isRememberAbilityKey,
  setIsRememberAbilityKey,
}) => {
  const containerStyle: Partial<VCSSStyleDeclaration> = {
    width: '100%',
    height: '24px',
    flowChildren: 'right',
    horizontalAlign: 'left',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: '2px 10px',
  };

  const labelStyle: Partial<VCSSStyleDeclaration> = {
    fontSize: '12px',
    verticalAlign: 'center',
    textTransform: 'uppercase',
  };

  return (
    <Panel style={containerStyle}>
      <ToggleButton
        selected={isRememberAbilityKey}
        onactivate={() => setIsRememberAbilityKey(!isRememberAbilityKey)}
      />
      <Label text={$.Localize('#key_bind_remember')} style={labelStyle} />
    </Panel>
  );
};

export default KeyBindRemember;
