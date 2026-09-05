import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { PlayerPropertyApi } from '../../api/player-property';
import { NetTableHelper } from '../../modules/helper/net-table-helper';
import { DEATH_PROPHET_POSSESSION_TARGET_MODIFIER } from './death-prophet-ai-possession-constants';
import {
  extendPossessionDuration,
  runBestEffortCleanup,
  shouldExtendPossession,
  uniqueAbilityNames,
} from './death-prophet-ai-possession-logic';
import './death-prophet-ai-possession-target';

const SCRIPT_PATH = 'abilities/ts_abilities/death_prophet_exorcism_ai_possession';
const ABILITY_NAME = 'death_prophet_exorcism_ai_possession';
const CONTROLLER_MODIFIER = 'modifier_death_prophet_exorcism_ai_possession_controller';
const AWAKENED_STATUS_MODIFIER = 'modifier_death_prophet_ai_possession_awakened';
const DURATION_ON_KILL_TALENT = 'special_bonus_unique_death_prophet_ai_possession_duration_on_kill';
const DURATION_ON_KILL_SPECIAL_VALUE = 'duration_increase_per_kill';
const SCEPTER_SPIRIT_PROJECTILE =
  'particles/units/heroes/hero_death_prophet/death_prophet_spirit_model.vpcf';

function selectEntityForPlayer(
  player: CDOTAPlayerController,
  entity: CDOTA_BaseNPC,
  possessionActive: boolean,
): void {
  // 客户端只执行一次真实选择；不使用 OverrideSelection，之后仍可自由查看其他英雄。
  CustomGameEventManager.Send_ServerToPlayer(player, 'death_prophet_possession_select', {
    entindex: entity.GetEntityIndex(),
    active: possessionActive ? 1 : 0,
  });
}

function isUnitReincarnating(unit: CDOTA_BaseNPC): boolean {
  const optionalReincarnationCheck = unit as unknown as {
    IsReincarnating?: () => boolean;
  };
  return optionalReincarnationCheck.IsReincarnating?.() ?? false;
}

function isPossessableEnemyBot(caster: CDOTA_BaseNPC, target: CDOTA_BaseNPC): boolean {
  if (target.IsNull()) return false;

  // 部分 Dota 运行时版本没有 IsClone；只在 API 实际存在时调用，避免施法直接 Lua 报错。
  const optionalCloneChecks = target as unknown as {
    IsAlive?: () => boolean;
    IsClone?: () => boolean;
    IsTempestDouble?: () => boolean;
  };
  const isRealHero = target.IsRealHero();
  const isIllusion = target.IsIllusion();
  const isAlive = optionalCloneChecks.IsAlive?.() ?? true;
  const isClone = optionalCloneChecks.IsClone?.() ?? false;
  const isTempestDouble = optionalCloneChecks.IsTempestDouble?.() ?? false;
  if (
    !isAlive ||
    !isRealHero ||
    isIllusion ||
    isClone ||
    isTempestDouble ||
    isUnitReincarnating(target) ||
    target.GetTeamNumber() === caster.GetTeamNumber() ||
    target.HasModifier(DEATH_PROPHET_POSSESSION_TARGET_MODIFIER)
  ) {
    return false;
  }

  // PlayerResource 只在服务端完整可用；客户端先通过基础单位条件，最终 AI 校验由服务端完成。
  if (!IsServer()) return true;

  const playerId = target.GetPlayerOwnerID();
  return PlayerResource.IsValidPlayerID(playerId) && PlayerResource.IsFakeClient(playerId);
}

@registerAbility(ABILITY_NAME)
export class DeathProphetExorcismAiPossession extends BaseAbility {
  private nextScepterStrikeTime = 0;

  GetIntrinsicModifierName(): string {
    return AWAKENED_STATUS_MODIFIER;
  }

  CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
    const caster = this.GetCaster();
    if (!isPossessableEnemyBot(caster, target)) return UnitFilterResult.FAIL_CUSTOM;

    return UnitFilter(
      target,
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO,
      UnitTargetFlags.NOT_ILLUSIONS,
      caster.GetTeamNumber(),
    );
  }

  GetCustomCastErrorTarget(target: CDOTA_BaseNPC): string {
    if (target.HasModifier(DEATH_PROPHET_POSSESSION_TARGET_MODIFIER)) {
      return '#dota_hud_error_death_prophet_ai_possession_active';
    }
    return '#dota_hud_error_death_prophet_ai_possession_ai_only';
  }

  OnSpellStart(): void {
    if (!IsServer()) return;

    const caster = this.GetCaster() as CDOTA_BaseNPC_Hero;
    const target = this.GetCursorTarget();
    if (!target || target.IsNull() || !isPossessableEnemyBot(caster, target)) {
      this.refundFailedCast(caster);
      return;
    }
    if (target.TriggerSpellAbsorb(this)) return;

    const duration = this.GetSpecialValueFor('duration');
    const controller = caster.AddNewModifier(caster, this, CONTROLLER_MODIFIER, {
      duration,
      target_entindex: target.GetEntityIndex(),
      caster_had_scepter: caster.HasScepter() ? 1 : 0,
    }) as (CDOTA_Buff & { isPossessionReady?: () => boolean }) | undefined;
    if (!controller || controller.IsNull() || controller.isPossessionReady?.() !== true) {
      this.refundFailedCast(caster);
    }
  }

  private refundFailedCast(caster: CDOTA_BaseNPC_Hero): void {
    this.EndCooldown();
    caster.GiveMana(this.GetManaCost(-1));
    print('[DeathProphetPossession] cast setup failed; resources refunded');
  }

  launchScepterSpirit(source: CDOTA_BaseNPC_Hero, target: CDOTA_BaseNPC): void {
    if (!IsServer() || source.IsNull() || target.IsNull() || !target.IsAlive()) return;

    ProjectileManager.CreateTrackingProjectile({
      Target: target,
      Source: source,
      Ability: this,
      EffectName: SCEPTER_SPIRIT_PROJECTILE,
      iMoveSpeed: 900,
      bDodgeable: false,
      bProvidesVision: false,
      ExtraData: {
        source_entindex: source.GetEntityIndex(),
      },
    });
  }

  tryLaunchScepterSpiritFromDamage(
    event: ModifierInstanceEvent,
    source: CDOTA_BaseNPC_Hero,
    scepterEnabled: boolean,
  ): void {
    if (
      !IsServer() ||
      !scepterEnabled ||
      event.attacker !== source ||
      event.damage <= 0 ||
      event.inflictor === this
    ) {
      return;
    }

    const victim = event.unit;
    if (
      !victim ||
      victim.IsNull() ||
      !victim.IsAlive() ||
      victim.IsBuilding() ||
      victim.IsOther() ||
      victim.GetTeamNumber() === source.GetTeamNumber()
    ) {
      return;
    }

    const now = GameRules.GetGameTime();
    if (now < this.nextScepterStrikeTime) return;

    const cooldown = this.GetSpecialValueFor('scepter_proc_cooldown');
    const damage = this.GetSpecialValueFor('scepter_proc_damage');
    if (damage <= 0) return;

    this.nextScepterStrikeTime = now + cooldown;
    this.launchScepterSpirit(source, victim);
  }

  OnProjectileHit_ExtraData(
    target: CDOTA_BaseNPC | undefined,
    _location: Vector,
    extraData: { source_entindex?: EntityIndex },
  ): boolean {
    if (!IsServer() || !target || target.IsNull() || !target.IsAlive()) return true;

    const caster = this.GetCaster() as CDOTA_BaseNPC_Hero;
    const source =
      extraData.source_entindex !== undefined
        ? (EntIndexToHScript(extraData.source_entindex) as CDOTA_BaseNPC_Hero | undefined)
        : undefined;
    const damage = this.GetSpecialValueFor('scepter_proc_damage');
    if (damage <= 0 || caster.IsNull()) return true;

    const actualDamage = ApplyDamage({
      victim: target,
      attacker: caster,
      damage,
      damage_type: DamageTypes.PHYSICAL,
      damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION + DamageFlag.NO_REFLECTION,
      ability: this,
    });
    if (actualDamage > 0) {
      SendOverheadEventMessage(
        undefined,
        OverheadAlert.BONUS_SPELL_DAMAGE,
        target,
        actualDamage,
        undefined,
      );
    }
    if (actualDamage > 0 && source && !source.IsNull() && source.IsAlive()) {
      source.Heal(actualDamage * this.GetSpecialValueFor('scepter_proc_heal_pct') * 0.01, this);
    }
    return true;
  }
}

@registerModifier(SCRIPT_PATH)
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_death_prophet_ai_possession_awakened extends BaseModifier {
  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  IsPurgeException(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  GetTexture(): string {
    return 'death_prophet_exorcism';
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_TAKEDAMAGE];
  }

  OnTakeDamage(event: ModifierInstanceEvent): void {
    if (!IsServer()) return;

    const parent = this.GetParent() as CDOTA_BaseNPC_Hero;
    const ability = this.GetAbility() as DeathProphetExorcismAiPossession | undefined;
    if (!ability || ability.IsNull()) return;

    ability.tryLaunchScepterSpiritFromDamage(event, parent, parent.HasScepter());
  }
}

interface PossessionParams {
  target_entindex?: EntityIndex;
  caster_had_scepter?: 0 | 1;
}

interface BorrowedAbilityState {
  name: string;
  existedOnTarget: boolean;
  originalLevel: number;
  originalActivated: boolean;
  originalHidden: boolean;
  originalCharges: number;
  originalAutoCast: boolean;
  originalCooldown: number;
}

interface PossessionContext {
  caster: CDOTA_BaseNPC_Hero;
  target: CDOTA_BaseNPC_Hero;
  ability: CDOTABaseAbility;
  casterPlayerId: PlayerID;
  casterPlayer: CDOTAPlayerController;
}

/**
 * 唯一生命周期 owner：保存并切换目标身份、隐藏本体、延长持续时间，并在所有出口恢复双方。
 * 目标 modifier 只承担可见状态与 AI 暂停标记，不拥有恢复逻辑。
 */
@registerModifier(SCRIPT_PATH)
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_death_prophet_exorcism_ai_possession_controller extends BaseModifier {
  private target?: CDOTA_BaseNPC_Hero;
  private originalTargetOwner?: CBaseEntity;
  private originalTargetPlayerId?: PlayerID;
  private originalTargetTeam?: DOTATeam_t;
  private casterPlayerId?: PlayerID;
  private casterHadScepterAtCast = false;
  private possessionStarted = false;
  private possessionReady = false;
  private killTargetOnEnd = false;
  private borrowedAbilityStates: BorrowedAbilityState[] = [];

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  IsPurgeException(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  GetTexture(): string {
    return 'death_prophet_exorcism';
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return {
      [ModifierState.INVULNERABLE]: true,
      [ModifierState.OUT_OF_GAME]: true,
      [ModifierState.UNSELECTABLE]: true,
      [ModifierState.NO_HEALTH_BAR]: true,
      [ModifierState.NO_UNIT_COLLISION]: true,
      [ModifierState.COMMAND_RESTRICTED]: true,
      [ModifierState.DISARMED]: true,
      [ModifierState.ROOTED]: true,
    };
  }

  OnCreated(params: PossessionParams): void {
    if (!IsServer()) return;
    const lifecycleStartedAt = Time();

    const context = this.resolvePossessionContext(params);
    if (!context) {
      this.Destroy();
      return;
    }

    this.startPossession(context, params, lifecycleStartedAt);
  }

  private resolvePossessionContext(params: PossessionParams): PossessionContext | undefined {
    const caster = this.GetParent() as CDOTA_BaseNPC_Hero;
    const target = params.target_entindex
      ? (EntIndexToHScript(params.target_entindex) as CDOTA_BaseNPC_Hero | undefined)
      : undefined;
    const ability = this.GetAbility();
    const casterPlayerId = caster.GetPlayerOwnerID();
    const casterPlayer = caster.GetPlayerOwner();

    if (
      !target ||
      target.IsNull() ||
      !isPossessableEnemyBot(caster, target) ||
      !ability ||
      ability.IsNull() ||
      !PlayerResource.IsValidPlayerID(casterPlayerId) ||
      !casterPlayer ||
      casterPlayer.IsNull()
    ) {
      return undefined;
    }

    return { caster, target, ability, casterPlayerId, casterPlayer };
  }

  private startPossession(
    context: PossessionContext,
    params: PossessionParams,
    lifecycleStartedAt: number,
  ): void {
    const { caster, target, ability, casterPlayerId, casterPlayer } = context;
    this.target = target;
    this.originalTargetOwner = target.GetOwnerEntity();
    this.originalTargetPlayerId = target.GetPlayerID();
    this.originalTargetTeam = target.GetTeamNumber();
    this.casterPlayerId = casterPlayerId;
    this.casterHadScepterAtCast = params.caster_had_scepter === 1;
    this.possessionStarted = true;

    const durationTalent = caster.FindAbilityByName(DURATION_ON_KILL_TALENT);
    print(
      `[DeathProphetPossession] duration talent level=${durationTalent?.GetLevel() ?? 0} value=${durationTalent?.GetSpecialValueFor(DURATION_ON_KILL_SPECIAL_VALUE) ?? 0}`,
    );

    try {
      const targetHadScepter = target.HasScepter();
      const targetHadShard = target.HasModifier('modifier_item_aghanims_shard');
      GameRules.AI.BotTeam?.cancelJungleRecoveryMovement(target);
      target.Interrupt();
      target.Stop();

      // 真实英雄的 PlayerID 属于 PlayerResource 全局身份。临时改写再恢复会同步重建整队数据，
      // 在 10v10 中可阻塞主线程数秒；控制权只需要 Team、Owner 与 controllable 映射。
      target.SetTeam(caster.GetTeamNumber());
      target.SetOwner(casterPlayer);
      target.SetControllableByPlayer(casterPlayerId, false);
      const steamId = PlayerResource.GetSteamAccountID(casterPlayerId);
      const progression = PlayerPropertyApi.GetTemporaryPlayerPropertyValuesForHero(
        caster,
        steamId,
      );
      const targetModifier = target.AddNewModifier(
        target,
        ability,
        DEATH_PROPHET_POSSESSION_TARGET_MODIFIER,
        {
          duration: this.GetRemainingTime(),
          death_prophet_entindex: caster.GetEntityIndex(),
          original_owner_entindex: this.originalTargetOwner?.GetEntityIndex(),
          original_player_id: this.originalTargetPlayerId,
          original_team: this.originalTargetTeam,
          had_scepter: targetHadScepter ? 1 : 0,
          had_shard: targetHadShard ? 1 : 0,
          caster_had_scepter: this.casterHadScepterAtCast ? 1 : 0,
          ...progression,
        },
      );
      if (!targetModifier || targetModifier.IsNull()) {
        print('[DeathProphetPossession] target status creation failed');
        this.Destroy();
        return;
      }

      this.applyCasterAbilities(caster, target, casterPlayerId);
      this.killTargetOnEnd = true;
      this.possessionReady = true;
      selectEntityForPlayer(casterPlayer, target, true);
      print(
        `[DeathProphetPossession] entered target=${target.GetUnitName()} elapsed_ms=${(Time() - lifecycleStartedAt) * 1000}`,
      );
      this.StartIntervalThink(0.2);
    } catch (error) {
      print(`[DeathProphetPossession] enter failed error=${error}`);
      this.Destroy();
    }
  }

  isPossessionReady(): boolean {
    return this.possessionReady;
  }

  OnIntervalThink(): void {
    if (!IsServer() || !this.possessionReady) return;

    const caster = this.GetParent() as CDOTA_BaseNPC_Hero;
    const target = this.target;
    if (
      !target ||
      target.IsNull() ||
      !target.HasModifier(DEATH_PROPHET_POSSESSION_TARGET_MODIFIER) ||
      target.GetTeamNumber() !== caster.GetTeamNumber()
    ) {
      this.Destroy();
    }
  }

  /** 由目标的致命伤保护调用；先退出附身，再以死亡先知为攻击者处决目标。 */
  finishPossession(killTarget: boolean): void {
    if (!IsServer() || !this.possessionReady) return;
    this.killTargetOnEnd = killTarget;
    this.Destroy();
  }

  /** 由仍在场的目标状态监听击杀；本体 OUT_OF_GAME 时 controller 自身收不到全局死亡事件。 */
  extendDurationForKill(attacker: CDOTA_BaseNPC, victim: CDOTA_BaseNPC): void {
    if (!IsServer() || !this.possessionReady) return;

    const caster = this.GetParent() as CDOTA_BaseNPC_Hero;
    const target = this.target;
    const durationOnKillExtension = this.getDurationOnKillExtension(caster);
    if (!target || target.IsNull()) {
      return;
    }

    const owner = attacker.GetOwnerEntity();
    if (
      !shouldExtendPossession({
        extension: durationOnKillExtension,
        victimIsRealHero: victim.IsRealHero(),
        victimIsIllusion: victim.IsIllusion(),
        victimIsReincarnating: isUnitReincarnating(victim),
        victimTeam: victim.GetTeamNumber(),
        casterTeam: caster.GetTeamNumber(),
        attackerIsTarget: attacker === target,
        attackerIsCaster: attacker === caster,
        attackerPlayerId: attacker.GetPlayerOwnerID(),
        casterPlayerId: this.casterPlayerId,
        attackerOwnerIsTargetOrCaster: owner === target || owner === caster,
      })
    ) {
      return;
    }

    const newDuration = extendPossessionDuration(this.GetRemainingTime(), durationOnKillExtension);
    this.SetDuration(newDuration, true);
    const targetModifier = target.FindModifierByNameAndCaster(
      DEATH_PROPHET_POSSESSION_TARGET_MODIFIER,
      target,
    );
    if (targetModifier && !targetModifier.IsNull()) {
      targetModifier.SetDuration(newDuration, true);
    }
    print(
      `[DeathProphetPossession] kill extension +${durationOnKillExtension}s remaining=${newDuration} attacker=${attacker.GetUnitName()} victim=${victim.GetUnitName()}`,
    );
  }

  private getDurationOnKillExtension(caster: CDOTA_BaseNPC_Hero): number {
    const durationTalent = caster.FindAbilityByName(DURATION_ON_KILL_TALENT);
    if (!durationTalent || durationTalent.IsNull() || durationTalent.GetLevel() <= 0) return 0;
    return Math.max(0, durationTalent.GetSpecialValueFor(DURATION_ON_KILL_SPECIAL_VALUE));
  }

  private applyCasterAbilities(
    caster: CDOTA_BaseNPC_Hero,
    target: CDOTA_BaseNPC_Hero,
    casterPlayerId: PlayerID,
  ): void {
    const steamId = PlayerResource.GetSteamAccountID(casterPlayerId);
    const lotteryStatus = NetTableHelper.GetLotteryStatus(steamId.toString());
    const selectedAbilityNames = uniqueAbilityNames([
      lotteryStatus.activeAbilityName ?? '',
      lotteryStatus.passiveAbilityName ?? '',
      lotteryStatus.passiveAbilityName2 ?? '',
    ]);

    for (const abilityName of selectedAbilityNames) {
      if (!abilityName) continue;

      const sourceAbility = caster.FindAbilityByName(abilityName);
      if (!sourceAbility || sourceAbility.IsNull()) continue;

      const existingAbility = target.FindAbilityByName(abilityName);
      const borrowedAbility = existingAbility ?? target.AddAbility(abilityName);
      if (!borrowedAbility || borrowedAbility.IsNull()) continue;

      this.borrowedAbilityStates.push({
        name: abilityName,
        existedOnTarget: existingAbility !== undefined,
        originalLevel: borrowedAbility.GetLevel(),
        originalActivated: borrowedAbility.IsActivated(),
        originalHidden: borrowedAbility.IsHidden(),
        originalCharges: borrowedAbility.GetCurrentAbilityCharges(),
        originalAutoCast: borrowedAbility.GetAutoCastState(),
        originalCooldown: borrowedAbility.GetCooldownTimeRemaining(),
      });

      borrowedAbility.SetLevel(sourceAbility.GetLevel());
      borrowedAbility.SetActivated(sourceAbility.IsActivated());
      borrowedAbility.SetHidden(sourceAbility.IsHidden());
      borrowedAbility.SetCurrentAbilityCharges(sourceAbility.GetCurrentAbilityCharges());
      if (sourceAbility.GetAutoCastState() !== borrowedAbility.GetAutoCastState()) {
        borrowedAbility.ToggleAutoCast();
      }

      const cooldown = sourceAbility.GetCooldownTimeRemaining();
      borrowedAbility.EndCooldown();
      if (cooldown > 0) borrowedAbility.StartCooldown(cooldown);
      print(
        `[DeathProphetPossession] sync ability ${abilityName}: ${sourceAbility.GetLevel()} -> ${borrowedAbility.GetLevel()} (existing=${existingAbility !== undefined})`,
      );
    }
  }

  private removeCasterAbilities(caster: CDOTA_BaseNPC_Hero, target: CDOTA_BaseNPC_Hero): void {
    const states = this.borrowedAbilityStates;
    this.borrowedAbilityStates = [];
    runBestEffortCleanup(
      states.map((state) => ({
        name: `ability_${state.name}`,
        run: () => {
          const borrowedAbility = target.FindAbilityByName(state.name);
          const sourceAbility = caster.FindAbilityByName(state.name);
          if (
            borrowedAbility &&
            !borrowedAbility.IsNull() &&
            sourceAbility &&
            !sourceAbility.IsNull()
          ) {
            sourceAbility.EndCooldown();
            const remainingCooldown = borrowedAbility.GetCooldownTimeRemaining();
            if (remainingCooldown > 0) sourceAbility.StartCooldown(remainingCooldown);
            sourceAbility.SetCurrentAbilityCharges(borrowedAbility.GetCurrentAbilityCharges());
          }

          if (!borrowedAbility || borrowedAbility.IsNull()) return;
          if (!state.existedOnTarget) {
            target.RemoveAbility(state.name);
            return;
          }

          borrowedAbility.SetLevel(state.originalLevel);
          borrowedAbility.SetActivated(state.originalActivated);
          borrowedAbility.SetHidden(state.originalHidden);
          borrowedAbility.SetCurrentAbilityCharges(state.originalCharges);
          if (borrowedAbility.GetAutoCastState() !== state.originalAutoCast) {
            borrowedAbility.ToggleAutoCast();
          }
          borrowedAbility.EndCooldown();
          if (state.originalCooldown > 0) borrowedAbility.StartCooldown(state.originalCooldown);
        },
      })),
      (stage, error) => this.logCleanupError(stage, error),
    );
  }

  private restoreTargetIdentity(target: CDOTA_BaseNPC_Hero): void {
    runBestEffortCleanup(
      [
        {
          name: 'identity_team',
          run: () => {
            if (this.originalTargetTeam !== undefined) target.SetTeam(this.originalTargetTeam);
          },
        },
        {
          name: 'identity_owner',
          run: () => {
            if (this.originalTargetOwner && !this.originalTargetOwner.IsNull()) {
              target.SetOwner(this.originalTargetOwner);
            }
          },
        },
        {
          name: 'identity_control',
          run: () => {
            if (this.originalTargetPlayerId !== undefined) {
              target.SetControllableByPlayer(this.originalTargetPlayerId, false);
            }
          },
        },
      ],
      (stage, error) => this.logCleanupError(stage, error),
    );
  }

  private logCleanupError(stage: string, error: unknown): void {
    print(`[DeathProphetPossession] cleanup failed stage=${stage} error=${error}`);
  }

  OnDestroy(): void {
    if (!IsServer() || !this.possessionStarted) return;
    const exitStartedAt = Time();
    this.possessionStarted = false;
    this.possessionReady = false;

    const caster = this.GetParent() as CDOTA_BaseNPC_Hero;
    const target = this.target;
    const ability = this.GetAbility();
    let returnPosition = caster.GetAbsOrigin();

    if (target && !target.IsNull()) {
      print(`[DeathProphetPossession] exit stage=begin target=${target.GetUnitName()}`);
      returnPosition = target.GetAbsOrigin();
      runBestEffortCleanup(
        [
          { name: 'target_interrupt', run: () => target.Interrupt() },
          { name: 'target_stop', run: () => target.Stop() },
          { name: 'abilities', run: () => this.removeCasterAbilities(caster, target) },
        ],
        (stage, error) => this.logCleanupError(stage, error),
      );

      runBestEffortCleanup(
        [
          { name: 'identity', run: () => this.restoreTargetIdentity(target) },
          {
            name: 'status',
            run: () => target.RemoveModifierByName(DEATH_PROPHET_POSSESSION_TARGET_MODIFIER),
          },
          {
            name: 'kill',
            run: () => {
              if (this.killTargetOnEnd && target.IsAlive()) target.Kill(ability, caster);
            },
          },
        ],
        (stage, error) => this.logCleanupError(stage, error),
      );
    }

    runBestEffortCleanup(
      [
        {
          name: 'caster_return',
          run: () => {
            if (!caster.IsNull()) FindClearSpaceForUnit(caster, returnPosition, false);
          },
        },
        {
          name: 'caster_select',
          run: () => {
            if (caster.IsNull()) return;
            const casterPlayer = caster.GetPlayerOwner();
            if (casterPlayer && !casterPlayer.IsNull()) {
              selectEntityForPlayer(casterPlayer, caster, false);
            }
          },
        },
      ],
      (stage, error) => this.logCleanupError(stage, error),
    );
    print(
      `[DeathProphetPossession] exit stage=complete elapsed_ms=${(Time() - exitStartedAt) * 1000}`,
    );
  }
}
