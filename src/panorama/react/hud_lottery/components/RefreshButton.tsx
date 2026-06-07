import React, { useEffect, useRef } from 'react';
import { LotteryStatusDto } from '../../../../common/dto/lottery-status';
import { MemberDto } from '../../../../vscripts/api/player';
import { AbilityItemType } from '../../../../common/dto/lottery';
import { isMemberActive } from '../../shared/utils/member';

// 与后端 ability-lottery.ts paidRefreshCosts 保持一致
const PAID_REFRESH_COSTS = [10, 20, 30, 50];
const MAX_PAID_REFRESH_COUNT = 5;

interface RefreshButtonProps {
  type: AbilityItemType;
  lotteryStatus: LotteryStatusDto | null;
  member: MemberDto | null;
  useableMemberPoint: number;
  onOpenMember?: () => void;
}

const buttonStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'center',
  verticalAlign: 'bottom',
};

const imageStyle: Partial<VCSSStyleDeclaration> = {
  marginBottom: '20px',
  width: '50px',
  height: '50px',
};

const getIsRefreshed = (type: AbilityItemType, lotteryStatus: LotteryStatusDto | null) => {
  if (type === 'abilityActive') {
    return lotteryStatus?.isActiveAbilityRefreshed;
  }
  if (type === 'abilityPassive') {
    return lotteryStatus?.isPassiveAbilityRefreshed;
  }
  if (type === 'abilityPassive2') {
    return lotteryStatus?.isPassiveAbilityRefreshed2;
  }
  return false;
};

const getPickedName = (type: AbilityItemType, lotteryStatus: LotteryStatusDto | null) => {
  if (type === 'abilityActive') {
    return lotteryStatus?.activeAbilityName;
  }
  if (type === 'abilityPassive') {
    return lotteryStatus?.passiveAbilityName;
  }
  if (type === 'abilityPassive2') {
    return lotteryStatus?.passiveAbilityName2;
  }
  return undefined;
};

const getPaidCount = (type: AbilityItemType, lotteryStatus: LotteryStatusDto | null) => {
  if (type === 'abilityActive') {
    return lotteryStatus?.activePaidRefreshCount ?? 0;
  }
  if (type === 'abilityPassive') {
    return lotteryStatus?.passivePaidRefreshCount ?? 0;
  }
  if (type === 'abilityPassive2') {
    return lotteryStatus?.passivePaidRefreshCount2 ?? 0;
  }
  return 0;
};

const getPaidRefreshCost = (paidCount: number) =>
  PAID_REFRESH_COSTS[Math.min(paidCount, PAID_REFRESH_COSTS.length - 1)];

const RefreshButton: React.FC<RefreshButtonProps> = ({
  type,
  lotteryStatus,
  member,
  useableMemberPoint,
  onOpenMember,
}) => {
  const isMember = isMemberActive(member);
  const isRefreshed = getIsRefreshed(type, lotteryStatus);
  const pickedName = getPickedName(type, lotteryStatus);
  const paidCount = getPaidCount(type, lotteryStatus);
  const remainingPaidRefreshCount = Math.max(0, MAX_PAID_REFRESH_COUNT - paidCount);
  const isPaidRefreshLimitReached = isRefreshed && remainingPaidRefreshCount <= 0;

  // 会员积分刷新阶段（免费已用过）下次消耗，免费阶段为 0
  const nextCost = isRefreshed ? getPaidRefreshCost(paidCount) : 0;
  const canAfford = useableMemberPoint >= nextCost;

  // 引导态：非会员、或会员积分不足，按钮可点但点击跳转会员/充值页
  const guideToMember = !isMember || (isRefreshed && !isPaidRefreshLimitReached && !canAfford);

  // 已选技能锁定该行，禁用；其余情况按钮都可点（引导态点击跳转）
  const enabled = !pickedName && !isPaidRefreshLimitReached;

  // 仅可正常刷新时显示亮色 token，引导态/禁用态用灰显图标
  const imageSrc =
    enabled && !guideToMember
      ? 'file://{images}/custom_game/lottery/icon_rerolltoken.png'
      : 'file://{images}/custom_game/lottery/icon_rerolltoken_disabled.png';

  const getTooltipText = () => {
    if (!isMember) {
      return $.Localize('#lottery_tooltip_ability_refresh_not_member');
    }
    if (pickedName) {
      return $.Localize('#lottery_tooltip_ability_refresh_picked');
    }
    if (!isRefreshed) {
      return $.Localize('#lottery_tooltip_ability_refresh');
    }
    if (isPaidRefreshLimitReached) {
      return $.Localize('#lottery_tooltip_ability_refresh_limit');
    }
    if (!canAfford) {
      return $.Localize('#lottery_tooltip_ability_refresh_insufficient');
    }
    return $.Localize('#lottery_tooltip_ability_refresh_paid')
      .replace('{cost}', nextCost.toString())
      .replace('{remaining}', remainingPaidRefreshCount.toString());
  };

  const tooltipText = getTooltipText();

  // DOTAShowTextTooltip 是快照式：悬停期间数据变化（点击会员积分刷新后 cost 进档、积分减少）
  // 不会自动更新已显示的文本，需在仍悬停时主动重新 dispatch。
  const hoverPanelRef = useRef<Panel | null>(null);
  useEffect(() => {
    if (hoverPanelRef.current) {
      $.DispatchEvent('DOTAShowTextTooltip', hoverPanelRef.current, tooltipText);
    }
  }, [tooltipText]);

  const handleButtonClick = () => {
    if (guideToMember) {
      // 积分不足直达购买积分子页；非会员到会员页
      const param = isMember && !canAfford ? 'member:points' : 'member';
      GameEvents.SendCustomGameEventToAllClients('hud_open_page', {
        page: 'profile',
        param,
        playerId: Game.GetLocalPlayerID(),
      });
      onOpenMember?.();
      return;
    }

    if (pickedName) {
      $.Msg('[RefreshButton] Already picked, ignoring click');
      return;
    }
    if (isPaidRefreshLimitReached) {
      $.Msg('[RefreshButton] Paid refresh limit reached, ignoring click');
      return;
    }

    $.Msg('[RefreshButton] Sending refresh event');
    GameEvents.SendCustomGameEventToServer('lottery_refresh_ability', {
      type,
    });
  };

  return (
    <Button
      onactivate={handleButtonClick}
      style={buttonStyle}
      enabled={enabled}
      onmouseover={(panel) => {
        hoverPanelRef.current = panel;
        $.DispatchEvent('DOTAShowTextTooltip', panel, tooltipText);
      }}
      onmouseout={() => {
        hoverPanelRef.current = null;
        $.DispatchEvent('DOTAHideTextTooltip');
      }}
    >
      <Image src={imageSrc} style={imageStyle} />
    </Button>
  );
};

export default RefreshButton;
