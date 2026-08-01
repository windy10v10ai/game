import React from 'react';

interface KeyBindRememberProps {
  isRememberAbilityKey: boolean;
  setIsRememberAbilityKey: (value: boolean) => void;
  clearAllKeys: () => void;
}

const KeyBindRemember: React.FC<KeyBindRememberProps> = ({
  isRememberAbilityKey,
  setIsRememberAbilityKey,
  clearAllKeys,
}) => {
  // 不用 flowChildren，否则右侧按钮无法稳定贴边
  const containerStyle: Partial<VCSSStyleDeclaration> = {
    width: '100%',
    height: '24px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: '2px 10px',
  };

  const rememberGroupStyle: Partial<VCSSStyleDeclaration> = {
    flowChildren: 'right',
    horizontalAlign: 'left',
    verticalAlign: 'center',
  };

  const labelStyle: Partial<VCSSStyleDeclaration> = {
    fontSize: '12px',
    verticalAlign: 'center',
    textTransform: 'uppercase',
  };

  const clearButtonStyle: Partial<VCSSStyleDeclaration> = {
    horizontalAlign: 'right',
    verticalAlign: 'center',
    padding: '0px 8px',
    borderRadius: '3px',
  };

  return (
    <Panel style={containerStyle}>
      <Panel style={rememberGroupStyle}>
        <ToggleButton
          selected={isRememberAbilityKey}
          onactivate={() => setIsRememberAbilityKey(!isRememberAbilityKey)}
        />
        <Label text={$.Localize('#key_bind_remember')} style={labelStyle} />
      </Panel>
      <Panel
        className="BindingRow"
        style={clearButtonStyle}
        onactivate={clearAllKeys}
        onmouseover={(e) =>
          $.DispatchEvent('DOTAShowTextTooltip', e, $.Localize('#key_bind_clear_tooltip'))
        }
        onmouseout={() => $.DispatchEvent('DOTAHideTextTooltip')}
      >
        <Label text={$.Localize('#key_bind_clear')} style={labelStyle} />
      </Panel>
    </Panel>
  );
};

export default KeyBindRemember;
