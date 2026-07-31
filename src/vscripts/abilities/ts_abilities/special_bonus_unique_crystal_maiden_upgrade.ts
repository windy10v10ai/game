import { IsEnemyTeam } from '../../modules/helper/unit-helper';
import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { applyAwakenMagicImmunity } from './shared/awaken-magic-immunity';

/**
 * 水晶室女 极寒领域-觉醒：引导期间获得技能免疫，并附带一次指向性技能免疫。
 * 引导时长远超真 BKB 上限，故收回时只 Destroy 本次拿到的句柄，不能凭剩余时间判断（会误删真 BKB）。
 */
@registerAbility('special_bonus_unique_crystal_maiden_upgrade')
export class SpecialBonusUniqueCrystalMaidenUpgrade extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return 'modifier_special_bonus_unique_crystal_maiden_upgrade';
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_crystal_maiden_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_crystal_maiden_upgrade extends BaseModifier {
  private immunity?: CDOTA_Buff;

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_ABILITY_FULLY_CAST, ModifierFunction.ON_ABILITY_END_CHANNEL];
  }

  OnAbilityFullyCast(event: ModifierAbilityEvent): void {
    if (!IsServer()) return;
    if (!this.isOwnFreezingField(event)) return;

    const ability = this.GetAbility();
    if (!ability) return;
    // 打断由 END_CHANNEL 兜住，这里的时长只覆盖引导完整走完的情况
    const duration = event.ability.GetChannelTime();
    if (duration <= 0) return;

    const parent = this.GetParent();
    this.immunity = applyAwakenMagicImmunity(parent, ability, duration);
    // 引导被打断也不收回，让引导结束后的脆弱期同样有一次保护
    parent.AddNewModifier(
      parent,
      ability,
      modifier_special_bonus_unique_crystal_maiden_upgrade_shield.name,
      { duration },
    );
  }

  OnAbilityEndChannel(event: ModifierAbilityEvent): void {
    if (!IsServer()) return;
    if (!this.isOwnFreezingField(event)) return;

    const immunity = this.immunity;
    this.immunity = undefined;
    if (!immunity || immunity.IsNull()) return;
    immunity.Destroy();
  }

  private isOwnFreezingField(event: ModifierAbilityEvent): boolean {
    return (
      event.unit === this.GetParent() &&
      event.ability.GetAbilityName() === 'crystal_maiden_freezing_field'
    );
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_crystal_maiden_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_crystal_maiden_upgrade_shield extends BaseModifier {
  IsHidden(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  GetTexture(): string {
    return 'item_sphere';
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ABSORB_SPELL];
  }

  GetAbsorbSpell(event: ModifierAbilityEvent): 0 | 1 {
    if (!IsServer()) return 0;

    const parent = this.GetParent();
    if (!IsEnemyTeam(event.ability.GetCaster(), parent)) return 0;

    const particle = ParticleManager.CreateParticle(
      'particles/items_fx/immunity_sphere.vpcf',
      ParticleAttachment.ABSORIGIN_FOLLOW,
      parent,
    );
    ParticleManager.ReleaseParticleIndex(particle);
    parent.EmitSound('DOTA_Item.LinkensSphere.Activate');

    this.Destroy();
    return 1;
  }
}
