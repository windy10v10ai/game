import React, { useEffect, useState } from 'react';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import LotteryAbilityItem from './LotteryAbilityItem';
import { LotteryDto } from '../../../../common/dto/lottery';

// type item or ability
export type ItemOrAbility = 'item' | 'ability';

interface ItemOrAbilityRowProps {
  data: { name: string; displayName: string }[];
  type: ItemOrAbility;
}

const ItemOrAbilityList: React.FC<ItemOrAbilityRowProps> = ({ data, type }) => {
  // const [pickName, setPickName] = useState<string | undefined>(undefined);
  // 从nettable中获取数据
  const nettableName = type === 'item' ? 'lottery_items' : 'lottery_abilities';
  const steamAccountId = GetLocalPlayerSteamAccountID();
  const getLotteryData = () => {
    if (type === 'item') {
      const rawData = CustomNetTables.GetTableValue(nettableName, steamAccountId);
      if (rawData) {
        return Object.values(rawData);
      }
    }
    return null;
  };

  const [lotteryData, setLotteryData] = useState<LotteryDto[] | null>(getLotteryData());

  // 监听nettable数据变化
  useEffect(() => {
    const listenerId = CustomNetTables.SubscribeNetTableListener(
      nettableName,
      (tableName, key, value) => {
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
