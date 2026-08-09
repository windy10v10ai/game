import { PlayerHelper } from '../../modules/helper/player-helper';
import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

const WATCHER_MODIFIER_NAME = 'modifier_fountain_anti_camp_watcher';
const STACK_MODIFIER_NAME = 'modifier_fountain_anti_camp_stack';
const LOCK_MODIFIER_NAME = 'modifier_fountain_anti_camp_lock';
const POLL_INTERVAL = 1;
const DEBUFF_DURATION = 3;
const LOCK_STACK_THRESHOLD = 3;

const RETALIATION_PROJECTILE = 'particles/base_attacks/ranged_tower_bad.vpcf';
const RETALIATION_EXPIRE_TIME = 10;

@registerAbility('fountain_anti_camp')
export class AbilityFountainAntiCamp extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return WATCHER_MODIFIER_NAME;
  }

  OnProjectileHit(target: CDOTA_BaseNPC | undefined, _location: Vector): void {
    if (!IsServer()) return;
    if (!target || target.IsNull() || !target.IsAlive()) return;

    const damagePct = this.GetSpecialValueFor('retaliation_damage_pct');
    const damage = target.GetMaxHealth() * damagePct * 0.01;
    print(
      `[FountainAntiCamp] retaliation hit target=${target.GetUnitName()} pct=${damagePct} damage=${damage}`,
    );
    if (damage <= 0) return;

    ApplyDamage({
      victim: target,
      attacker: this.GetCaster(),
      damage,
      damage_type: DamageTypes.PURE,
      // 按最大生命值算的固定值，排除会改变数值的伤害修正与反弹
      damage_flags:
        DamageFlag.BYPASSES_INVULNERABILITY +
        DamageFlag.HPLOSS +
        DamageFlag.NO_DAMAGE_MULTIPLIERS +
        DamageFlag.NO_SPELL_AMPLIFICATION +
        DamageFlag.NO_REFLECTION,
      ability: this,
    });
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
      if (canRun) {
        // 生效：反击需要全局死亡事件，等人数确认后再注册
        ListenToGameEvent('entity_killed', (keys) => this.OnEntityKilled(keys), this);
      } else {
        // 不生效：停掉轮询，制裁与反击都不启用
        this.StartIntervalThink(-1);
        return;
      }
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
    const ability = this.GetAbility();
    if (!ability) return;

    const fountain = this.GetParent();
    const victim = this.GetBaseNpc(keys.entindex_killed);
    if (!this.IsFountainAiHero(victim, fountain)) return;

    const radius = ability.GetSpecialValueFor('radius');
    if (victim.GetAbsOrigin().__sub(fountain.GetAbsOrigin()).Length2D() > radius) return;

    const target = this.ResolveHumanOwnerHero(this.GetBaseNpc(keys.entindex_attacker));
    if (!target || !target.IsAlive()) return;

    this.LaunchRetaliation(victim, target);
  }

  private IsFountainAiHero(
    unit: CDOTA_BaseNPC | undefined,
    fountain: CDOTA_BaseNPC,
  ): unit is CDOTA_BaseNPC_Hero {
    return (
      unit !== undefined &&
      !unit.IsNull() &&
      unit.IsRealHero() &&
      unit.GetTeamNumber() === fountain.GetTeamNumber() &&
      PlayerHelper.IsBotPlayerByPlayerId(unit.GetPlayerOwnerID())
    );
  }

  // 命中结算走引擎的 AbilityFountainAntiCamp.OnProjectileHit
  private LaunchRetaliation(victim: CDOTA_BaseNPC_Hero, target: CDOTA_BaseNPC_Hero): void {
    const ability = this.GetAbility();
    if (!ability) return;

    const projectileSpeed = ability.GetSpecialValueFor('retaliation_projectile_speed');
    if (projectileSpeed <= 0) return;

    ProjectileManager.CreateTrackingProjectile({
      Target: target,
      Source: this.GetParent(),
      Ability: ability,
      EffectName: RETALIATION_PROJECTILE,
      iMoveSpeed: projectileSpeed,
      vSourceLoc: victim.GetAbsOrigin(),
      bDodgeable: false,
      bIgnoreObstructions: true,
      flExpireTime: GameRules.GetGameTime() + RETALIATION_EXPIRE_TIME,
    });
  }

  private GetBaseNpc(entityIndex: EntityIndex | undefined): CDOTA_BaseNPC | undefined {
    if (!entityIndex || entityIndex <= 0) return undefined;

    const entity = EntIndexToHScript(entityIndex);
    if (!entity || entity.IsNull() || !entity.IsBaseNPC()) return undefined;
    return entity;
  }

  // 召唤物/幻象击杀时反击对象是它们背后的玩家英雄
  private ResolveHumanOwnerHero(unit: CDOTA_BaseNPC | undefined): CDOTA_BaseNPC_Hero | undefined {
    if (!unit || unit.IsNull()) return undefined;

    const playerId = unit.GetPlayerOwnerID();
    if (playerId < 0 || !PlayerHelper.IsHumanPlayerByPlayerId(playerId)) return undefined;

    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    return hero && !hero.IsNull() && hero.IsRealHero() ? hero : undefined;
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
