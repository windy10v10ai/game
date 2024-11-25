import React, { useState } from 'react';
import { GetLocalPlayerSteamAccountID } from '../../../utils';
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
  const steamAccountId = GetLocalPlayerSteamAccountID();
  const getLotteryData = () => {
    const data = CustomNetTables.GetTableValue('lottery', steamAccountId);
    return data;
  };

  const [lotteryData, setlotteryData] = useState<NetworkedData<LotteryDto> | null>(
    getLotteryData(),
  );

  // TODO 监听nettable数据变化

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

      {type === 'item' && lotteryData?.itemNamesNormal && (
        <>
          {$.Msg('lotteryData.itemNamesNormal', lotteryData.itemNamesNormal)}
          {$.Msg('lotteryData.itemNamesNormal', Object.values(lotteryData.itemNamesNormal))}
          <Panel style={{ flowChildren: 'right' }}>
            {Object.values(lotteryData.itemNamesNormal).map((item, index) => (
              <Panel key={index} className={'Item'}>
                <DOTAItemImage itemname={item} />
              </Panel>
            ))}
          </Panel>
        </>
      )}
    </Panel>
  );
};

export default ItemOrAbilityList;
