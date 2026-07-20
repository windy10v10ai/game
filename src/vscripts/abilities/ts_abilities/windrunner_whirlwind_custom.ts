import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

@registerAbility('windrunner_whirlwind_custom')
export class WindrunnerWhirlwindCustom extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return 'modifier_windrunner_whirlwind_custom_windrun_stealth';
  }

  OnSpellStart(): void {
    const caster = this.GetCaster();
    caster.AddNewModifier(caster, this, 'modifier_windrunner_whirlwind_custom', {
      duration: this.GetSpecialValueFor('duration'),
    });
  }
}

/**
 * 风行者 觉醒：学会旋风后，施放风行(windrunner_windrun)借用隐刺的隐身效果，限时生效。
 * 迁移自原 special_bonus_unique_windrunner_upgrade。
 */
@registerModifier('abilities/ts_abilities/windrunner_whirlwind_custom')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_windrunner_whirlwind_custom_windrun_stealth extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_ABILITY_FULLY_CAST];
  }

  OnAbilityFullyCast(event: ModifierAbilityEvent): void {
    if (!IsServer()) return;
    const parent = this.GetParent();
    if (event.unit !== parent) return;

    const ability = event.ability;
    if (ability.GetAbilityName() !== 'windrunner_windrun') return;

    const duration = ability.GetSpecialValueFor('AbilityDuration');
    if (duration <= 0) return;

    const selfAbility = this.GetAbility();
    const fadeDelay = selfAbility?.GetSpecialValueFor('fade_delay') ?? 0;

    const invis = parent.AddNewModifier(parent, selfAbility, 'modifier_riki_backstab', {
      duration,
      fade_delay: fadeDelay,
    });
    if (!invis) return;

    Timers.CreateTimer(duration, () => {
      if (invis.IsNull()) return;
      invis.Destroy();
    });
  }
}

@registerModifier('abilities/ts_abilities/windrunner_whirlwind_custom')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_windrunner_whirlwind_custom extends BaseModifier {
  private attacksPerSecond = 0;
  private damageReduction = 0;
  private searchRadiusBonus = 0;
  private repeatBlockCount = 0;
  private recentTargets: EntityIndex[] = [];
  private registeringWhirlwindAttack = false;
  private whirlwindAttackRecords: Record<number, boolean> = {};

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  GetTexture(): string {
    return 'windrunner_focusfire';
  }

  OnCreated(): void {
    this.refreshValues();
    if (!IsServer()) return;

    this.recentTargets = [];
    this.whirlwindAttackRecords = {};
    this.tryFireAttack();
    this.StartIntervalThink(1 / this.attacksPerSecond);
  }

  OnRefresh(): void {
    this.refreshValues();
    if (!IsServer()) return;

    this.recentTargets = [];
    this.tryFireAttack();
    this.StartIntervalThink(1 / this.attacksPerSecond);
  }

  OnIntervalThink(): void {
    this.tryFireAttack();
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.DAMAGEOUTGOING_PERCENTAGE,
      ModifierFunction.ON_ATTACK_RECORD,
      ModifierFunction.ON_ATTACK_RECORD_DESTROY,
      ModifierFunction.TOOLTIP,
      ModifierFunction.TOOLTIP2,
    ];
  }

  OnAttackRecord(event: ModifierAttackEvent): void {
    if (!IsServer()) return;
    if (event.attacker !== this.GetParent() || !this.registeringWhirlwindAttack) return;

    this.whirlwindAttackRecords[event.record] = true;
  }

  OnAttackRecordDestroy(event: ModifierAttackEvent): void {
    if (!IsServer()) return;
    delete this.whirlwindAttackRecords[event.record];
  }

  IsRegisteringWhirlwindAttack(): boolean {
    return this.registeringWhirlwindAttack;
  }

  IsWhirlwindAttackRecord(record: number): boolean {
    return this.whirlwindAttackRecords[record] === true;
  }

  GetModifierDamageOutgoing_Percentage(event: ModifierAttackEvent): number {
    return this.whirlwindAttackRecords[event.record] ? this.damageReduction : 0;
  }

  OnTooltip(): number {
    return this.attacksPerSecond;
  }

  OnTooltip2(): number {
    return -this.damageReduction;
  }

  private refreshValues(): void {
    const ability = this.GetAbility();
    if (!ability) return;

    this.attacksPerSecond = ability.GetSpecialValueFor('attacks_per_second');
    this.damageReduction = ability.GetSpecialValueFor('damage_reduction');
    this.searchRadiusBonus = ability.GetSpecialValueFor('search_radius_bonus');
    this.repeatBlockCount = ability.GetSpecialValueFor('repeat_block_count');
  }

  private tryFireAttack(): void {
    const parent = this.GetParent();
    if (
      !parent.IsAlive() ||
      parent.IsDisarmed() ||
      parent.IsStunned() ||
      parent.IsHexed() ||
      parent.IsChanneling()
    ) {
      return;
    }

    const target = this.selectTarget(parent);
    if (!target) return;

    this.rememberTarget(target);
    this.registeringWhirlwindAttack = true;
    parent.PerformAttack(target, true, true, true, false, parent.IsRangedAttacker(), false, false);
    this.registeringWhirlwindAttack = false;
  }

  private selectTarget(parent: CDOTA_BaseNPC): CDOTA_BaseNPC | undefined {
    const enemies = FindUnitsInRadius(
      parent.GetTeamNumber(),
      parent.GetAbsOrigin(),
      undefined,
      parent.Script_GetAttackRange() + this.searchRadiusBonus,
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO + UnitTargetType.BASIC,
      UnitTargetFlags.FOW_VISIBLE + UnitTargetFlags.NO_INVIS,
      FindOrder.ANY,
      false,
    ).filter((enemy) => this.isValidTarget(enemy));

    const priorityTargets = enemies.filter((enemy) => enemy.IsHero() || enemy.IsBoss());
    const targetPool = priorityTargets.length > 0 ? priorityTargets : enemies;
    if (targetPool.length === 0) return undefined;

    const freshTargets = targetPool.filter((enemy) => !this.wasRecentlyTargeted(enemy));
    const candidates = freshTargets.length > 0 ? freshTargets : targetPool;
    return candidates[RandomInt(0, candidates.length - 1)];
  }

  private isValidTarget(target: CDOTA_BaseNPC): boolean {
    return (
      !target.IsNull() &&
      target.IsAlive() &&
      !target.IsBuilding() &&
      !target.IsWard() &&
      !target.IsInvulnerable()
    );
  }

  private wasRecentlyTargeted(target: CDOTA_BaseNPC): boolean {
    const targetIndex = target.entindex();
    for (const recentTarget of this.recentTargets) {
      if (recentTarget === targetIndex) return true;
    }
    return false;
  }

  private rememberTarget(target: CDOTA_BaseNPC): void {
    this.recentTargets.push(target.entindex());
    while (this.recentTargets.length > this.repeatBlockCount) {
      this.recentTargets.shift();
    }
  }
}
