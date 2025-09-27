import {
  BaseItem,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { BaseItemModifier } from './base_item_modifier';

@registerAbility('item_jump_jump_jump')
export class ItemJumpJumpJump extends BaseItem {
  GetIntrinsicModifierName(): string {
    return 'modifier_item_jump_jump_jump';
  }

  GetAOERadius(): number {
    return this.GetSpecialValueFor('meteor_land_radius');
  }

  OnSpellStart(): void {
    const caster = this.GetCaster() as CDOTA_BaseNPC_Hero;
    const targetLoc = this.GetCursorPosition();

    // 播放起始点特效
    caster.EmitSound('DOTA_Item.BlinkDagger.Activate');

    const blinkPfx = ParticleManager.CreateParticle(
      'particles/items_fx/blink_dagger_start.vpcf',
      ParticleAttachment.CUSTOMORIGIN,
      caster,
    );
    ParticleManager.ReleaseParticleIndex(blinkPfx);

    // 闪烁并躲避投射物
    FindClearSpaceForUnit(caster, targetLoc, true);
    ProjectileManager.ProjectileDodge(caster);

    // 播放终点特效
    caster.EmitSound('DOTA_Item.MeteorHammer.Cast');
    caster.EmitSound('Blink_Layer.Swift');
    caster.EmitSound('Blink_Layer.Arcane');

    const blinkEndPfx = ParticleManager.CreateParticle(
      'particles/items_fx/blink_dagger_end.vpcf',
      ParticleAttachment.ABSORIGIN,
      caster,
    );
    ParticleManager.ReleaseParticleIndex(blinkEndPfx);

    // 陨石降落
    const meteorLandTime = this.GetSpecialValueFor('meteor_fall_time');
    const buffDuration = this.GetSpecialValueFor('buff_duration') + meteorLandTime; // 持续时间在施法者处于陨石状态时被浪费

    const meteorPfx = ParticleManager.CreateParticle(
      'particles/items4_fx/meteor_hammer_spell.vpcf',
      ParticleAttachment.WORLDORIGIN,
      caster,
    );
    ParticleManager.SetParticleControl(meteorPfx, 0, targetLoc.__add(Vector(0, 0, 1000))); // 1000 感觉有点随意，但感觉是对的
    ParticleManager.SetParticleControl(meteorPfx, 1, targetLoc);
    ParticleManager.SetParticleControl(meteorPfx, 2, Vector(meteorLandTime, 0, 0));
    ParticleManager.ReleaseParticleIndex(meteorPfx);

    caster.AddNewModifier(caster, this, 'modifier_item_arcane_blink_buff', {
      duration: buffDuration,
    });
    caster.AddNewModifier(caster, this, 'modifier_item_swift_blink_buff', {
      duration: buffDuration,
    });
    caster.AddNewModifier(caster, this, 'modifier_item_jump_jump_jump_meteor_form', {
      duration: meteorLandTime,
    });
  }
}

@registerModifier('modifier_item_jump_jump_jump')
export class ModifierItemJumpJumpJump extends BaseItemModifier {
  override statsModifierName: string = 'modifier_item_jump_jump_jump_stats';

  private blinkDamageCooldown: number = 0;

  OnCreated(): void {
    super.OnCreated();
    this.OnRefresh();
  }

  OnRefresh(): void {
    if (!IsServer()) {
      return;
    }

    const ability = this.GetAbility();
    if (!ability || ability.IsNull()) return;

    super.OnRefresh();

    this.blinkDamageCooldown = ability.GetSpecialValueFor('blink_damage_cooldown');

    if (IsServer()) {
      this.RefreshStatsModifier();
      const allModifiers = this.GetParent().FindAllModifiersByName(this.GetName());
      for (const [index, mod] of allModifiers.entries()) {
        (mod.GetAbility() as CDOTA_Item_Lua)?.SetSecondaryCharges(index);
      }
    }
  }

  OnDestroy(): void {
    super.OnDestroy();
    if (IsServer()) {
      this.RefreshStatsModifier();
      const allModifiers = this.GetParent().FindAllModifiersByName(this.GetName());
      for (const [index, mod] of allModifiers.entries()) {
        (mod.GetAbility() as CDOTA_Item_Lua)?.SetSecondaryCharges(index);
      }
    }
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.INCOMING_DAMAGE_PERCENTAGE];
  }

  GetModifierIncomingDamage_Percentage(keys: ModifierAttackEvent): number {
    const ability = this.GetAbility();
    if (!ability || (ability as CDOTA_Item_Lua).GetSecondaryCharges() !== 1) {
      return 0;
    }

    if (keys.attacker === keys.target || keys.damage <= 0) {
      return 0;
    }

    if (!keys.attacker.IsHero()) {
      return 0;
    }

    // 如果攻击者和目标同队，返回
    if (keys.attacker.GetTeamNumber() === keys.target.GetTeamNumber()) {
      return 0;
    }

    if ((keys.damage_flags & DamageFlag.HPLOSS) === DamageFlag.HPLOSS) {
      return 0;
    }

    if (
      ability &&
      !ability.IsNull() &&
      ability.GetCooldownTimeRemaining() < this.blinkDamageCooldown
    ) {
      ability.StartCooldown(this.blinkDamageCooldown);
    }

    return 0;
  }
}

@registerModifier('modifier_item_jump_jump_jump_meteor_form')
export class ModifierItemJumpJumpJumpMeteorForm extends BaseModifier {
  IsDebuff(): boolean {
    return false;
  }

  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  GetAttributes(): ModifierAttribute {
    return ModifierAttribute.PERMANENT + ModifierAttribute.IGNORE_INVULNERABLE;
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    if (IsServer()) {
      return {
        [ModifierState.STUNNED]: true,
        [ModifierState.INVULNERABLE]: true,
        [ModifierState.UNSELECTABLE]: true,
        [ModifierState.NO_HEALTH_BAR]: true,
        [ModifierState.NO_UNIT_COLLISION]: true,
        [ModifierState.OUT_OF_GAME]: true,
        [ModifierState.UNTARGETABLE]: true,
      };
    } else {
      return {
        [ModifierState.INVULNERABLE]: true,
        [ModifierState.UNSELECTABLE]: true,
        [ModifierState.NO_HEALTH_BAR]: true,
        [ModifierState.NO_UNIT_COLLISION]: true,
        [ModifierState.OUT_OF_GAME]: true,
        [ModifierState.UNTARGETABLE]: true,
      };
    }
  }

  OnCreated(): void {
    if (IsClient()) return;

    this.GetCaster()?.AddNoDraw();
  }

  OnDestroy(): void {
    if (IsClient()) return;

    const caster = this.GetCaster() as CDOTA_BaseNPC_Hero | undefined;
    if (!caster || caster.IsNull()) return;

    caster.RemoveNoDraw();

    const ability = this.GetAbility();
    if (!ability || ability.IsNull()) return;

    // 数值
    const effectRadius = ability.GetSpecialValueFor('meteor_land_radius');
    const baseDamage = ability.GetSpecialValueFor('base_damage');
    const strDamage = 0.01 * ability.GetSpecialValueFor('str_damage');
    const burnDuration = ability.GetSpecialValueFor('meteor_burn_duration');
    const stunDuration = ability.GetSpecialValueFor('meteor_stun_duration');
    const slowDuration = stunDuration + ability.GetSpecialValueFor('slow_duration');
    const startDamage = baseDamage + strDamage * caster.GetStrength();

    // 特效
    caster.EmitSound('DOTA_Item.MeteorHammer.Impact');
    caster.EmitSound('Blink_Layer.Overwhelming');

    const overwhelmingPfx = ParticleManager.CreateParticle(
      'particles/items3_fx/blink_overwhelming_burst.vpcf',
      ParticleAttachment.CUSTOMORIGIN,
      caster,
    );
    ParticleManager.SetParticleControl(overwhelmingPfx, 0, caster.GetAbsOrigin());
    ParticleManager.SetParticleControl(
      overwhelmingPfx,
      1,
      Vector(effectRadius, effectRadius, effectRadius),
    );
    ParticleManager.ReleaseParticleIndex(overwhelmingPfx);

    // 冲击
    const enemies = FindUnitsInRadius(
      caster.GetTeam(),
      caster.GetAbsOrigin(),
      undefined,
      effectRadius,
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO + UnitTargetType.BASIC + UnitTargetType.BUILDING,
      UnitTargetFlags.NONE,
      FindOrder.ANY,
      false,
    );

    for (const enemy of enemies) {
      enemy.EmitSound('DOTA_Item.MeteorHammer.Damage');

      const actualSlowDuration = slowDuration * (1 - enemy.GetStatusResistance());
      enemy.AddNewModifier(caster, ability, 'modifier_item_overwhelming_blink_debuff', {
        duration: actualSlowDuration,
      });
      const actualBurnDuration = burnDuration * (1 - enemy.GetStatusResistance());
      enemy.AddNewModifier(caster, ability, 'modifier_item_jump_jump_jump_meteor_burn', {
        duration: actualBurnDuration,
      });

      const damageTable = {
        attacker: caster,
        damage_type: DamageTypes.MAGICAL,
        ability: ability,
        damage: enemy.IsBuilding() ? startDamage / 2 : startDamage,
        victim: enemy,
      };

      const actualStunDuration = stunDuration * (1 - enemy.GetStatusResistance());
      ApplyDamage(damageTable);
      enemy.AddNewModifier(caster, ability, 'modifier_stunned', {
        duration: actualStunDuration,
      });
    }
  }
}

@registerModifier('modifier_item_jump_jump_jump_meteor_burn')
export class ModifierItemJumpJumpJumpMeteorBurn extends BaseModifier {
  private burnDps: number = 0;

  IsHidden(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return true;
  }

  OnCreated(): void {
    if (IsClient()) return;

    this.burnDps = this.GetAbility()?.GetSpecialValueFor('meteor_burn_dps') || 0;
    // 如果父单位是建筑，那么它是塔，所以燃烧 dps 减半
    if (this.GetParent().IsBuilding()) {
      this.burnDps = this.burnDps / 2;
    }

    this.StartIntervalThink(1.0);
    this.OnIntervalThink();
  }

  OnIntervalThink(): void {
    const caster = this.GetCaster();
    const parent = this.GetParent();
    const ability = this.GetAbility();

    if (!caster || !parent || !ability || caster.IsNull() || parent.IsNull() || ability.IsNull()) {
      this.Destroy();
      return;
    }

    const actualDamage = ApplyDamage({
      ability: ability,
      attacker: caster,
      victim: parent,
      damage: this.burnDps,
      damage_type: DamageTypes.MAGICAL,
    });

    SendOverheadEventMessage(
      undefined,
      OverheadAlert.BONUS_SPELL_DAMAGE,
      parent,
      actualDamage,
      undefined,
    );
  }

  GetEffectName(): string {
    return 'particles/items4_fx/meteor_hammer_spell_debuff.vpcf';
  }
}

@registerModifier('modifier_item_arcane_blink_buff')
export class ModifierItemArcaneBlinkBuff extends BaseModifier {
  private castPctImprovement: number = 0;
  private baseCooldown: number = 0;

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return true;
  }

  IsDebuff(): boolean {
    return false;
  }

  GetAbilityTextureName(): string {
    return 'item_arcane_blink';
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.CASTTIME_PERCENTAGE,
      ModifierFunction.COOLDOWN_PERCENTAGE,
      ModifierFunction.TOOLTIP,
    ];
  }

  OnCreated(): void {
    const ability = this.GetAbility();
    if (!ability || ability.IsNull()) {
      this.Destroy();
      return;
    }
    this.castPctImprovement = ability.GetSpecialValueFor('cast_pct_improvement') || 0;
    this.baseCooldown = ability.GetSpecialValueFor('base_cooldown') || 0;
  }

  // 假的施法时间修饰符，所有计算都在 modifier_casttime_handler 中完成
  GetModifierPercentageCasttime(): number {
    return this.castPctImprovement;
  }

  GetModifierPercentageCooldown(): number {
    return this.baseCooldown;
  }

  OnTooltip(): number {
    return this.castPctImprovement;
  }
}
