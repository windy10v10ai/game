import { BaseItem, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { BaseItemModifier } from './base_item_modifier';

const AEON_DISK_BUFF = 'modifier_item_aeon_disk_buff';
const ACTIVE_MODIFIER = 'modifier_item_withered_spring_active';

/** 生命之心：保命判定交给原版永恒之盘，触发瞬间连带跑一次主动的群体回复。 */
@registerAbility('item_withered_spring')
export class ItemWitheredSpring extends BaseItem {
  GetIntrinsicModifierName(): string {
    return ModifierItemWitheredSpringPassive.name;
  }

  OnSpellStart(): void {
    this.Replenish();
  }

  // 被动触发路径由原版 modifier 自行开冷却，因此不在这里 UseResources
  Replenish(): void {
    if (!IsServer()) {
      return;
    }

    const caster = this.GetCaster();

    caster.EmitSound('Item.GuardianGreaves.Activate');
    const casterFx = ParticleManager.CreateParticle(
      'particles/items3_fx/warmage.vpcf',
      ParticleAttachment.ABSORIGIN,
      caster,
    );
    ParticleManager.ReleaseParticleIndex(casterFx);

    // 走全局函数而非 import ModifierHelper：那个模块顶层就 CreateItem，
    // 被客户端加载时会失败，连带本文件的 modifier 注册全部不执行
    ApplyItemDataDrivenModifier(caster, caster, ACTIVE_MODIFIER, {
      duration: this.GetSpecialValueFor('active_duration'),
    });
    caster.Purge(false, true, false, true, true);

    const replenishHealth = this.GetSpecialValueFor('replenish_health');
    const replenishHealthPct = this.GetSpecialValueFor('replenish_health_pct');
    const replenishMana = this.GetSpecialValueFor('replenish_mana');

    const allies = FindUnitsInRadius(
      caster.GetTeamNumber(),
      caster.GetAbsOrigin(),
      undefined,
      this.GetSpecialValueFor('replenish_radius'),
      UnitTargetTeam.FRIENDLY,
      UnitTargetType.HERO,
      UnitTargetFlags.NOT_ILLUSIONS,
      FindOrder.ANY,
      false,
    );

    for (const ally of allies) {
      const healAmount = replenishHealth + (ally.GetMaxHealth() * replenishHealthPct) / 100;
      ally.Heal(healAmount, this);
      ally.GiveMana(replenishMana);
      SendOverheadEventMessage(undefined, OverheadAlert.HEAL, ally, healAmount, undefined);
      SendOverheadEventMessage(undefined, OverheadAlert.MANA_ADD, ally, replenishMana, undefined);

      const allyFx = ParticleManager.CreateParticle(
        'particles/items3_fx/warmage_recipient.vpcf',
        ParticleAttachment.ABSORIGIN_FOLLOW,
        ally,
      );
      ParticleManager.ReleaseParticleIndex(allyFx);
    }
  }
}

@registerModifier('items/ts_items/item_withered_spring', 'modifier_item_withered_spring')
export class ModifierItemWitheredSpringPassive extends BaseItemModifier {
  override statsModifierName: string = 'modifier_item_withered_spring_stats';
  override vanillaModifierNames: string[] = ['modifier_item_aeon_disk'];

  private healthRegenPct: number = 0;

  OnCreated(): void {
    super.OnCreated();

    const ability = this.GetAbility();
    if (ability) {
      this.healthRegenPct = ability.GetSpecialValueFor('health_regen_pct');
    }
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.HEALTH_REGEN_PERCENTAGE_UNIQUE, ModifierFunction.ON_MODIFIER_ADDED];
  }

  GetModifierHealthRegenPercentageUnique(): number {
    return this.healthRegenPct;
  }

  OnModifierAdded(event: ModifierAddedEvent): void {
    if (!IsServer()) {
      return;
    }
    if (event.added_buff.GetName() !== AEON_DISK_BUFF) {
      return;
    }

    // 多件叠加时每件都有一个本 modifier，只有挂出该 buff 的那件负责回复
    const buffAbility = event.added_buff.GetAbility();
    const ability = this.GetAbility();
    if (buffAbility !== undefined && buffAbility !== ability) {
      return;
    }

    (ability as ItemWitheredSpring | undefined)?.Replenish();
  }
}
