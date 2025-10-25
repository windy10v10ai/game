import React, { useEffect, useState } from 'react';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import LotteryAbilityItem from './LotteryAbilityItem';
import { AbilityItemType, LotteryDto } from '../../../../common/dto/lottery';
import RefreshButton from './RefreshButton';
import AbilityResetButton from './AbilityResetButton';
import { LotteryStatusDto } from '../../../../common/dto/lottery-status';
import {
  GetLotteryStatus,
  GetMember,
  SubscribeLotteryStatus,
  SubscribeMember,
} from '@utils/net-table';
import { MemberDto } from '../../../../vscripts/api/player';

interface LotteryRowProps {
  type: AbilityItemType;
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

const LotteryRow: React.FC<LotteryRowProps> = ({ type }) => {
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
  const [lotteryStatus, setLotteryStatus] = useState<LotteryStatusDto | null>(
    GetLotteryStatus(steamAccountId),
  );
  const [member, setMember] = useState<MemberDto | null>(GetMember(steamAccountId));

  // 监听nettable数据变化
  useEffect(() => {
    const dataListenerId = CustomNetTables.SubscribeNetTableListener(
      lotteryDataTableName,
      (_tableName, key, value) => {
        if (key === steamAccountId && value) {
          setLotteryData(Object.values(value));
        }
      },
    );

    const statusListenerId = SubscribeLotteryStatus(steamAccountId, (data) => {
      setLotteryStatus(data);
    });
    const memberListenerId = SubscribeMember(steamAccountId, (data) => {
      setMember(data);
    });

    return () => {
      CustomNetTables.UnsubscribeNetTableListener(dataListenerId);
      CustomNetTables.UnsubscribeNetTableListener(statusListenerId);
      CustomNetTables.UnsubscribeNetTableListener(memberListenerId);
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
      <RefreshButton type={type} lotteryStatus={lotteryStatus} member={member} />
    </Panel>
  );
};

export default LotteryRow;
