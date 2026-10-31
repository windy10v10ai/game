import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { findEnemiesInRange, getFullCastRange } from './shared/auto-cast-ability';

const NATIVE_SUNDER = 'terrorblade_sunder';
const SUNDER_PARTICLE = 'particles/units/heroes/hero_terrorblade/terrorblade_sunder.vpcf';

/** 恐怖利刃 魂断觉醒：原生魂断保留在原槽位，本技能只负责低血自动触发。 */
@registerAbility('terrorblade_sunder_awakened_status')
export class TerrorbladeSunderAwakenedStatus extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_terrorblade_sunder_awakened_status.name;
  }
}

@registerModifier('abilities/ts_abilities/terrorblade_sunder_awakened_status')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_terrorblade_sunder_awakened_status extends BaseModifier {
  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  GetTexture(): string {
    return 'terrorblade_sunder';
  }

  OnCreated(): void {
    if (!IsServer()) return;
    this.StartIntervalThink(0.3);
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;

    const caster = this.GetParent();
    if (!caster.IsRealHero() || !caster.IsAlive()) return;

    const ability = this.GetAbility();
    if (ability === undefined) return;
    if (caster.GetHealthPercent() >= ability.GetSpecialValueFor('auto_trigger_health_pct')) return;

    const sunder = caster.FindAbilityByName(NATIVE_SUNDER);
    if (
      sunder === undefined ||
      sunder.GetLevel() <= 0 ||
      !sunder.IsCooldownReady() ||
      !sunder.IsOwnersManaEnough()
    ) {
      return;
    }

    const target = this.findBestTarget(caster, sunder);
    if (target === undefined) return;

    // 原生魂断的施放逻辑在施法者被控制时不生效，自动触发自行结算换血
    this.swapHealth(caster, target, sunder);
    sunder.UseResources(true, false, false, true);
  }

  private swapHealth(caster: CDOTA_BaseNPC, target: CDOTA_BaseNPC, sunder: CDOTABaseAbility): void {
    const minimumRatio = sunder.GetSpecialValueFor('hit_point_minimum_pct') / 100;
    const casterRatio = Math.max(caster.GetHealth() / caster.GetMaxHealth(), minimumRatio);
    const targetRatio = Math.max(target.GetHealth() / target.GetMaxHealth(), minimumRatio);

    caster.SetHealth(Math.max(1, caster.GetMaxHealth() * targetRatio));
    if (!target.IsDebuffImmune()) {
      target.SetHealth(Math.max(1, target.GetMaxHealth() * casterRatio));
    }

    const particle = ParticleManager.CreateParticle(
      SUNDER_PARTICLE,
      ParticleAttachment.ABSORIGIN_FOLLOW,
      target,
    );
    ParticleManager.SetParticleControlEnt(
      particle,
      0,
      caster,
      ParticleAttachment.POINT_FOLLOW,
      'attach_hitloc',
      caster.GetAbsOrigin(),
      true,
    );
    ParticleManager.SetParticleControlEnt(
      particle,
      1,
      target,
      ParticleAttachment.POINT_FOLLOW,
      'attach_hitloc',
      target.GetAbsOrigin(),
      true,
    );
    ParticleManager.ReleaseParticleIndex(particle);
    caster.EmitSound('Hero_Terrorblade.Sunder.Cast');
    target.EmitSound('Hero_Terrorblade.Sunder.Target');
  }

  /** 施法距离内生命百分比最高的真实敌方英雄；该百分比须高于自己才值得交换 */
  private findBestTarget(
    caster: CDOTA_BaseNPC,
    sunder: CDOTABaseAbility,
  ): CDOTA_BaseNPC | undefined {
    const range = getFullCastRange(caster, sunder);
    const enemies = findEnemiesInRange(
      caster,
      range,
      UnitTargetType.HERO,
      UnitTargetFlags.MAGIC_IMMUNE_ENEMIES + UnitTargetFlags.NOT_ILLUSIONS,
    ).filter((unit) => unit.IsRealHero() && unit.IsAlive());

    let best: CDOTA_BaseNPC | undefined;
    let bestHealthPct = caster.GetHealthPercent();
    for (const enemy of enemies) {
      const healthPct = enemy.GetHealthPercent();
      if (healthPct > bestHealthPct) {
        bestHealthPct = healthPct;
        best = enemy;
      }
    }
    return best;
  }
}
