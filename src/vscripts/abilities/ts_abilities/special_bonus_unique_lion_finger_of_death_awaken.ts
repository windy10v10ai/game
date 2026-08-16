import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import {
  calculateCurrentFingerDamage,
  calculateFingerMeleeBonusDamage,
  calculateMissingHealthBonusDamage,
  calculateObservedGrowthDelta,
  initializeObservedGrowthStacks,
  settlePendingGrowthCooldown,
} from './lion-finger-of-death-awaken-math';
import { HeroUtil } from '../../ai/hero/hero-util';
import { findEnemiesInRange, getFullCastRange } from './shared/auto-cast-ability';

const FINGER_OF_DEATH_ABILITY = 'lion_finger_of_death';
const FINGER_GROWTH_MODIFIER = 'modifier_lion_finger_of_death_kill_counter';
const FINGER_DELAY_MODIFIER = 'modifier_lion_finger_of_death_delay';
const FINGER_MELEE_MODIFIER = 'modifier_lion_finger_punch';
const GROWTH_POLL_INTERVAL = 0.1;
const AUTO_CAST_INTERVAL = 0.3;
const MAX_SPELL_ABSORB_LAYERS = 16;
const AWAKEN_ICON = 'lion_finger_of_death';

interface FingerTargetSnapshot {
  health: number;
  maxHealth: number;
}

interface FingerCastSnapshots {
  id: number;
  remainingTargets: number;
  targets: Record<number, FingerTargetSnapshot | undefined>;
}

@registerAbility('special_bonus_unique_lion_finger_of_death_awaken')
export class SpecialBonusUniqueLionFingerOfDeathAwaken extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_lion_finger_of_death_awaken.name;
  }
}

/** 观察死亡一指的成长与延迟标记，为觉醒伤害、冷却反馈和近战附伤提供状态。 */
@registerModifier('abilities/ts_abilities/special_bonus_unique_lion_finger_of_death_awaken')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_lion_finger_of_death_awaken extends BaseModifier {
  private observedGrowthStacks?: number;
  private pendingGrowthDelta = 0;
  private applyingAwakenDamage = false;
  private castSnapshots: FingerCastSnapshots[] = [];
  private nextSnapshotId = 0;
  private nextAutoCastTime = 0;
  private lastFingerDamage = 0;

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  IsBuff(): boolean {
    return true;
  }

  GetTexture(): string {
    return AWAKEN_ICON;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.ON_ABILITY_FULLY_CAST,
      ModifierFunction.ON_ATTACK_LANDED,
      ModifierFunction.ON_TAKEDAMAGE,
    ];
  }

  OnAbilityFullyCast(event: ModifierAbilityEvent): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    if (event.unit !== parent || event.ability.GetAbilityName() !== FINGER_OF_DEATH_ABILITY) return;

    this.updateFingerDamage(event.ability);
    this.scheduleFingerTargetSnapshots();
  }

  OnAttackLanded(event: ModifierAttackEvent): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    const target = event.target;
    if (
      event.attacker !== parent ||
      event.no_attack_cooldown ||
      !parent.IsRealHero() ||
      parent.IsIllusion() ||
      parent.PassivesDisabled() ||
      !parent.HasModifier(FINGER_MELEE_MODIFIER) ||
      !target ||
      target.IsNull() ||
      !target.IsAlive() ||
      target.GetTeamNumber() === parent.GetTeamNumber() ||
      target.IsBuilding() ||
      target.IsOther()
    ) {
      return;
    }

    const awaken = this.GetAbility();
    if (!awaken || awaken.IsNull()) return;

    const finger = parent.FindAbilityByName(FINGER_OF_DEATH_ABILITY);
    if (finger && !finger.IsNull()) this.updateFingerDamage(finger);

    const bonusDamage = calculateFingerMeleeBonusDamage(
      this.lastFingerDamage,
      awaken.GetSpecialValueFor('melee_finger_damage_pct'),
    );
    if (bonusDamage <= 0) return;

    this.applyingAwakenDamage = true;
    try {
      ApplyDamage({
        victim: target,
        attacker: parent,
        damage: bonusDamage,
        damage_type: DamageTypes.MAGICAL,
        ability: awaken,
      });
    } finally {
      this.applyingAwakenDamage = false;
    }
  }

  private scheduleFingerTargetSnapshots(): void {
    const parent = this.GetParent();
    const cast: FingerCastSnapshots = {
      id: ++this.nextSnapshotId,
      remainingTargets: 0,
      targets: {},
    };
    // The native delay marker is applied by Finger's own cast path. Scan on the next frame so
    // the engine can finish attaching every Scepter target marker before its delayed damage.
    Timers.CreateTimer(0, () => {
      if (this.IsNull()) return;

      for (const hero of HeroList.GetAllHeroes()) {
        if (hero.IsNull()) continue;
        if (hero.GetTeamNumber() === parent.GetTeamNumber()) continue;
        if (!hero.IsRealHero() || hero.IsIllusion()) continue;
        if (!hero.FindModifierByNameAndCaster(FINGER_DELAY_MODIFIER, parent)) continue;

        cast.targets[hero.GetEntityIndex()] = {
          health: hero.GetHealth(),
          maxHealth: hero.GetMaxHealth(),
        };
        cast.remainingTargets += 1;
      }

      if (cast.remainingTargets <= 0) return;
      this.castSnapshots.push(cast);
      // Native Finger resolves shortly after applying its delay marker. Expire an unmatched
      // batch defensively so immunity or an interrupted native path cannot retain stale data.
      Timers.CreateTimer(3, () => this.removeCastSnapshots(cast.id));
    });
  }

  private updateFingerDamage(finger: CDOTABaseAbility): void {
    const growth = this.GetParent().FindModifierByName(FINGER_GROWTH_MODIFIER);
    this.lastFingerDamage = calculateCurrentFingerDamage(
      finger.GetSpecialValueFor('damage'),
      growth ? growth.GetStackCount() : 0,
      finger.GetSpecialValueFor('damage_per_kill'),
    );
  }

  private removeCastSnapshots(id: number): void {
    const index = this.castSnapshots.findIndex((cast) => cast.id === id);
    if (index >= 0) this.castSnapshots.splice(index, 1);
  }

  OnCreated(): void {
    if (!IsServer()) return;

    const growth = this.GetParent().FindModifierByName(FINGER_GROWTH_MODIFIER);
    this.observedGrowthStacks = initializeObservedGrowthStacks(
      growth ? growth.GetStackCount() : undefined,
    );
    this.StartIntervalThink(GROWTH_POLL_INTERVAL);
  }

  OnTakeDamage(event: ModifierInstanceEvent): void {
    if (!IsServer() || this.applyingAwakenDamage) return;

    const parent = this.GetParent();
    const inflictor = event.inflictor;
    if (event.attacker !== parent || !inflictor) return;
    if (inflictor.GetAbilityName() !== FINGER_OF_DEATH_ABILITY) return;

    const target = event.unit;
    if (!target || target.IsNull()) return;
    if (target.GetTeamNumber() === parent.GetTeamNumber()) return;

    const targetIndex = target.GetEntityIndex();
    const cast = this.castSnapshots.find((entry) => entry.targets[targetIndex] !== undefined);
    const snapshot = cast?.targets[targetIndex];
    if (!cast || !snapshot) return;
    cast.targets[targetIndex] = undefined;
    cast.remainingTargets -= 1;
    if (cast.remainingTargets <= 0) this.removeCastSnapshots(cast.id);

    const ability = this.GetAbility();
    if (!ability || ability.IsNull()) return;

    const bonusDamage = calculateMissingHealthBonusDamage(
      snapshot.health,
      snapshot.maxHealth,
      ability.GetSpecialValueFor('missing_health_damage_pct'),
    );
    if (bonusDamage <= 0) return;

    this.applyingAwakenDamage = true;
    try {
      ApplyDamage({
        victim: target,
        attacker: parent,
        damage: bonusDamage,
        damage_type: DamageTypes.MAGICAL,
        ability: inflictor,
      });
    } finally {
      this.applyingAwakenDamage = false;
    }
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    this.tryAutoCastFinger(parent);
    const growth = parent.FindModifierByName(FINGER_GROWTH_MODIFIER);
    if (!growth) return;

    const currentStacks = growth.GetStackCount();
    const observation = calculateObservedGrowthDelta(this.observedGrowthStacks, currentStacks);
    this.observedGrowthStacks = observation.nextStackCount;
    this.pendingGrowthDelta += observation.delta;
    if (this.pendingGrowthDelta <= 0) return;

    const finger = parent.FindAbilityByName(FINGER_OF_DEATH_ABILITY);
    const awaken = this.GetAbility();
    if (!finger || !awaken || awaken.IsNull()) return;
    this.updateFingerDamage(finger);

    const currentRemaining = finger.GetCooldownTimeRemaining();
    const settlement = settlePendingGrowthCooldown(
      this.pendingGrowthDelta,
      currentRemaining,
      awaken.GetSpecialValueFor('cooldown_reduction_per_growth'),
    );
    this.pendingGrowthDelta = settlement.pendingGrowthDelta;
    const reducedRemaining = settlement.nextRemainingCooldown;
    if (currentRemaining <= 0 || reducedRemaining === undefined) return;

    finger.EndCooldown();
    if (reducedRemaining > 0) finger.StartCooldown(reducedRemaining);
  }

  private tryAutoCastFinger(parent: CDOTA_BaseNPC): void {
    const now = GameRules.GetGameTime();
    if (now < this.nextAutoCastTime) return;
    this.nextAutoCastTime = now + AUTO_CAST_INTERVAL;

    const awaken = this.GetAbility();
    if (!awaken || awaken.IsNull()) return;
    if (HeroUtil.NotActionable(parent) || parent.IsSilenced() || parent.IsChanneling()) return;

    const finger = parent.FindAbilityByName(FINGER_OF_DEATH_ABILITY);
    if (
      !finger ||
      finger.IsNull() ||
      finger.IsHidden() ||
      !finger.IsActivated() ||
      !finger.IsFullyCastable()
    ) {
      return;
    }

    const enemies = findEnemiesInRange(
      parent,
      getFullCastRange(parent, finger),
      UnitTargetType.HERO,
      UnitTargetFlags.NOT_ILLUSIONS,
    );
    let target: CDOTA_BaseNPC | undefined;
    for (const enemy of enemies) {
      if (!enemy.IsRealHero() || enemy.IsIllusion()) continue;
      if (!target || enemy.GetHealth() < target.GetHealth()) target = enemy;
    }
    if (!target) return;

    for (let layer = 0; layer < MAX_SPELL_ABSORB_LAYERS; layer++) {
      if (!target.TriggerSpellAbsorb(finger)) break;
    }

    const previousTarget = parent.GetCursorCastTarget();
    try {
      parent.SetCursorCastTarget(target);
      this.updateFingerDamage(finger);
      finger.UseResources(true, false, false, true);
      finger.OnSpellStart();
      this.scheduleFingerTargetSnapshots();
    } finally {
      parent.SetCursorCastTarget(previousTarget);
    }
  }
}
