import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';
import React, { useEffect, useState } from 'react';
import { useNetTable } from '../shared/hooks/useNetTable';
import { colors } from './colors';

const TICK_INTERVAL = 0.1; // 秒

const containerStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'center',
  verticalAlign: 'bottom',
  marginBottom: '250px',
  flowChildren: 'down',
  padding: '12px',
  borderRadius: '8px',
  backgroundColor: 'gradient( linear, 0% 0%, 0% 100%, from( #000000b0 ), to( #000000d0 ) )',
  boxShadow: '#000000ff 0px 0px 5px 10px',
};

const titleStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'center',
  fontSize: '20px',
  color: 'gradient(linear, 0% 0%, 0% 100%, from(#FFFFFF), color-stop(0.6, #FFE982), to(#CA8E25))',
  fontWeight: 'bold',
  marginBottom: '8px',
};

const rowStyle: Partial<VCSSStyleDeclaration> = {
  flowChildren: 'right',
  horizontalAlign: 'center',
};

const itemStyle: Partial<VCSSStyleDeclaration> = {
  width: '64px',
  height: '64px',
  marginLeft: '6px',
  marginRight: '6px',
  borderRadius: '4px',
};

const progressStyle: Partial<VCSSStyleDeclaration> = {
  width: '100%',
  height: '10px',
  marginTop: '10px',
  borderRadius: '5px',
  backgroundColor:
    'gradient( linear, 0% 100%, 0% 0%, from( #000000FF ), color-stop(0.1, #0A4088ff ), to( #609AE0ff ) )',
};

const getBoxShadow = (level: number): string => {
  const map: Record<number, string> = {
    1: colors.tier1,
    2: colors.tier2,
    3: colors.tier3,
    4: colors.tier4,
    5: colors.tier5,
  };
  return `0 0 8px ${map[level] ?? colors.tier1}`;
};

function ItemLottery() {
  const playerId = Game.GetLocalPlayerID().toString();
  const dto = useNetTable('item_lottery', playerId);

  const candidates = dto?.candidates
    ? (Object.values(dto.candidates) as { name: string; level: number }[])
    : [];
  const expireAt = (dto?.expireAt as number) ?? 0;
  const pickedIndex = (dto?.pickedIndex as number) ?? -1;

  const [remaining, setRemaining] = useState(0);
  const isOpen = !!dto && pickedIndex < 0 && candidates.length > 0;

  // 倒计时 tick：到 0 自动随机选 1 个
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const tick = () => {
      const left = Math.max(0, expireAt - Game.GetGameTime());
      setRemaining(left);
      if (left <= 0) {
        const randIndex = Math.floor(Math.random() * candidates.length);
        GameEvents.SendCustomGameEventToServer('lottery_pick_item', { index: randIndex });
      }
    };
    tick();
    const id = setInterval(tick, TICK_INTERVAL * 1000);
    return () => clearInterval(id);
    // candidates 长度稳定（4），不必入依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, expireAt]);

  if (!isOpen) {
    return <Panel style={{ visibility: 'collapse' }} />;
  }

  // 与 server 的 ItemLottery.EXPIRE_SECONDS 保持一致
  const EXPIRE_SECONDS = 12;
  const progressPct = Math.max(0, Math.min(100, (remaining / EXPIRE_SECONDS) * 100));

  return (
    <Panel style={containerStyle}>
      <Label style={titleStyle} text={$.Localize('#item_lottery_header')} />
      <Panel style={rowStyle}>
        {candidates.map((c, i) => (
          <Panel
            key={`item-lottery-${i}`}
            style={{
              ...itemStyle,
              boxShadow: getBoxShadow(c.level),
            }}
            onactivate={() => {
              GameEvents.SendCustomGameEventToServer('lottery_pick_item', { index: i });
            }}
            className="BrightHover"
          >
            <DOTAItemImage
              itemname={c.name}
              showtooltip={true}
              style={{ width: '64px', height: '64px', borderRadius: '4px' }}
            />
          </Panel>
        ))}
      </Panel>
      <Panel
        style={{
          ...progressStyle,
          width: `${progressPct}%`,
        }}
      />
    </Panel>
  );
}

export default ItemLottery;
