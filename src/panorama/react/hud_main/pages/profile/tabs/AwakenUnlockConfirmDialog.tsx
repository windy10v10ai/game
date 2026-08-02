import { PrimaryButton } from '../../../../shared/components';

interface AwakenUnlockConfirmDialogProps {
  heroName: string;
  abilityName: string;
  seasonCost: number;
  memberCost: number;
  canAffordSeason: boolean;
  canAffordMember: boolean;
  onConfirm: (useMemberPoint: boolean) => void;
  onCancel: () => void;
  // 随机抽选认领走半价文案，默认直购全价文案
  descKey?: string;
}

/**
 * 觉醒永久生效、不可撤销，解锁前用此弹窗二次确认要解锁的英雄与技能，
 * 并在此选择用勇士积分还是会员积分支付。
 */
export function AwakenUnlockConfirmDialog({
  heroName,
  abilityName,
  seasonCost,
  memberCost,
  canAffordSeason,
  canAffordMember,
  onConfirm,
  onCancel,
  descKey = '#awaken_unlock_confirm_desc',
}: AwakenUnlockConfirmDialogProps) {
  return (
    <Panel className="awaken-confirm-overlay" onactivate={onCancel}>
      {/* 自身吃掉点击，避免冒泡到 overlay 触发取消；点击对话框以外的遮罩区域才会取消 */}
      <Panel className="awaken-confirm-dialog" onactivate={() => {}}>
        <Button className="btn-close awaken-confirm-close" onactivate={onCancel} />
        <DOTAAbilityImage
          className="awaken-confirm-ability-icon"
          abilityname={abilityName}
          showtooltip={true}
        />
        <Label className="awaken-confirm-hero-name" text={$.Localize('#' + heroName)} />
        <Label className="awaken-confirm-desc" html={true} text={$.Localize(descKey)} />
        <Panel className="awaken-confirm-actions">
          <PrimaryButton
            className="awaken-confirm-pay"
            enabled={canAffordSeason}
            html={true}
            onClick={() => onConfirm(false)}
            label={$.Localize('#awaken_pay_season_button').replace('{cost}', String(seasonCost))}
            tooltipText={
              canAffordSeason ? undefined : $.Localize('#awaken_unlock_tooltip_insufficient')
            }
          />
          <PrimaryButton
            variant="gold"
            className="awaken-confirm-pay"
            enabled={canAffordMember}
            html={true}
            onClick={() => onConfirm(true)}
            label={$.Localize('#awaken_pay_member_button').replace('{cost}', String(memberCost))}
            tooltipText={
              canAffordMember ? undefined : $.Localize('#awaken_unlock_tooltip_insufficient')
            }
          />
        </Panel>
      </Panel>
    </Panel>
  );
}
