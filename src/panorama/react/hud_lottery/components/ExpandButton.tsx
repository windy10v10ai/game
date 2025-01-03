import React from 'react';

interface ExpandButtonProps {
  textToken: string;
  toggleCollapse: () => void;
}

const ExpandButton: React.FC<ExpandButtonProps> = ({ textToken, toggleCollapse }) => {
  const buttonStyle: Partial<VCSSStyleDeclaration> = {
    padding: '1px', // 内边距
    width: '60px', // 宽度
    borderRadius: '3px', // 圆角
  };

  const labelStyle: Partial<VCSSStyleDeclaration> = {
    horizontalAlign: 'center', // 居中
    fontSize: '16px', // 字体大小
    letterSpacing: '-1px', // 字体间距
  };

  return (
    <Button style={buttonStyle} onactivate={toggleCollapse} className="PlayButton">
      <Label style={labelStyle} text={$.Localize(textToken)} />
    </Button>
  );
};

export default ExpandButton;
