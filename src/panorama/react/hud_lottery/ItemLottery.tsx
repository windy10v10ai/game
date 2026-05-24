import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';
import React, { useEffect, useState } from 'react';
import { LotteryDto } from '../../../common/dto/lottery';
import { useNetTable } from '../shared/hooks/useNetTable';
import { colors } from './colors';

const EXPIRE_SECONDS = 12;
const TICK_INTERVAL_MS = 100;

const containerStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'center',
  verticalAlign: 'bottom',
  marginBottom: '250px',
  flowChildren: 'down',
};

const titleStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'center',
  marginTop: '8px',
  marginLeft: '12px',
  marginRight: '12px',
  fontSize: '20px',
  color: 'gradient(linear, 0% 0%, 0% 100%, from(#FFFFFF), color-stop(0.6, #FFE982), to(#CA8E25))',
  fontWeight: 'bold',
  textShadow: '1px 1px 8px 3.0 #000000FF',
};

const rowStyle: Partial<VCSSStyleDeclaration> = {
  marginTop: '8px',
  marginLeft: '6px',
  marginRight: '6px',
  flowChildren: 'right',
  horizontalAlign: 'center',
};

const itemStyle: Partial<VCSSStyleDeclaration> = {
  // DOTAItemImage 原生 88x64 比例，只设 height 让宽度自适应避免上下黑边
  height: '56px',
  margin: '2px 6px',
};

const progressTrackStyle: Partial<VCSSStyleDeclaration> = {
  width: '300px',
  height: '10px',
  marginTop: '8px',
  marginBottom: '8px',
  marginLeft: '8px',
  marginRight: '8px',
  borderRadius: '5px',
  horizontalAlign: 'center',
  backgroundColor: '#000000aa',
};

const progressFillStyle: Partial<VCSSStyleDeclaration> = {
  height: '100%',
  borderRadius: '5px',
  backgroundColor: 'gradient( linear, 0% 0%, 100% 0%, from( #0A4088ff ), to( #609AE0ff ) )',
};

// tier 颜色用轻发光，不抢戏
const getTierGlow = (level: number): string => {
  const map: Record<number, string> = {
    1: colors.tier1,
    2: colors.tier2,
    3: colors.tier3,
    4: colors.tier4,
    5: colors.tier5,
  };
  return `0 0 2px 1px ${map[level] ?? colors.tier1}`;
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
      className="item-lottery-container"
      style={{ ...containerStyle, visibility: isOpen ? 'visible' : 'collapse' }}
      hittest={true}
    >
      <Label style={titleStyle} text={$.Localize('#lottery_item_header')} />
      <Panel style={rowStyle}>
        {candidates.map((c, i) => (
          <DOTAItemImage
            key={`item-lottery-${i}-${c.name}`}
            itemname={c.name}
            showtooltip={true}
            onactivate={() => pickItem(c)}
            className="BrightHover"
            style={{
              ...itemStyle,
              boxShadow: getTierGlow(c.level),
            }}
          />
        ))}
      </Panel>
      <Panel style={progressTrackStyle}>
        <Panel style={{ ...progressFillStyle, width: `${progressPct}%` }} />
      </Panel>
    </Panel>
  );
}

export default ItemLottery;
