import React, { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'disabled' | 'close';

interface AppButtonProps {
  variant?: ButtonVariant;
  text?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

/**
 * 通用按钮。样式由 shared/styles/buttons.less 中的 class 提供。
 *
 * 用法：
 *   <AppButton variant="primary" text="确认" onClick={...} />
 *   <AppButton variant="ghost"><Label text="自定义内容" /></AppButton>
 *
 * 命名为 AppButton 是为了避免与 Panorama 内置 <Button> 同名。
 */
export function AppButton({
  variant = 'primary',
  text,
  onClick,
  disabled = false,
  className = '',
  children,
}: AppButtonProps) {
  const effectiveVariant: ButtonVariant = disabled ? 'disabled' : variant;
  const classes = `btn-${effectiveVariant} ${className}`.trim();

  return (
    <Button className={classes} onactivate={disabled ? undefined : onClick}>
      {children ?? (text != null ? <Label text={text} /> : null)}
    </Button>
  );
}
