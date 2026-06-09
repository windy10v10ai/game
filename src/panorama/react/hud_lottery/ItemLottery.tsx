import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';
import React, { useEffect, useRef, useState } from 'react';
import { LotteryDto } from '../../../common/dto/lottery';
import { useNetTable } from '../shared/hooks/useNetTable';
import { isPremiumMember } from '../shared/utils/member';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import { colors } from './colors';

const EXPIRE_SECONDS = 12;
const TICK_INTERVAL_MS = 100;
const PAID_REFRESH_COSTS = [10, 20, 30, 50];
const MAX_PAID_REFRESH_COUNT = 5;

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

const itemStyle: Partial<VCSSStyleDeclaration> = {
  // DOTAItemImage 原生 88x64 比例，只设 height 让宽度自适应避免上下黑边
  height: '56px',
  margin: '2px 6px',
};

const refreshButtonStyle: Partial<VCSSStyleDeclaration> = {
  marginLeft: '5px',
  marginRight: '5px',
  verticalAlign: 'center',
};

const refreshImageStyle: Partial<VCSSStyleDeclaration> = {
  width: '40px',
  height: '40px',
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

// tier 颜色用轻发光，不抢戏
const getTierGlow = (level: number): string => {
  const map: Record<number, string> = {
    1: colors.tier1,
    2: colors.tier2,
    3: colors.tier3,
    4: colors.tier4,
    5: colors.tier5,
    6: colors.tier5,
    7: colors.tier5,
  };
  return `0 0 2px 1px ${map[level] ?? colors.tier1}`;
};

const getPaidRefreshCost = (paidCount: number) =>
  PAID_REFRESH_COSTS[Math.min(paidCount, PAID_REFRESH_COSTS.length - 1)];

function pickItem(candidate: LotteryDto) {
  GameEvents.SendCustomGameEventToServer('lottery_pick_item', {
    name: candidate.name,
    level: candidate.level,
  });
}

interface RefreshIconButtonProps {
  isPremium: boolean;
  isRefreshed: boolean;
  paidRefreshCount: number;
  useableMemberPoint: number;
}

function RefreshIconButton({
  isPremium,
  isRefreshed,
  paidRefreshCount,
  useableMemberPoint,
}: RefreshIconButtonProps) {
  const remainingPaidRefreshCount = Math.max(0, MAX_PAID_REFRESH_COUNT - paidRefreshCount);
  const isPaidRefreshLimitReached = isRefreshed && remainingPaidRefreshCount <= 0;
  const nextCost = isRefreshed ? getPaidRefreshCost(paidRefreshCount) : 0;
  const canAfford = useableMemberPoint >= nextCost;
  const guideToMember = !isPremium || (isRefreshed && !isPaidRefreshLimitReached && !canAfford);
  const canRefresh = isPremium && canAfford && !isPaidRefreshLimitReached;
  const imageSrc = canRefresh
    ? 'file://{images}/custom_game/lottery/icon_rerolltoken.png'
    : 'file://{images}/custom_game/lottery/icon_rerolltoken_disabled.png';

  const getTooltipText = () => {
    if (!isPremium) {
      return $.Localize('#lottery_tooltip_item_refresh_not_premium');
    }
    if (!isRefreshed) {
      return $.Localize('#lottery_tooltip_item_refresh');
    }
    if (isPaidRefreshLimitReached) {
      return $.Localize('#lottery_tooltip_item_refresh_limit');
    }
    if (!canAfford) {
      return $.Localize('#lottery_tooltip_item_refresh_insufficient');
    }
    return $.Localize('#lottery_tooltip_item_refresh_paid')
      .replace('{cost}', nextCost.toString())
      .replace('{remaining}', remainingPaidRefreshCount.toString());
  };

  const tooltipText = getTooltipText();
  const hoverPanelRef = useRef<Panel | null>(null);

  useEffect(() => {
    if (hoverPanelRef.current) {
      $.DispatchEvent('DOTAShowTextTooltip', hoverPanelRef.current, tooltipText);
    }
  }, [tooltipText]);

  const handleClick = () => {
    if (guideToMember) {
      const param = isPremium && !canAfford ? 'member:points' : 'member';
      GameEvents.SendCustomGameEventToAllClients('hud_open_page', {
        page: 'profile',
        param,
        playerId: Game.GetLocalPlayerID(),
      });
      return;
    }
    if (isPaidRefreshLimitReached) {
      return;
    }
    GameEvents.SendCustomGameEventToServer('lottery_refresh_item', {});
  };

  return (
    <Button
      onactivate={handleClick}
      style={refreshButtonStyle}
      onmouseover={(panel) => {
        hoverPanelRef.current = panel;
        $.DispatchEvent('DOTAShowTextTooltip', panel, tooltipText);
      }}
      onmouseout={() => {
        hoverPanelRef.current = null;
        $.DispatchEvent('DOTAHideTextTooltip');
      }}
    >
      <Image src={imageSrc} style={refreshImageStyle} />
    </Button>
  );
}

function ItemLottery() {
  const playerId = Game.GetLocalPlayerID().toString();
  const steamAccountId = GetLocalPlayerSteamAccountID();
  const raw = useNetTable('lottery_item', playerId);
  const player = useNetTable('player_table', steamAccountId);

  // TSTL array 经 net 同步为 object，转回数组
  const candidates: LotteryDto[] = raw?.candidates
    ? (Object.values(raw.candidates) as LotteryDto[])
    : [];
  // 引擎把 boolean 同步为 0/1
  const isRefreshed = Boolean(raw?.isRefreshed);
  const paidRefreshCount = raw?.paidRefreshCount ?? 0;

  const isPremium = isPremiumMember(player?.member);
  const useableMemberPoint = player?.useableMemberPoint ?? 0;

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
    // 依赖 raw 引用变化（新一轮抽奖 / 刷新换组）
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
        <RefreshIconButton
          isPremium={isPremium}
          isRefreshed={isRefreshed}
          paidRefreshCount={paidRefreshCount}
          useableMemberPoint={useableMemberPoint}
        />
      </Panel>
      <Panel style={progressTrackStyle}>
        <Panel style={{ ...progressFillStyle, width: `${progressPct}%` }} />
      </Panel>
    </Panel>
  );
}

export default ItemLottery;
