interface PrimaryButtonProps {
  label: string;
  enabled?: boolean;
  className?: string;
  onClick: () => void;
  tooltipText?: string;
}

/**
 * 通用主操作按钮：蓝紫渐变，与会员订阅按钮同色系（shared/styles/buttons.less 的 .btn-primary）。
 * className 用于叠加业务侧的尺寸/定位，不覆盖配色。
 */
export function PrimaryButton({
  label,
  enabled = true,
  className,
  onClick,
  tooltipText,
}: PrimaryButtonProps) {
  const buttonClass = className ? `btn-primary ${className}` : 'btn-primary';

  return (
    <Button
      className={buttonClass}
      enabled={enabled}
      onactivate={onClick}
      onmouseover={(panel) =>
        tooltipText && $.DispatchEvent('DOTAShowTextTooltip', panel, tooltipText)
      }
      onmouseout={() => tooltipText && $.DispatchEvent('DOTAHideTextTooltip')}
    >
      <Label className="btn-primary-label" text={label} />
    </Button>
  );
}
