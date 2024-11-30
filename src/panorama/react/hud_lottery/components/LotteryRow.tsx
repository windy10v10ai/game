import React, { useEffect, useState } from 'react';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import LotteryAbilityItem from './LotteryAbilityItem';
import { LotteryDto } from '../../../../common/dto/lottery';
import RefreshButton from './RefreshButton';

export type ItemOrAbility = 'item' | 'ability';

interface LotteryRowProps {
  type: ItemOrAbility;
}

const rowStyle: Partial<VCSSStyleDeclaration> = {
  // 位置
  padding: '10px',
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
  const nettableName = type === 'item' ? 'lottery_items' : 'lottery_abilities';
  const steamAccountId = GetLocalPlayerSteamAccountID();
  const getLotteryData = () => {
    const rawData = CustomNetTables.GetTableValue(nettableName, steamAccountId);
    if (rawData) {
      return Object.values(rawData);
    }
    return null;
  };
  const [lotteryData, setLotteryData] = useState<LotteryDto[] | null>(getLotteryData());

  // 监听nettable数据变化
  useEffect(() => {
    const listenerId = CustomNetTables.SubscribeNetTableListener(
      nettableName,
      (_tableName, key, value) => {
        if (key === steamAccountId && value) {
          setLotteryData(Object.values(value));
        }
      },
    );

    return () => {
      CustomNetTables.UnsubscribeNetTableListener(listenerId);
    };
  }, [nettableName, steamAccountId]);

  // 标题
  const titleToken = type === 'item' ? '#lottery_item_title' : '#lottery_ability_title';

  return (
    <Panel style={rowStyle}>
      <Label style={titleStyle} text={$.Localize(titleToken)} />
      <Panel style={{ flowChildren: 'right' }}>
        {lotteryData && (
          <>
            {lotteryData.map((lotteryDto) => (
              <LotteryAbilityItem
                key={lotteryDto.name}
                level={lotteryDto.level}
                name={lotteryDto.name}
                type={type}
              />
            ))}
          </>
        )}
        <RefreshButton type={type} />
      </Panel>
    </Panel>
  );
};

export default LotteryRow;
