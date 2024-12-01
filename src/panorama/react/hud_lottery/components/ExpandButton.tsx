import React from 'react';

interface ExpandButtonProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const ExpandButton: React.FC<ExpandButtonProps> = ({ isCollapsed, toggleCollapse }) => {
  const buttonStyle: Partial<VCSSStyleDeclaration> = {
    horizontalAlign: 'center',
    marginTop: '60px',
    padding: '5px', // 内边距
    width: '100px', // 宽度
    borderRadius: '5px', // 圆角
  };

  const labelStyle: Partial<VCSSStyleDeclaration> = {
    horizontalAlign: 'center', // 居中
    fontSize: '20px', // 字体大小
  };

  const textToken = isCollapsed ? '#lottery_expand' : '#lottery_collapsed';

  return (
    <Button style={buttonStyle} onactivate={toggleCollapse} className="PlayButton">
      <Label style={labelStyle} text={$.Localize(textToken)} />
    </Button>
  );
};

export default ExpandButton;
