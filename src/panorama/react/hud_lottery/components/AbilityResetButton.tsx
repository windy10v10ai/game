import React from 'react';
import { LotteryStatusDto } from '../../../../common/dto/lottery-status';
import { AbilityItemType } from '../../../../common/dto/lottery';

interface AbilityResetButtonProps {
  type: AbilityItemType;
  lotteryStatus: LotteryStatusDto | null;
}

const buttonStyle: Partial<VCSSStyleDeclaration> = {
  padding: '1px',
  width: '60px',
  borderRadius: '3px',
  horizontalAlign: 'center',
  verticalAlign: 'center',
  marginRight: '10px',
};

const labelStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'center',
  verticalAlign: 'center',
  fontSize: '16px',
  letterSpacing: '-1px',
};

const getPickedName = (type: AbilityItemType, lotteryStatus: LotteryStatusDto | null) => {
  if (type === 'abilityActive') {
    return lotteryStatus?.activeAbilityName;
  }
  if (type === 'abilityPassive') {
    return lotteryStatus?.passiveAbilityName;
  }
  if (type === 'abilityPassive2') {
    return lotteryStatus?.passiveAbilityName2;
  }
  return undefined;
};

const AbilityResetButton: React.FC<AbilityResetButtonProps> = ({ type, lotteryStatus }) => {
  const pickedName = getPickedName(type, lotteryStatus);

  // 开局未初始化重选次数，不显示按钮
  if (!lotteryStatus?.showAbilityResetButton) {
    return null;
  }
  const hasResetCount = lotteryStatus.abilityResettableCount > 0;

  // 只有当有重选次数且该行已选择技能时才显示按钮
  const enabled = !!hasResetCount && !!pickedName;

  // 提示文本
  const getTooltipText = () => {
    if (!hasResetCount) {
      return $.Localize('#lottery_tooltip_ability_reset_no_count');
    }
    if (!pickedName) {
      return $.Localize('#lottery_tooltip_ability_reset_not_picked');
    }
    return $.Localize('#lottery_tooltip_ability_reset_enable');
  };

  const handleButtonClick = () => {
    if (!enabled) {
      $.Msg('[AbilityResetButton] Button is disabled');
      return;
    }

    GameEvents.SendCustomGameEventToServer('lottery_reset_ability', {
      type,
    });
  };

  return (
    <Button
      onactivate={handleButtonClick}
      style={buttonStyle}
      onmouseover={(panel) => {
        const tooltipText = getTooltipText();
        $.DispatchEvent('DOTAShowTextTooltip', panel, tooltipText);
      }}
      onmouseout={() => $.DispatchEvent('DOTAHideTextTooltip')}
      className={enabled ? 'PlayButton' : 'PlayButtonDisabled'}
      enabled={enabled}
    >
      <Label style={labelStyle} text={$.Localize('#lottery_button_ability_reset')} />
    </Button>
  );
};

export default AbilityResetButton;
