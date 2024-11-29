import React, { useEffect, useState } from 'react';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import LotteryAbilityItem from './LotteryAbilityItem';

// type item or ability
export type ItemOrAbility = 'item' | 'ability';

interface ItemOrAbilityRowProps {
  data: { name: string; displayName: string }[];
  type: ItemOrAbility;
}

const ItemOrAbilityList: React.FC<ItemOrAbilityRowProps> = ({ data, type }) => {
  // const [pickName, setPickName] = useState<string | undefined>(undefined);
  // 从nettable中获取数据
  const steamAccountId = GetLocalPlayerSteamAccountID();
  const getLotteryData = () => {
    if (type === 'item') {
      $.Msg('getLotteryData of ', steamAccountId);
      const data = CustomNetTables.GetTableValue('lottery_items', steamAccountId);
      return data;
    }
    return null;
  };

  const [lotteryData, setLotteryData] = useState<NetworkedData<string[]> | null>(getLotteryData());

  // 监听nettable数据变化
  useEffect(() => {
    const listenerId = CustomNetTables.SubscribeNetTableListener(
      'lottery_items',
      (tableName, key, value) => {
        if (key === steamAccountId) {
          setLotteryData(value);
        }
      },
    );

    return () => {
      CustomNetTables.UnsubscribeNetTableListener(listenerId);
    };
  }, [steamAccountId]);

  return (
    <Panel style={{ flowChildren: 'right' }}>
      {type === 'ability' &&
        data.map((item, index) => (
          <Panel
            key={index}
            className={'Item'}
            style={index >= 3 ? { boxShadow: '0 0 5px #ffd700' } : { boxShadow: '0 0 5px #a029af' }}
          >
            <DOTAAbilityImage abilityname={item.name} />
            <Label text={steamAccountId} />
          </Panel>
        ))}

      {type === 'item' && lotteryData && (
        <>
          {$.Msg('lotteryData raw', lotteryData)}
          {$.Msg('lotteryData Object', Object.values(lotteryData))}
          <Panel style={{ flowChildren: 'right' }}>
            {Object.values(lotteryData).map((itemName, index) => (
              // TODO 获取物品的tier
              <LotteryAbilityItem level={index + 1} name={itemName} type={type} />
            ))}
          </Panel>
        </>
      )}
    </Panel>
  );
};

export default ItemOrAbilityList;
