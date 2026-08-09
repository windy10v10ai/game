import { PlayerHelper } from '../../modules/helper/player-helper';
import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { advanceTrackingProjectile } from './fountain-anti-camp-logic';

const WATCHER_MODIFIER_NAME = 'modifier_fountain_anti_camp_watcher';
const STACK_MODIFIER_NAME = 'modifier_fountain_anti_camp_stack';
const LOCK_MODIFIER_NAME = 'modifier_fountain_anti_camp_lock';
const POLL_INTERVAL = 1;
const DEBUFF_DURATION = 3;
const LOCK_STACK_THRESHOLD = 3;

const RETALIATION_PROJECTILE = 'particles/base_attacks/ranged_tower_good.vpcf';
const RETALIATION_HIT_RADIUS = 128;
const RETALIATION_MAX_TRAVEL_TIME = 20;
// 反击伤害是按最大生命值算的固定值，排除掉所有会改变它的途径
const RETALIATION_DAMAGE_FLAGS =
  DamageFlag.BYPASSES_INVULNERABILITY +
  DamageFlag.HPLOSS +
  DamageFlag.NO_DAMAGE_MULTIPLIERS +
  DamageFlag.NO_SPELL_AMPLIFICATION +
  DamageFlag.NO_SPELL_LIFESTEAL +
  DamageFlag.BYPASSES_ALL_BLOCK +
  DamageFlag.NO_REFLECTION;

interface RetaliationProjectile {
  target: CDOTA_BaseNPC_Hero;
  damage: number;
  speed: number;
  position: { x: number; y: number };
  createdAt: number;
  lastUpdateAt: number;
}

@registerAbility('fountain_anti_camp')
export class AbilityFountainAntiCamp extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return WATCHER_MODIFIER_NAME;
  }
}

@registerModifier('abilities/ts_abilities/fountain_anti_camp')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_fountain_anti_camp_watcher extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  // 泉水作为地图内置实体，生成时机早于真实对局中玩家连接完毕，人数判断需等状态到 PRE_GAME 后才可信
  private checked = false;
  private retaliationProjectiles = new Map<ProjectileID, RetaliationProjectile>();

  OnCreated(): void {
    if (!IsServer()) return;
    if (this.GetParent().GetTeamNumber() !== DotaTeam.BADGUYS) return;
    this.StartIntervalThink(POLL_INTERVAL);
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;

    if (!this.checked) {
      const state = GameRules.State_Get();
      if (state < GameState.PRE_GAME) return;

      this.checked = true;
      const humanCount = PlayerHelper.GetHumamPlayerCount();
      // 仅在多人游戏中生效 (开发模式下允许单人测试生效)
      const canRun = IsInToolsMode() || humanCount >= 2;
      print(
        `[FountainAntiCamp] check state=${state} toolsMode=${IsInToolsMode()} humanCount=${humanCount} canRun=${canRun}`,
      );
      if (!canRun) {
        this.StartIntervalThink(-1);
        return;
      }
      ListenToGameEvent('entity_killed', (keys) => this.OnEntityKilled(keys), this);
    }

    const fountain = this.GetParent();
    const ability = this.GetAbility();
    if (!ability) return;

    const enemies = FindUnitsInRadius(
      fountain.GetTeamNumber(),
      fountain.GetAbsOrigin(),
      undefined,
      ability.GetSpecialValueFor('radius'),
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO,
      UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
      FindOrder.ANY,
      false,
    );

    for (const hero of enemies) {
      if (!hero.IsRealHero() || !PlayerHelper.IsHumanPlayer(hero)) continue;

      if (hero.HasModifier(LOCK_MODIFIER_NAME)) {
        hero.AddNewModifier(fountain, ability, LOCK_MODIFIER_NAME, { duration: DEBUFF_DURATION });
        continue;
      }

      const stackCount = (hero.FindModifierByName(STACK_MODIFIER_NAME)?.GetStackCount() ?? 0) + 1;

      if (stackCount >= LOCK_STACK_THRESHOLD) {
        hero.RemoveModifierByName(STACK_MODIFIER_NAME);
        hero.AddNewModifier(fountain, ability, LOCK_MODIFIER_NAME, { duration: DEBUFF_DURATION });
      } else {
        hero
          .AddNewModifier(fountain, ability, STACK_MODIFIER_NAME, { duration: DEBUFF_DURATION })
          .SetStackCount(stackCount);
      }
    }
  }

  private OnEntityKilled(keys: GameEventProvidedProperties & EntityKilledEvent): void {
    const fountain = this.GetParent();
    const ability = this.GetAbility();
    if (fountain.IsNull() || !ability) return;

    const victim = this.GetBaseNpc(keys.entindex_killed);
    if (!this.IsFountainAiHero(victim)) return;

    const radius = ability.GetSpecialValueFor('radius');
    if (victim.GetAbsOrigin().__sub(fountain.GetAbsOrigin()).Length2D() > radius) return;

    const target = this.ResolveHumanOwnerHero(this.GetBaseNpc(keys.entindex_attacker));
    if (!target || !target.IsAlive()) return;

    this.LaunchRetaliation(victim, target);
  }

  private IsFountainAiHero(unit: CDOTA_BaseNPC | undefined): unit is CDOTA_BaseNPC_Hero {
    return (
      unit !== undefined &&
      !unit.IsNull() &&
      unit.IsRealHero() &&
      unit.GetTeamNumber() === this.GetParent().GetTeamNumber() &&
      PlayerHelper.IsBotPlayerByPlayerId(unit.GetPlayerOwnerID())
    );
  }

  private LaunchRetaliation(victim: CDOTA_BaseNPC_Hero, target: CDOTA_BaseNPC_Hero): void {
    const fountain = this.GetParent();
    const ability = this.GetAbility();
    if (!ability) return;

    const damagePct = ability.GetSpecialValueFor('retaliation_damage_pct');
    const projectileSpeed = ability.GetSpecialValueFor('retaliation_projectile_speed');
    if (damagePct <= 0 || projectileSpeed <= 0) return;

    const sourceLocation = victim.GetAbsOrigin();
    const createdAt = GameRules.GetGameTime();
    const projectileId = ProjectileManager.CreateTrackingProjectile({
      Target: target,
      Source: fountain,
      Ability: ability,
      EffectName: RETALIATION_PROJECTILE,
      iMoveSpeed: projectileSpeed,
      vSourceLoc: sourceLocation,
      bDodgeable: false,
      bIgnoreObstructions: true,
      bSuppressTargetCheck: true,
    });

    this.retaliationProjectiles.set(projectileId, {
      target,
      damage: target.GetMaxHealth() * damagePct * 0.01,
      speed: projectileSpeed,
      position: { x: sourceLocation.x, y: sourceLocation.y },
      createdAt,
      lastUpdateAt: createdAt,
    });
    Timers.CreateTimer(FrameTime(), () => this.TrackRetaliationProjectile(projectileId));
  }

  private TrackRetaliationProjectile(projectileId: ProjectileID): number | void {
    if (this.IsNull()) return undefined;

    const projectile = this.retaliationProjectiles.get(projectileId);
    if (!projectile) return undefined;

    const target = projectile.target;
    if (target.IsNull() || !target.IsAlive()) {
      this.DestroyRetaliationProjectile(projectileId);
      return undefined;
    }

    const now = GameRules.GetGameTime();
    const targetLocation = target.GetAbsOrigin();
    const step = advanceTrackingProjectile(
      projectile.position,
      { x: targetLocation.x, y: targetLocation.y },
      projectile.speed * Math.max(FrameTime(), now - projectile.lastUpdateAt),
      RETALIATION_HIT_RADIUS,
    );
    projectile.position = step.position;
    projectile.lastUpdateAt = now;

    const timedOut = now - projectile.createdAt >= RETALIATION_MAX_TRAVEL_TIME;
    if (!step.reached && !timedOut) return FrameTime();

    this.DestroyRetaliationProjectile(projectileId);
    this.ApplyRetaliation(target, projectile.damage);
    return undefined;
  }

  private DestroyRetaliationProjectile(projectileId: ProjectileID): void {
    this.retaliationProjectiles.delete(projectileId);
    ProjectileManager.DestroyTrackingProjectile(projectileId);
  }

  private ApplyRetaliation(target: CDOTA_BaseNPC_Hero, damage: number): void {
    const fountain = this.GetParent();
    const ability = this.GetAbility();
    if (!ability || fountain.IsNull() || target.IsNull() || !target.IsAlive() || damage <= 0) {
      return;
    }

    ApplyDamage({
      victim: target,
      attacker: fountain,
      damage,
      damage_type: DamageTypes.PURE,
      damage_flags: RETALIATION_DAMAGE_FLAGS,
      ability,
    });
  }

  private GetBaseNpc(entityIndex: EntityIndex | undefined): CDOTA_BaseNPC | undefined {
    if (!entityIndex || entityIndex <= 0) return undefined;

    const entity = EntIndexToHScript(entityIndex);
    if (!entity || entity.IsNull() || !entity.IsBaseNPC()) return undefined;
    return entity;
  }

  private ResolveHumanOwnerHero(unit: CDOTA_BaseNPC | undefined): CDOTA_BaseNPC_Hero | undefined {
    const playerId = this.ResolveOwnerPlayerId(unit);
    if (playerId === undefined || !PlayerHelper.IsHumanPlayerByPlayerId(playerId)) {
      return undefined;
    }

    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    return hero && !hero.IsNull() && hero.IsRealHero() ? hero : undefined;
  }

  // 召唤物/幻象击杀时需沿 owner 链回溯到真正的玩家英雄
  private ResolveOwnerPlayerId(unit: CDOTA_BaseNPC | undefined): PlayerID | undefined {
    let current: CBaseEntity | undefined = unit;
    const visited = new Set<EntityIndex>();

    for (let depth = 0; current && depth < 8; depth++) {
      if (current.IsNull()) return undefined;

      const entityIndex = current.entindex();
      if (visited.has(entityIndex)) return undefined;
      visited.add(entityIndex);

      if (current.IsBaseNPC()) {
        const playerId = current.GetPlayerOwnerID();
        if (PlayerResource.IsValidPlayerID(playerId) && PlayerResource.IsValidPlayer(playerId)) {
          return playerId;
        }
      }

      const owner = current.GetOwnerEntity();
      if (!owner || owner === current) return undefined;
      current = owner;
    }

    return undefined;
  }
}

@registerModifier('abilities/ts_abilities/fountain_anti_camp')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_fountain_anti_camp_stack extends BaseModifier {
  IsHidden(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return true;
  }

  GetTexture(): string {
    return 'action_lockenemytower';
  }
}

@registerModifier('abilities/ts_abilities/fountain_anti_camp')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_fountain_anti_camp_lock extends BaseModifier {
  IsHidden(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return true;
  }

  GetTexture(): string {
    return 'action_lockenemytower';
  }

  OnCreated(): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    parent.Purge(true, false, false, false, true);
    parent.RemoveModifierByName('modifier_black_king_bar_immune');
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return {
      [ModifierState.MUTED]: true,
      [ModifierState.SILENCED]: true,
      [ModifierState.PASSIVES_DISABLED]: true,
      [ModifierState.DISARMED]: true,
    };
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.DISABLE_HEALING,
      ModifierFunction.DISABLE_MANA_GAIN,
      ModifierFunction.MOVESPEED_ABSOLUTE,
    ];
  }

  GetDisableHealing(): 0 | 1 {
    return 1;
  }

  GetDisableManaGain(): number {
    return 1;
  }

  GetModifierMoveSpeed_Absolute(): number {
    return this.GetAbility()?.GetSpecialValueFor('move_speed') ?? 400;
  }
}
