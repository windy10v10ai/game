import React, { ReactNode } from 'react';

interface ModalProps {
  title?: string;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * 通用全屏模态容器（页面级，例如 home / shop）。
 * 样式由 shared/styles/dialog.less 提供（modal-backdrop / modal-panel / modal-header / modal-title / btn-close）。
 */
export function Modal({ title, onClose, children, className = '' }: ModalProps) {
  return (
    <Panel className="modal-backdrop">
      <Panel className={`modal-panel ${className}`.trim()}>
        {(title || onClose) && (
          <Panel className="modal-header">
            {title && <Label className="modal-title" text={title} />}
            {onClose && <Button className="btn-close" onactivate={onClose} />}
          </Panel>
        )}
        {children}
      </Panel>
    </Panel>
  );
}
