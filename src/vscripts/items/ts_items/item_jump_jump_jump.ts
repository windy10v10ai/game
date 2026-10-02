import { calculateStatusResistedDuration } from '../../utils/damage-calculation';
import {
  BaseItem,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { BaseItemModifier } from './base_item_modifier';

/** 跳！跳！跳！刀：正常施放跳过去化身流星砸下，备用施放原地召唤星落砸远处。 */
@registerAbility('item_jump_jump_jump')
export class ItemJumpJumpJump extends BaseItem {
  GetIntrinsicModifierName(): string {
    return ModifierItemJumpJumpJumpPassive.name;
  }

  GetCastRange(): number {
    return this.GetSpecialValueFor(this.IsAltCastArmed() ? 'remote_cast_range' : 'blink_range');
  }

  GetAOERadius(): number {
    return this.GetSpecialValueFor('impact_radius');
  }

  // 定身只拦跳刀，原地召唤星落不受影响，所以不用 KV 的 ROOT_DISABLES
  CastFilterResultLocation(): UnitFilterResult {
    if (IsServer() && !this.IsAltCastArmed() && this.GetCaster().IsRooted()) {
      return UnitFilterResult.FAIL_CUSTOM;
    }
    return UnitFilterResult.SUCCESS;
  }

  GetCustomCastErrorLocation(): string {
    return '#dota_hud_error_jump_jump_jump_rooted';
  }

  // 客户端没有备用施法状态的接口，选点圈与施法过滤在客户端一律按跳刀处理，由服务端裁定
  private IsAltCastArmed(): boolean {
    return IsServer() && this.GetAltCastState();
  }

  OnSpellStart(): void {
    if (this.ShouldAltCast()) {
      this.CallMeteor();
    } else {
      this.BlinkAndFall();
    }
  }

  private BlinkAndFall(): void {
    const caster = this.GetCaster();
    const target = this.GetCursorPosition();

    caster.EmitSound('DOTA_Item.BlinkDagger.Activate');
    const startFx = ParticleManager.CreateParticle(
      'particles/items_fx/blink_dagger_start.vpcf',
      ParticleAttachment.ABSORIGIN,
      caster,
    );
    ParticleManager.ReleaseParticleIndex(startFx);

    FindClearSpaceForUnit(caster, target, true);
    ProjectileManager.ProjectileDodge(caster);

    caster.EmitSound('DOTA_Item.MeteorHammer.Cast');
    caster.EmitSound('Blink_Layer.Swift');
    caster.EmitSound('Blink_Layer.Arcane');
    const endFx = ParticleManager.CreateParticle(
      'particles/items_fx/blink_dagger_end.vpcf',
      ParticleAttachment.ABSORIGIN,
      caster,
    );
    ParticleManager.ReleaseParticleIndex(endFx);

    const fallTime = this.GetSpecialValueFor('meteor_fall_time');
    this.PlayMeteorFall(caster.GetAbsOrigin(), fallTime);
    caster.AddNewModifier(caster, this, modifier_item_jump_jump_jump_meteor_form.name, {
      duration: fallTime,
    });

    Timers.CreateTimer(fallTime, () => {
      if (!IsValidEntity(this) || !IsValidEntity(caster)) return;
      this.OnLanded(caster);
    });
  }

  private OnLanded(caster: CDOTA_BaseNPC): void {
    const origin = caster.GetAbsOrigin();
    const radius = this.GetSpecialValueFor('impact_radius');

    caster.EmitSound('Blink_Layer.Overwhelming');
    const burstFx = ParticleManager.CreateParticle(
      'particles/items3_fx/blink_overwhelming_burst.vpcf',
      ParticleAttachment.CUSTOMORIGIN,
      caster,
    );
    ParticleManager.SetParticleControl(burstFx, 0, origin);
    ParticleManager.SetParticleControl(burstFx, 1, Vector(radius, radius, radius));
    ParticleManager.ReleaseParticleIndex(burstFx);

    caster.AddNewModifier(caster, this, 'modifier_item_swift_blink_buff', {
      duration: this.GetSpecialValueFor('buff_duration'),
    });

    const heal = this.GetSpecialValueFor('heal_amount');
    const mana = this.GetSpecialValueFor('mana_amount');
    caster.Heal(heal, this);
    caster.GiveMana(mana);
    SendOverheadEventMessage(undefined, OverheadAlert.HEAL, caster, heal, undefined);
    SendOverheadEventMessage(undefined, OverheadAlert.MANA_ADD, caster, mana, undefined);

    const slowDuration =
      this.GetSpecialValueFor('stun_duration') + this.GetSpecialValueFor('slow_duration');
    for (const enemy of this.Impact(caster, origin)) {
      if (enemy.IsBuilding()) continue;
      enemy.AddNewModifier(caster, this, 'modifier_item_overwhelming_blink_debuff', {
        duration: calculateStatusResistedDuration(slowDuration, enemy),
      });
    }
  }

  private CallMeteor(): void {
    const caster = this.GetCaster();
    const target = this.GetCursorPosition();
    const landTime = this.GetSpecialValueFor('remote_land_time');

    caster.EmitSound('DOTA_Item.MeteorHammer.Cast');
    this.PlayMeteorFall(target, landTime);

    Timers.CreateTimer(landTime, () => {
      if (!IsValidEntity(this) || !IsValidEntity(caster)) return;
      this.Impact(caster, target);
    });
  }

  private PlayMeteorFall(target: Vector, fallTime: number): void {
    const fx = ParticleManager.CreateParticle(
      'particles/items4_fx/meteor_hammer_spell.vpcf',
      ParticleAttachment.WORLDORIGIN,
      undefined,
    );
    ParticleManager.SetParticleControl(fx, 0, target.__add(Vector(0, 0, 1000)));
    ParticleManager.SetParticleControl(fx, 1, target);
    ParticleManager.SetParticleControl(fx, 2, Vector(fallTime, 0, 0));
    ParticleManager.ReleaseParticleIndex(fx);
  }

  /** 流星落地：冲击伤害、眩晕与燃烧，返回命中的敌人供调用方追加效果。 */
  private Impact(caster: CDOTA_BaseNPC, origin: Vector): CDOTA_BaseNPC[] {
    EmitSoundOnLocationWithCaster(origin, 'DOTA_Item.MeteorHammer.Impact', caster);

    const enemies = FindUnitsInRadius(
      caster.GetTeamNumber(),
      origin,
      undefined,
      this.GetSpecialValueFor('impact_radius'),
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO + UnitTargetType.BASIC + UnitTargetType.BUILDING,
      UnitTargetFlags.NONE,
      FindOrder.ANY,
      false,
    );

    const stunDuration = this.GetSpecialValueFor('stun_duration');
    const burnDuration = this.GetSpecialValueFor('burn_duration');
    // 非英雄单位持有时没有属性，只打固定伤害
    const allStats = caster.IsHero()
      ? caster.GetStrength() + caster.GetAgility() + caster.GetIntellect(false)
      : 0;
    const buildingDamage =
      this.GetSpecialValueFor('impact_damage_buildings') +
      (allStats * this.GetSpecialValueFor('impact_stat_pct_buildings')) / 100;
    const unitDamage =
      this.GetSpecialValueFor('impact_damage_units') +
      (allStats * this.GetSpecialValueFor('impact_stat_pct_units')) / 100;
    for (const enemy of enemies) {
      const isBuilding = enemy.IsBuilding();
      ApplyDamage({
        attacker: caster,
        victim: enemy,
        damage: isBuilding ? buildingDamage : unitDamage,
        damage_type: DamageTypes.MAGICAL,
        ability: this,
      });
      enemy.AddNewModifier(caster, this, 'modifier_item_meteor_hammer_burn', {
        duration: calculateStatusResistedDuration(burnDuration, enemy),
      });
      if (!isBuilding) {
        enemy.AddNewModifier(caster, this, 'modifier_stunned', {
          duration: calculateStatusResistedDuration(stunDuration, enemy),
        });
      }
    }
    return enemies;
  }
}

@registerModifier('items/ts_items/item_jump_jump_jump', 'modifier_item_jump_jump_jump')
export class ModifierItemJumpJumpJumpPassive extends BaseItemModifier {
  override statsModifierName = '';
  override vanillaModifierNames = ['modifier_item_meteor_hammer', 'modifier_item_blink_dagger'];
}

// eslint-disable-next-line @typescript-eslint/naming-convention
@registerModifier('items/ts_items/item_jump_jump_jump')
export class modifier_item_jump_jump_jump_meteor_form extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return {
      [ModifierState.STUNNED]: true,
      [ModifierState.INVULNERABLE]: true,
      [ModifierState.UNSELECTABLE]: true,
      [ModifierState.NO_HEALTH_BAR]: true,
      [ModifierState.NO_UNIT_COLLISION]: true,
      [ModifierState.OUT_OF_GAME]: true,
      [ModifierState.UNTARGETABLE]: true,
    };
  }

  OnCreated(): void {
    if (IsServer()) this.GetParent().AddNoDraw();
  }

  OnDestroy(): void {
    if (IsServer()) this.GetParent().RemoveNoDraw();
  }
}
