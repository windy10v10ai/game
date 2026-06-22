import { PrimaryButton } from '../../../../shared/components';

interface AwakenUnlockConfirmDialogProps {
  heroName: string;
  abilityName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** 觉醒永久生效、不可撤销，解锁前用此弹窗二次确认要解锁的英雄与技能 */
export function AwakenUnlockConfirmDialog({
  heroName,
  abilityName,
  onConfirm,
  onCancel,
}: AwakenUnlockConfirmDialogProps) {
  return (
    <Panel className="awaken-confirm-overlay" onactivate={onCancel}>
      {/* 自身吃掉点击，避免冒泡到 overlay 触发取消；点击对话框以外的遮罩区域才会取消 */}
      <Panel className="awaken-confirm-dialog" onactivate={() => {}}>
        <DOTAAbilityImage
          className="awaken-confirm-ability-icon"
          abilityname={abilityName}
          showtooltip={true}
        />
        <Label className="awaken-confirm-hero-name" text={$.Localize('#' + heroName)} />
        <Label
          className="awaken-confirm-desc"
          html={true}
          text={$.Localize('#awaken_unlock_confirm_desc')}
        />
        <Panel className="awaken-confirm-actions">
          <PrimaryButton
            className="awaken-confirm-confirm"
            onClick={onConfirm}
            label={$.Localize('#awaken_unlock_confirm_button')}
          />
          <Button className="btn-ghost awaken-confirm-cancel" onactivate={onCancel}>
            <Label
              className="awaken-confirm-cancel-label"
              text={$.Localize('#awaken_unlock_confirm_cancel')}
            />
          </Button>
        </Panel>
      </Panel>
    </Panel>
  );
}
