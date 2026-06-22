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
  marginLeft: '10px',
  marginRight: '10px',
  flowChildren: 'right',
  horizontalAlign: 'center',
  verticalAlign: 'center',
};

const abilityStyle: Partial<VCSSStyleDeclaration> = {
  width: '80px',
  margin: '2px 10px',
};

const progressTrackStyle: Partial<VCSSStyleDeclaration> = {
  width: '100%',
  height: '10px',
  marginTop: '8px',
  marginBottom: '8px',
  marginLeft: '12px',
  marginRight: '12px',
  borderRadius: '5px',
  horizontalAlign: 'center',
  backgroundColor: '#000000aa',
};

const progressFillStyle: Partial<VCSSStyleDeclaration> = {
  height: '100%',
  borderRadius: '5px',
  backgroundColor: 'gradient( linear, 0% 0%, 100% 0%, from( #0A4088ff ), to( #609AE0ff ) )',
};

const getTierColor = (level: number): string => {
  const map: Record<number, string> = {
    1: colors.tier1,
    2: colors.tier2,
    3: colors.tier3,
    4: colors.tier4,
    5: colors.tier5,
  };
  return map[level] ?? colors.tier1;
};

function pickAbility(candidate: LotteryDto) {
  GameEvents.SendCustomGameEventToServer('lottery_pick_passive_tome', {
    name: candidate.name,
    level: candidate.level,
  });
}

function PassiveTomeLottery() {
  const playerId = Game.GetLocalPlayerID().toString();
  const raw = useNetTable('lottery_passive_tome', playerId);

  // TSTL array 经 net 同步为 object，转回数组
  const candidates: LotteryDto[] = raw?.candidates
    ? (Object.values(raw.candidates) as LotteryDto[])
    : [];

  const [remaining, setRemaining] = useState(EXPIRE_SECONDS);

  // 新一组 candidates 出现 → 渲染期同步重置倒计时，避免 effect 内 setState 多触发一次渲染
  const [prevRaw, setPrevRaw] = useState(raw);
  if (raw !== prevRaw) {
    setPrevRaw(raw);
    setRemaining(EXPIRE_SECONDS);
  }

  useEffect(() => {
    if (candidates.length === 0) return undefined;
    const startTime = Game.GetGameTime();
    const id = setInterval(() => {
      const left = Math.max(0, EXPIRE_SECONDS - (Game.GetGameTime() - startTime));
      setRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        const randIndex = Math.floor(Math.random() * candidates.length);
        pickAbility(candidates[randIndex]);
      }
    }, TICK_INTERVAL_MS);
    return () => clearInterval(id);
    // 依赖 raw 引用变化（新一轮抽奖换组）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);

  const progressPct = Math.max(0, Math.min(100, (remaining / EXPIRE_SECONDS) * 100));
  const isOpen = candidates.length > 0;

  return (
    <Panel
      className="passive-tome-lottery-container"
      style={{ ...containerStyle, visibility: isOpen ? 'visible' : 'collapse' }}
      hittest={true}
    >
      <Label style={titleStyle} text={$.Localize('#lottery_passive_tome_header')} />
      <Panel style={rowStyle}>
        {candidates.map((c, i) => (
          <DOTAAbilityImage
            key={`passive-tome-lottery-${i}-${c.name}`}
            abilityname={c.name}
            showtooltip={true}
            onactivate={() => pickAbility(c)}
            className={c.level === 5 ? 'BrightHover rainbow-glow' : 'BrightHover'}
            style={{
              ...abilityStyle,
              boxShadow: c.level === 5 ? undefined : `0 0 5px ${getTierColor(c.level)}`,
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

export default PassiveTomeLottery;
