import { ModifierEventHub } from '../../modules/modifier-event/modifier-event-hub';
import { calculateStatusResistedDuration } from '../../utils/damage-calculation';
import { BaseItem, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { BaseItemModifier } from './base_item_modifier';
import { AddScepterPassive, RemoveScepterPassive, ScepterPassive } from './scepter-registry';

/** 法杖系列（魔云法杖、仙云法杖、魔龙狂舞）：被动按智力给技能增强，同一英雄带多件只取系数最高的一件；主动效果都是 KV modifier。 */
abstract class ScepterItem extends BaseItem {
  protected abstract readonly activeModifierName: string;
  protected abstract readonly castSound: string;

  OnSpellStart(): void {
    const caster = this.GetCaster();
    caster.EmitSound(this.castSound);
    ApplyItemDataDrivenModifier(caster, caster, this.activeModifierName, {
      duration: this.GetSpecialValueFor('active_duration'),
    });
  }
}

abstract class ScepterPassiveModifier extends BaseItemModifier implements ScepterPassive {
  // 慧光被动只有属性，开销与 KV 属性相当；它的技能增强与慧光系同类取最大
  override vanillaModifierNames = ['modifier_item_kaya'];
  ampPerInt = 0;
  protected effective = false;

  SetEffective(effective: boolean): void {
    this.effective = effective;
  }

  OnCreated(): void {
    this.ampPerInt = this.GetAbility()?.GetSpecialValueFor('spell_amp_per_int') ?? 0;
    super.OnCreated();
    AddScepterPassive(this.GetParent().entindex(), this);
  }

  OnDestroy(): void {
    super.OnDestroy();
    RemoveScepterPassive(this.GetParent().entindex(), this);
  }

  GetAttributes(): ModifierAttribute {
    return (
      ModifierAttribute.PERMANENT |
      ModifierAttribute.MULTIPLE |
      ModifierAttribute.IGNORE_INVULNERABLE
    );
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.SPELL_AMPLIFY_PERCENTAGE];
  }

  GetModifierSpellAmplify_Percentage(): number {
    const parent = this.GetParent();
    if (!this.effective || !parent.IsHero()) return 0;
    return (parent as CDOTA_BaseNPC_Hero).GetIntellect(false) * this.ampPerInt;
  }
}

@registerAbility('item_magic_scepter')
export class ItemMagicScepter extends ScepterItem {
  protected readonly activeModifierName = 'modifier_item_magic_scepter_active';
  protected readonly castSound = 'arcane_scepter';

  GetIntrinsicModifierName(): string {
    return modifier_item_magic_scepter.name;
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
@registerModifier('items/ts_items/item_magic_scepter')
export class modifier_item_magic_scepter extends ScepterPassiveModifier {
  override statsModifierName = 'modifier_item_magic_scepter_stats';
}

@registerAbility('item_hallowed_scepter')
export class ItemHallowedScepter extends ScepterItem {
  protected readonly activeModifierName = 'modifier_item_hallowed_scepter_active';
  protected readonly castSound = 'arcane_scepter';

  GetIntrinsicModifierName(): string {
    return modifier_item_hallowed_scepter.name;
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
@registerModifier('items/ts_items/item_magic_scepter')
export class modifier_item_hallowed_scepter extends ScepterPassiveModifier {
  override statsModifierName = 'modifier_item_hallowed_scepter_stats';
}

const CRIT_BLADE_ACTIVE = 'modifier_item_magic_crit_blade_active';
const CRIT_BLADE_MRES_DEBUFF = 'modifier_item_magic_crit_blade_mres_debuff';
const CRIT_BLADE_CAST_PARTICLE = 'particles/items2_fx/veil_of_discord.vpcf';

@registerAbility('item_magic_crit_blade')
export class ItemMagicCritBlade extends ScepterItem {
  protected readonly activeModifierName = CRIT_BLADE_ACTIVE;
  protected readonly castSound = 'Hero_DragonKnight.BreathFire';

  GetIntrinsicModifierName(): string {
    return modifier_item_magic_crit_blade.name;
  }

  OnSpellStart(): void {
    super.OnSpellStart();
    const caster = this.GetCaster();
    const duration = this.GetSpecialValueFor('active_duration');
    const radius = this.GetSpecialValueFor('active_radius');
    const particle = ParticleManager.CreateParticle(
      CRIT_BLADE_CAST_PARTICLE,
      ParticleAttachment.ABSORIGIN,
      caster,
    );
    ParticleManager.SetParticleControl(particle, 1, Vector(radius, radius, radius));
    ParticleManager.ReleaseParticleIndex(particle);
    const enemies = FindUnitsInRadius(
      caster.GetTeamNumber(),
      caster.GetAbsOrigin(),
      undefined,
      radius,
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO | UnitTargetType.BASIC,
      UnitTargetFlags.NONE,
      FindOrder.ANY,
      false,
    );
    for (const enemy of enemies) {
      ApplyItemDataDrivenModifier(caster, enemy, CRIT_BLADE_MRES_DEBUFF, {
        duration: calculateStatusResistedDuration(duration, enemy),
      });
    }
  }
}

/** 魔龙狂舞被动：主动期间智力法强翻倍，并对魔法与纯粹伤害判定法术暴击。 */
// eslint-disable-next-line @typescript-eslint/naming-convention
@registerModifier('items/ts_items/item_magic_scepter')
export class modifier_item_magic_crit_blade extends ScepterPassiveModifier {
  override statsModifierName = 'modifier_item_magic_crit_blade_stats';

  private activeMultiplier = 1;
  private critChance = 0;
  private critMultiplier = 1;
  private lastCritTime = 0;

  OnCreated(): void {
    const ability = this.GetAbility();
    this.activeMultiplier = ability?.GetSpecialValueFor('spell_amp_multiplier') ?? 1;
    this.critChance = ability?.GetSpecialValueFor('spell_crit_chance') ?? 0;
    this.critMultiplier = (ability?.GetSpecialValueFor('spell_crit_multiplier') ?? 100) / 100;
    super.OnCreated();
    if (IsServer()) {
      ModifierEventHub.RegisterDamageByAttacker(this.GetParent(), this, (event) =>
        this.OnParentDealDamage(event),
      );
    }
  }

  OnDestroy(): void {
    super.OnDestroy();
    if (IsServer()) {
      ModifierEventHub.UnregisterDamageByAttacker(this.GetParent(), this);
    }
  }

  GetModifierSpellAmplify_Percentage(): number {
    const amp = super.GetModifierSpellAmplify_Percentage();
    if (amp === 0 || !this.GetParent().HasModifier(CRIT_BLADE_ACTIVE)) return amp;
    return amp * this.activeMultiplier;
  }

  private OnParentDealDamage(event: ModifierInstanceEvent): void {
    if (!this.effective) return;
    if (event.original_damage < 50) return;
    if (event.damage_type === DamageTypes.PHYSICAL) return;
    // 暴击追加的伤害带反射标志，靠它防止自我连锁
    if ((event.damage_flags & (DamageFlag.NO_SPELL_AMPLIFICATION | DamageFlag.REFLECTION)) !== 0)
      return;
    const target = event.unit;
    if (target.IsBuilding()) return;

    // AoE 同一瞬间命中多个目标时只暴击一次
    const now = GameRules.GetGameTime();
    if (now < this.lastCritTime + 0.1) return;
    if (RandomFloat(0, 100) > this.critChance) return;
    this.lastCritTime = now;

    ApplyDamage({
      victim: target,
      attacker: event.attacker,
      damage: event.original_damage * (this.critMultiplier - 1),
      damage_type: event.damage_type,
      damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION | DamageFlag.REFLECTION,
      ability: this.GetAbility(),
    });
    SendOverheadEventMessage(
      undefined,
      OverheadAlert.DAMAGE,
      target,
      event.damage * this.critMultiplier,
      undefined,
    );
  }
}
