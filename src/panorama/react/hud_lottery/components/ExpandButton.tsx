import React from 'react';

interface ExpandButtonProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const ExpandButton: React.FC<ExpandButtonProps> = ({ isCollapsed, toggleCollapse }) => {
  const buttonStyle: Partial<VCSSStyleDeclaration> = {
    horizontalAlign: 'center',
    marginTop: '80px',
    padding: '5px', // 内边距
    width: '100px', // 宽度
    borderRadius: '5px', // 圆角
  };

  const labelStyle: Partial<VCSSStyleDeclaration> = {
    horizontalAlign: 'center', // 居中
    fontSize: '20px', // 字体大小
  };

  return (
    <Button style={buttonStyle} onactivate={toggleCollapse} className="button-play">
      <Label style={labelStyle} text={isCollapsed ? '显示' : '隐藏'} />
    </Button>
  );
};

export default ExpandButton;
