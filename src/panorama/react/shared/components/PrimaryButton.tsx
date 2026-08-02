interface PrimaryButtonProps {
  label: string;
  enabled?: boolean;
  className?: string;
  onClick: () => void;
  tooltipText?: string;
  // 'gold' 用于与 'primary' 蓝紫渐变区分的第二种货币/强调场景（shared/styles/buttons.less 的 .btn-gold）
  variant?: 'primary' | 'gold';
  // label 中需要 <br> 固定断行位置时开启，默认纯文本渲染
  html?: boolean;
}

/**
 * 通用主操作按钮：默认蓝紫渐变，与会员订阅按钮同色系（shared/styles/buttons.less 的 .btn-primary）。
 * className 用于叠加业务侧的尺寸/定位，不覆盖配色；配色只通过 variant 切换。
 */
export function PrimaryButton({
  label,
  enabled = true,
  className,
  onClick,
  tooltipText,
  variant = 'primary',
  html = false,
}: PrimaryButtonProps) {
  const variantClass = variant === 'gold' ? 'btn-gold' : 'btn-primary';
  const buttonClass = className ? `${variantClass} ${className}` : variantClass;

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
      <Label className="btn-primary-label" html={html} text={label} />
    </Button>
  );
}
