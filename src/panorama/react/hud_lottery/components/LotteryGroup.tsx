import React, { useEffect, useState } from 'react';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import LotteryAbilityItem from './LotteryAbilityItem';
import { LotteryDto } from '../../../../common/dto/lottery';
import RefreshButton from './RefreshButton';

export type ItemOrAbility = 'item' | 'ability';

interface ItemOrAbilityRowProps {
  type: ItemOrAbility;
}

const ItemOrAbilityList: React.FC<ItemOrAbilityRowProps> = ({ type }) => {
  // 初始化 从nettable中获取数据
  const nettableName = type === 'item' ? 'lottery_items' : 'lottery_abilities';
  const labelText = type === 'item' ? '物品' : '技能';
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

  return (
    <Panel style={{ flowChildren: 'right' }}>
      <Label className="ProjectName" text={labelText} />
      {lotteryData && (
        <>
          <Panel style={{ flowChildren: 'right' }}>
            {lotteryData.map((lotteryDto) => (
              <LotteryAbilityItem
                key={lotteryDto.name}
                level={lotteryDto.level}
                name={lotteryDto.name}
                type={type}
              />
            ))}
          </Panel>
        </>
      )}
      <RefreshButton type={type} />
    </Panel>
  );
};

export default ItemOrAbilityList;
