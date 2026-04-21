import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { BaseItemModifier } from './base_item_modifier';

@registerAbility()
export class item_reaper_soul extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return 'modifier_item_reaper_soul';
  }

  OnSpellStart(): void {
    const caster = this.GetCaster();
    const target = this.GetCursorTarget();
    if (!target) return;

    const condemnDuration = this.GetSpecialValueFor('condemn_duration');
    target.AddNewModifier(caster, this, 'modifier_item_reaper_soul_condemned', {
      duration: condemnDuration,
    });
  }
}

@registerModifier('items/ts_items/item_reaper_soul.lua')
export class modifier_item_reaper_soul extends BaseItemModifier {
  protected override statsModifierName: string = '';

  private listenHandle?: EventListenerID;

  OnCreated(): void {
    super.OnCreated();
    if (IsServer()) {
      this.listenHandle = ListenToGameEvent(
        'entity_killed',
        (keys) => this.onEntityKilled(keys),
        this,
      );
    }
  }

  OnDestroy(): void {
    super.OnDestroy();
    if (IsServer() && this.listenHandle !== undefined) {
      StopListeningToGameEvent(this.listenHandle);
      this.listenHandle = undefined;
    }
  }

  private onEntityKilled(keys: GameEventProvidedProperties & EntityKilledEvent): void {
    if (!keys.entindex_killed || !keys.entindex_attacker) return;

    const killedUnit = EntIndexToHScript(keys.entindex_killed) as CDOTA_BaseNPC | undefined;
    if (!killedUnit?.IsRealHero()) return;

    const parent = this.GetParent() as CDOTA_BaseNPC_Hero;
    const attacker = EntIndexToHScript(keys.entindex_attacker) as CDOTA_BaseNPC | undefined;
    if (!attacker) return;

    if (attacker.GetPlayerOwnerID() !== parent.GetPlayerOwnerID()) return;

    const abiliy = this.GetAbility();
    if (!abiliy) return;

    const killedHero = killedUnit as CDOTA_BaseNPC_Hero;

    if (killedHero.HasModifier('modifier_item_reaper_soul_condemned')) {
      const condemnDeny = abiliy.GetSpecialValueFor('condemn_buyback_deny');
      const goldBonus = abiliy.GetSpecialValueFor('condemn_gold_bonus');
      killedHero.SetBuybackCooldownTime(condemnDeny);
      parent.ModifyGold(goldBonus, true, ModifyGoldReason.UNSPECIFIED);
    } else {
      const denyDuration = abiliy.GetSpecialValueFor('buyback_deny_duration');
      killedHero.SetBuybackCooldownTime(denyDuration);
    }
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.STATS_STRENGTH_BONUS,
      ModifierFunction.STATS_AGILITY_BONUS,
      ModifierFunction.STATS_INTELLECT_BONUS,
      ModifierFunction.PREATTACK_BONUS_DAMAGE,
      ModifierFunction.PHYSICAL_ARMOR_BONUS,
    ];
  }

  GetModifierBonusStats_Strength(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_strength') ?? 0;
  }

  GetModifierBonusStats_Agility(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_agility') ?? 0;
  }

  GetModifierBonusStats_Intellect(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_intellect') ?? 0;
  }

  GetModifierPreAttack_BonusDamage(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_damage') ?? 0;
  }

  GetModifierPhysicalArmorBonus(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_armor') ?? 0;
  }
}

@registerModifier('items/ts_items/item_reaper_soul.lua')
export class modifier_item_reaper_soul_condemned extends BaseModifier {
  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  GetTexture(): string {
    return 'item_reaper_soul';
  }

  GetEffectName(): string {
    return 'particles/generic_gameplay/generic_debuff.vpcf';
  }

  GetEffectAttachType(): ParticleAttachment {
    return ParticleAttachment.OVERHEAD_FOLLOW;
  }
}
