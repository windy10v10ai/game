import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

const SCRIPT_PATH = 'abilities/ts_abilities/terrorblade_sunder_awakened';
const SUNDER_ABILITY = 'terrorblade_sunder_awakened';
const SUNDER_PARTICLE = 'particles/units/heroes/hero_terrorblade/terrorblade_sunder.vpcf';

/** 恐怖利刃 魂断觉醒。 */
@registerAbility('terrorblade_sunder_awakened')
export class TerrorbladeSunderAwakened extends BaseAbility {
  GetAOERadius(): number {
    return this.GetSpecialValueFor('radius');
  }

  OnSpellStart(): void {
    if (!IsServer()) return;
    this.sunderEnemies(this.findEnemyHeroes(this.GetCursorPosition()));
  }

  tryAutomaticSunder(): void {
    const caster = this.GetCaster();
    if (!caster.IsRealHero() || !caster.IsAlive()) return;
    if (!this.IsActivated() || this.GetLevel() <= 0) return;
    if (caster.GetHealthPercent() >= this.GetSpecialValueFor('auto_trigger_health_pct')) return;
    if (this.GetCooldownTimeRemaining() > 0 || caster.GetMana() < this.GetManaCost(-1)) return;

    // 自动触发不依赖施法命令；被控制时直接以 TB 自身为范围中心结算。
    const enemies = this.findEnemyHeroes(caster.GetAbsOrigin());
    if (enemies.length === 0) return;

    this.UseResources(true, false, false, true);
    this.sunderEnemies(enemies);
  }

  private findEnemyHeroes(center: Vector): CDOTA_BaseNPC_Hero[] {
    const caster = this.GetCaster();
    return FindUnitsInRadius(
      caster.GetTeamNumber(),
      center,
      undefined,
      this.GetSpecialValueFor('radius'),
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO,
      UnitTargetFlags.MAGIC_IMMUNE_ENEMIES + UnitTargetFlags.NOT_ILLUSIONS,
      FindOrder.ANY,
      false,
    ).filter((unit): unit is CDOTA_BaseNPC_Hero => unit.IsRealHero() && unit.IsAlive());
  }

  private sunderEnemies(enemies: CDOTA_BaseNPC_Hero[]): void {
    if (enemies.length === 0) return;

    const caster = this.GetCaster();
    const casterHealthRatio = caster.GetHealth() / caster.GetMaxHealth();
    let highestEnemyHealthRatio = 0;

    for (const enemy of enemies) {
      highestEnemyHealthRatio = Math.max(
        highestEnemyHealthRatio,
        enemy.GetHealth() / enemy.GetMaxHealth(),
      );
    }

    for (const enemy of enemies) {
      enemy.SetHealth(Math.max(1, Math.floor(enemy.GetMaxHealth() * casterHealthRatio)));
      this.playSunderEffect(caster, enemy);
    }

    caster.SetHealth(Math.max(1, Math.floor(caster.GetMaxHealth() * highestEnemyHealthRatio)));
    caster.EmitSound('Hero_Terrorblade.Sunder.Cast');
  }

  private playSunderEffect(caster: CDOTA_BaseNPC, target: CDOTA_BaseNPC): void {
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
    target.EmitSound('Hero_Terrorblade.Sunder.Target');
  }
}

/** 独立承载觉醒状态，避免终极技能等级限制 intrinsic modifier 的创建。 */
@registerAbility('terrorblade_sunder_awakened_status')
export class TerrorbladeSunderAwakenedStatus extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_terrorblade_sunder_awakened.name;
  }
}

@registerModifier(SCRIPT_PATH)
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_terrorblade_sunder_awakened extends BaseModifier {
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
    this.StartIntervalThink(0.1);
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;
    const ability = this.GetParent().FindAbilityByName(SUNDER_ABILITY) as
      | TerrorbladeSunderAwakened
      | undefined;
    if (!ability || ability.IsNull()) return;
    ability.tryAutomaticSunder();
  }
}
