import React, { useEffect, useState } from 'react';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import LotteryAbilityItem from './LotteryAbilityItem';
import { AbilityItemType, LotteryDto } from '../../../../common/dto/lottery';
import RefreshButton from './RefreshButton';
import AbilityResetButton from './AbilityResetButton';
import { useNetTable } from '../../shared/hooks/useNetTable';

interface LotteryRowProps {
  type: AbilityItemType;
  onOpenMember?: () => void;
}

// lotteryDataTableName function
const getLotteryDataTableName = (type: AbilityItemType) => {
  if (type === 'abilityActive') {
    return 'lottery_active_abilities';
  } else if (type === 'abilityPassive') {
    return 'lottery_passive_abilities';
  } else {
    return 'lottery_passive_abilities_2';
  }
};

const LotteryRow: React.FC<LotteryRowProps> = ({ type, onOpenMember }) => {
  // 初始化 从nettable中获取数据
  const lotteryDataTableName = getLotteryDataTableName(type);
  const steamAccountId = GetLocalPlayerSteamAccountID();
  const getLotteryData = () => {
    const rawData = CustomNetTables.GetTableValue(lotteryDataTableName, steamAccountId);
    if (rawData) {
      return Object.values(rawData);
    }
    return null;
  };

  const [lotteryData, setLotteryData] = useState<LotteryDto[] | null>(getLotteryData());
  const lotteryStatus = useNetTable('lottery_status', steamAccountId);
  const player = useNetTable('player_table', steamAccountId);
  const member = player?.member ?? null;

  // 监听抽奖数据变化（lotteryDataTableName 为动态 key，无法直接走 useNetTable）
  useEffect(() => {
    const dataListenerId = CustomNetTables.SubscribeNetTableListener(
      lotteryDataTableName,
      (_tableName, key, value) => {
        if (key === steamAccountId && value) {
          setLotteryData(Object.values(value));
        }
      },
    );
    return () => {
      CustomNetTables.UnsubscribeNetTableListener(dataListenerId);
    };
  }, [lotteryDataTableName, steamAccountId]);

  const pickedAbilityName =
    type === 'abilityActive'
      ? lotteryStatus?.activeAbilityName
      : type === 'abilityPassive'
        ? lotteryStatus?.passiveAbilityName
        : lotteryStatus?.passiveAbilityName2;

  return (
    <Panel style={{ flowChildren: 'right' }}>
      <AbilityResetButton type={type} lotteryStatus={lotteryStatus} />
      {lotteryData && (
        <>
          {lotteryData.map((lotteryDto, index) => (
            <LotteryAbilityItem
              key={`${type}-${index}`}
              level={lotteryDto.level}
              name={lotteryDto.name}
              type={type}
              pickedAbilityName={pickedAbilityName}
            />
          ))}
        </>
      )}
      <RefreshButton
        type={type}
        lotteryStatus={lotteryStatus}
        member={member}
        onOpenMember={onOpenMember}
      />
    </Panel>
  );
};

export default LotteryRow;
