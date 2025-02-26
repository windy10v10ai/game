import React, { useEffect, useState } from 'react';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import LotteryAbilityItem from './LotteryAbilityItem';
import { AbilityItemType, LotteryDto } from '../../../../common/dto/lottery';
import RefreshButton from './RefreshButton';
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

const rowStyle: Partial<VCSSStyleDeclaration> = {
  // 位置
  padding: '5px',
  horizontalAlign: 'center',
  verticalAlign: 'center',
  flowChildren: 'down',
};

const titleStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'center', // 标题居中
  fontSize: '24px',
  color: 'gradient(linear, 0% 0%, 0% 100%, from(#FFFFFF), color-stop(0.6, #FFE982), to(#CA8E25))',

  textOverflow: 'shrink',
  textAlign: 'center',
  fontWeight: 'bold', // 粗体
};

const LotteryRow: React.FC<LotteryRowProps> = ({ type }) => {
  // 初始化 从nettable中获取数据
  const lotteryDataTableName =
    type === 'abilityActive' ? 'lottery_active_abilities' : 'lottery_passive_abilities';
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

  // 标题
  const titleToken =
    type === 'abilityActive' ? '#lottery_active_ability_title' : '#lottery_passive_ability_title';
  const pickedName =
    type === 'abilityActive' ? lotteryStatus?.activeAbilityName : lotteryStatus?.passiveAbilityName;

  return (
    <Panel style={rowStyle}>
      <Label style={titleStyle} text={$.Localize(titleToken)} />
      <Panel style={{ flowChildren: 'right' }}>
        {lotteryData && (
          <>
            {lotteryData.map((lotteryDto, index) => (
              <LotteryAbilityItem
                key={`${type}-${index}`}
                level={lotteryDto.level}
                name={lotteryDto.name}
                type={type}
                pickedName={pickedName}
              />
            ))}
          </>
        )}
        <RefreshButton type={type} lotteryStatus={lotteryStatus} member={member} />
      </Panel>
    </Panel>
  );
};

export default LotteryRow;
