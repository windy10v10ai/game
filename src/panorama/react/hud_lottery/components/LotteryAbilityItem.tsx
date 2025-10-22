import React from 'react';
import { colors } from '@utils/colors';
import { AbilityItemType } from '../../../../common/dto/lottery';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import { GetLotteryStatus } from '@utils/net-table';
interface LotteryAbilityItemProps {
  level: number;
  name: string;
  type: AbilityItemType;
  pickedAbilityName: string | undefined;
  sourceTable?: string; // 添加这个字段
}
const itemStyle = {
  width: '80px',
  flowChildren: 'down',
  margin: '20px',
};

const getBoxColor = (level: number) => {
  switch (level) {
    case 1:
      return colors.tier1;
    case 2:
      return colors.tier2;
    case 3:
      return colors.tier3;
    case 4:
      return colors.tier4;
    case 5:
      return colors.tier5;
    default:
      return colors.tier1;
  }
};

const LotteryAbilityItem: React.FC<LotteryAbilityItemProps> = ({
  level,
  name,
  type,
  pickedAbilityName,
  sourceTable,
}) => {
  const steamAccountId = GetLocalPlayerSteamAccountID();
  const lotteryStatus = GetLotteryStatus(steamAccountId);

  const isResetMode = lotteryStatus?.isSkillResetMode === true;

  // 关键修改:只有来自上排的技能才是当前技能
  const isCurrentAbility = isResetMode && sourceTable === 'lottery_active_abilities';

  const imageStyle = {
    boxShadow: `0 0 5px ${getBoxColor(level)}`,
    borderRadius: '5px',
  };

  const handleClick = () => {
    $.Msg('=== Click Debug Info ===');
    $.Msg('Ability name: ' + name);
    $.Msg('isResetMode: ' + isResetMode);
    $.Msg('sourceTable: ' + sourceTable);
    $.Msg('isCurrentAbility: ' + isCurrentAbility);
    $.Msg('=======================');

    if (isResetMode) {
      if (isCurrentAbility) {
        $.Msg('[Lottery] Removing current ability: ' + name);
        GameEvents.SendCustomGameEventToServer('skill_reset_remove', {
          name,
          type,
          level,
        });
      } else {
        $.Msg('[Lottery] Selecting new ability: ' + name);
        GameEvents.SendCustomGameEventToServer('skill_reset_pick', {
          name,
          type,
          level,
        });
      }
    } else {
      GameEvents.SendCustomGameEventToServer('lottery_pick_ability', {
        name,
        type,
        level,
      });
    }
  };

  const showtooltip = true;
  let className = 'BrightHover';

  if (isCurrentAbility) {
    className = 'Bright';
  } else if (pickedAbilityName === name) {
    className = 'Bright';
  } else if (pickedAbilityName) {
    className = 'Darker';
  }

  return (
    <Panel style={itemStyle} onactivate={handleClick}>
      <DOTAAbilityImage
        abilityname={name}
        style={imageStyle}
        showtooltip={showtooltip}
        className={className}
      />
    </Panel>
  );
};

export default LotteryAbilityItem;
