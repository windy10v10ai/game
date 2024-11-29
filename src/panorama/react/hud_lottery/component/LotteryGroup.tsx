import React, { useEffect, useState } from 'react';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import LotteryAbilityItem from './LotteryAbilityItem';
import { LotteryDto } from '../../../../common/dto/lottery';

export type ItemOrAbility = 'item' | 'ability';

interface ItemOrAbilityRowProps {
  type: ItemOrAbility;
}

const ItemOrAbilityList: React.FC<ItemOrAbilityRowProps> = ({ type }) => {
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

  return (
    <Panel style={{ flowChildren: 'right' }}>
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
    </Panel>
  );
};

export default ItemOrAbilityList;
