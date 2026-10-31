import { ModifierEventHub } from '../../modules/modifier-event/modifier-event-hub';
import { BaseItem, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { BaseItemModifier } from './base_item_modifier';

const AEON_DISK_BUFF = 'modifier_item_aeon_disk_buff';
const GUARD_MODIFIER = 'modifier_item_aeon_amulet_guard';
// 减速抗性与状态抗性 KV 写了不生效，只能借中立强化的原版 modifier，数值由本物品同名字段提供
const SLOW_RESIST_MODIFIER = 'modifier_item_enhancement_brawny';
const STATUS_RESIST_MODIFIER = 'modifier_item_enhancement_titanic';

/** 永恒护符：对友方英雄强驱散并给 3 秒永恒守护，被动免死交给原版永恒之盘，触发时对自己再放一次。 */
@registerAbility('item_aeon_amulet')
export class ItemAeonAmulet extends BaseItem {
  GetIntrinsicModifierName(): string {
    return ModifierItemAeonAmuletPassive.name;
  }

  OnSpellStart(): void {
    const caster = this.GetCaster();
    const target = this.GetCursorTarget();
    if (target === undefined) {
      return;
    }

    if (
      PlayerResource.IsDisableHelpSetForPlayerID(
        target.GetPlayerOwnerID(),
        caster.GetPlayerOwnerID(),
      )
    ) {
      this.EndCooldown();
      this.RefundManaCost();
      return;
    }

    this.Protect(target, true);
    if (target !== caster) {
      this.Protect(caster, true);
    }
  }

  // 主动与免死触发共用；免死 buff 自带状态抗性，被动路径不再挂一份，避免叠成约 96%
  Protect(unit: CDOTA_BaseNPC, withStatusResist: boolean): void {
    if (!IsServer()) {
      return;
    }

    unit.EmitSound('DOTA_Item.MedallionOfCourage.Activate');
    const fx = ParticleManager.CreateParticle(
      'particles/items2_fx/medallion_of_courage_friend.vpcf',
      ParticleAttachment.ABSORIGIN_FOLLOW,
      unit,
    );
    ParticleManager.ReleaseParticleIndex(fx);

    unit.Purge(false, true, false, true, true);

    const duration = this.GetSpecialValueFor('guard_duration');
    // 走全局函数而非 import ModifierHelper：那个模块顶层就 CreateItem，
    // 被客户端加载时会失败，连带本文件的 modifier 注册全部不执行
    ApplyItemDataDrivenModifier(unit, unit, GUARD_MODIFIER, { duration });
    unit.AddNewModifier(unit, this, SLOW_RESIST_MODIFIER, { duration });
    if (withStatusResist) {
      unit.AddNewModifier(unit, this, STATUS_RESIST_MODIFIER, { duration });
    }
  }
}

@registerModifier('items/ts_items/item_aeon_amulet', 'modifier_item_aeon_amulet')
export class ModifierItemAeonAmuletPassive extends BaseItemModifier {
  override statsModifierName: string = 'modifier_item_aeon_amulet_stats';
  override vanillaModifierNames: string[] = [
    'modifier_item_aeon_disk',
    'modifier_item_enhancement_restorative',
  ];

  OnCreated(): void {
    super.OnCreated();

    if (IsServer()) {
      ModifierEventHub.RegisterModifierAdded(this.GetParent(), this, (event) =>
        this.OnParentModifierAdded(event),
      );
    }
  }

  OnDestroy(): void {
    super.OnDestroy();
    if (IsServer()) {
      ModifierEventHub.UnregisterModifierAdded(this.GetParent(), this);
    }
  }

  OnParentModifierAdded(event: ModifierAddedEvent): void {
    if (event.added_buff.GetName() !== AEON_DISK_BUFF) {
      return;
    }

    // 多件叠加时每件都有一个本 modifier，只有挂出该 buff 的那件负责
    const buffAbility = event.added_buff.GetAbility();
    const ability = this.GetAbility();
    if (buffAbility !== undefined && buffAbility !== ability) {
      return;
    }

    // 持有者取 modifier 的 parent：物品不在背包时取不到施法者
    (ability as ItemAeonAmulet | undefined)?.Protect(this.GetParent(), false);
  }
}
