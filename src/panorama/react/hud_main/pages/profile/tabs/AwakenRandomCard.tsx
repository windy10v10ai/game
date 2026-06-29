import { PrimaryButton } from '../../../../shared/components';

interface AwakenRandomCardProps {
  enabled: boolean;
  canAfford: boolean;
  hasEnoughPool: boolean;
  onClick: () => void;
}

/** 随机抽选入口卡：置于觉醒网格首位，半价随机抽 3 选 1，与英雄直购卡视觉区分 */
export function AwakenRandomCard({
  enabled,
  canAfford,
  hasEnoughPool,
  onClick,
}: AwakenRandomCardProps) {
  const tooltipText = !hasEnoughPool
    ? $.Localize('#awaken_random_tooltip_insufficient_pool')
    : !canAfford
      ? $.Localize('#awaken_random_tooltip_insufficient_point')
      : undefined;

  return (
    <Panel className="awaken-card awaken-random-card">
      <Panel className="awaken-random-bg" />
      <Panel className="awaken-top-scrim" />
      <Label className="awaken-hero-name-top" text={$.Localize('#awaken_random_title')} />
      <Panel className="awaken-scrim" />
      <Panel className="awaken-bottom">
        <DOTAItemImage className="awaken-ability-icon" itemname="item_awaken_stone" />
        <PrimaryButton
          className="awaken-unlock-btn"
          enabled={enabled}
          onClick={onClick}
          label={$.Localize('#awaken_random_button')}
          tooltipText={tooltipText}
        />
      </Panel>
    </Panel>
  );
}
