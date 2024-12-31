import React from 'react';

interface KeySettingButtonProps {
  abilityname: string;
  bindKey: string;
}

const handleClick = () => {
  // TODO
};

const KeySettingButton: React.FC<KeySettingButtonProps> = ({ abilityname, bindKey }) => {
  const buttonStyle: Partial<VCSSStyleDeclaration> = {
    flowChildren: 'down',
    padding: '10px', // 内边距
    width: '100px', // 宽度
    borderRadius: '3px', // 圆角
  };

  return (
    <Button style={buttonStyle} className="BindingRow">
      <DOTAAbilityImage abilityname={abilityname} showtooltip={true} />
      <Label className="BindingContainer" onactivate={handleClick}>
        <Label className="BindingText" text={bindKey} />
      </Label>
    </Button>
  );
};

export default KeySettingButton;
