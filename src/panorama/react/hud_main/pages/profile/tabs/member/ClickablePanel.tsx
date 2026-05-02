import React, { useRef } from 'react';

interface ClickablePanelProps {
  className: string;
  clickable: boolean;
  tooltipKey: string;
  onActivate: () => void;
  children: React.ReactNode;
}

export function ClickablePanel({
  className,
  clickable,
  tooltipKey,
  onActivate,
  children,
}: ClickablePanelProps) {
  const ref = useRef<Panel | null>(null);
  return (
    <Panel
      ref={ref}
      className={className}
      onactivate={clickable ? onActivate : undefined}
      onmouseover={
        clickable
          ? () =>
              ref.current &&
              $.DispatchEvent('DOTAShowTextTooltip', ref.current, $.Localize(tooltipKey))
          : undefined
      }
      onmouseout={clickable ? () => $.DispatchEvent('DOTAHideTextTooltip') : undefined}
    >
      {children}
    </Panel>
  );
}
