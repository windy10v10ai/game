import React, { ReactNode } from 'react';

interface DialogProps {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}

/**
 * 通用对话框（小尺寸，用于 confirm / alert / 简单表单）。
 * 渲染时通常被 DialogStack 包在 modal-backdrop 中。
 */
export function Dialog({ title, children, actions }: DialogProps) {
  return (
    <Panel className="dialog-panel">
      {title && <Label className="dialog-title" text={title} />}
      <Panel className="dialog-body">{children}</Panel>
      {actions && <Panel className="dialog-actions">{actions}</Panel>}
    </Panel>
  );
}
