import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';
import React, { useEffect, useState } from 'react';
import { LotteryDto } from '../../../common/dto/lottery';
import { useNetTable } from '../shared/hooks/useNetTable';
import { colors } from './colors';

const EXPIRE_SECONDS = 12;
const TICK_INTERVAL_MS = 100;

const containerStyle: Partial<VCSSStyleDeclaration> = {
  width: '360px',
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

const progressTrackStyle: Partial<VCSSStyleDeclaration> = {
  width: '100%',
  height: '10px',
  marginTop: '10px',
  borderRadius: '5px',
  backgroundColor: '#000000aa',
};

const progressFillStyle: Partial<VCSSStyleDeclaration> = {
  height: '100%',
  borderRadius: '5px',
  backgroundColor: 'gradient( linear, 0% 0%, 100% 0%, from( #0A4088ff ), to( #609AE0ff ) )',
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

function pickItem(candidate: LotteryDto) {
  GameEvents.SendCustomGameEventToServer('lottery_pick_item', {
    name: candidate.name,
    level: candidate.level,
  });
}

function ItemLottery() {
  const playerId = Game.GetLocalPlayerID().toString();
  const raw = useNetTable('lottery_item', playerId);
  // TSTL array 经 net 同步为 object，转回数组
  const candidates: LotteryDto[] = raw ? (Object.values(raw) as LotteryDto[]) : [];

  const [remaining, setRemaining] = useState(EXPIRE_SECONDS);

  // 新一组 candidates 出现 → 重置倒计时
  useEffect(() => {
    if (candidates.length === 0) return undefined;
    setRemaining(EXPIRE_SECONDS);
    const startTime = Game.GetGameTime();
    const id = setInterval(() => {
      const left = Math.max(0, EXPIRE_SECONDS - (Game.GetGameTime() - startTime));
      setRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        const randIndex = Math.floor(Math.random() * candidates.length);
        pickItem(candidates[randIndex]);
      }
    }, TICK_INTERVAL_MS);
    return () => clearInterval(id);
    // 依赖 raw 引用变化（新一轮抽奖）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);

  const progressPct = Math.max(0, Math.min(100, (remaining / EXPIRE_SECONDS) * 100));
  const isOpen = candidates.length > 0;

  return (
    <Panel
      style={{ ...containerStyle, visibility: isOpen ? 'visible' : 'collapse' }}
      hittest={true}
    >
      <Label style={titleStyle} text={$.Localize('#lottery_item_header')} />
      <Panel style={rowStyle}>
        {candidates.map((c, i) => (
          <Panel
            key={`item-lottery-${i}-${c.name}`}
            style={{
              ...itemStyle,
              boxShadow: getBoxShadow(c.level),
            }}
            onactivate={() => pickItem(c)}
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
      <Panel style={progressTrackStyle}>
        <Panel style={{ ...progressFillStyle, width: `${progressPct}%` }} />
      </Panel>
    </Panel>
  );
}

export default ItemLottery;
