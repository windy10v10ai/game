import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';
import { ActionAttack } from '../action/action-attack';
import { ActionFind } from '../action/action-find';
import { ActionMove } from '../action/action-move';
import { getHeroBuildConfig } from '../build-item/hero-build-config';
import { HeroBuildManager } from '../build-item/hero-build-manager';
import { HeroBuildState, InitializeHeroBuild } from '../build-item/hero-build-state';
import { SellItem } from '../build-item/sell-item';
import { NeutralItemConfig, NeutralItemManager, NeutralTierConfig } from '../item/neutral-item';
import { UseItem } from '../item/use-item';
import { BotBehaviorUtil } from '../mode/bot-behavior-util';
import { ModeEnum } from '../mode/mode-enum';
import { TeamCommander } from '../team/team-commander';
import { HeroUtil } from './hero-util';

@registerModifier('ai/hero/bot-base')
export class BotBaseAIModifier extends BaseModifier {
  protected readonly ThinkInterval: number = 0.3;
  protected readonly ThinkIntervalTool: number = 0.3;

  // 持续动作结束时间
  protected readonly continueActionTime: number = 8;
  protected continueActionEndTime: number = -60;

  // HP spike tracking for dodge detection
  private lastHpPercent: number = 100;
  private lastHpDrop: number = 0;

  // Clump-dodge cooldown: don't spread more than once every 5 seconds
  private lastClumpDodgeTime: number = -60;
  private static readonly CLUMP_DODGE_COOLDOWN = 5;


  /**
   * Rolling buffer of the last SUSTAINED_HP_WINDOW HP percent samples (one per 0.3s tick).
   * Used to detect slow DoT sources (e.g. Underlord Firestorm) that each tick is below the
   * spike threshold but whose cumulative damage over ~1.5s is significant.
   */
  private hpHistory: number[] = [];
  private static readonly SUSTAINED_HP_WINDOW = 5;     // ticks (5 × 0.3s = 1.5s)
  private static readonly SUSTAINED_HP_THRESHOLD = 20; // % drop over the window → dodge

  // 中立槽修复节奏：间隔与下次校验时间（gameTime）
  protected readonly neutralItemRepairInterval: number = 5;
  protected neutralItemRepairNextTime: number = -60;
  // 中立槽状态
  private neutralItemTier: number = 0;
  private desiredNeutralActive: NeutralItemConfig | undefined;
  private desiredNeutralPassive: NeutralItemConfig | undefined;

  protected readonly FindHeroRadius: number = 1600;
  protected readonly FindRadius: number = 1600;
  protected readonly NotAttactTowerHeroAttackRangeBuff: number = 400;
  protected readonly CastRange: number = 900;

  public PushLevel: number = 10;

  /**
   * Immutable personality scalars assigned once at spawn.
   * aggressionBias > 1 = "diver" — attacks even when slightly disadvantaged.
   * cautionBias    > 1 = "coward" — retreats earlier, fights through less damage.
   * Both default to 1.0 so tests that skip Init() get neutral behaviour.
   */
  public aggressionBias: number = 1.0;
  public cautionBias: number = 1.0;

  protected hero: CDOTA_BaseNPC_Hero;
  public GetHero(): CDOTA_BaseNPC_Hero {
    return this.hero;
  }

  // 当前状态
  public gameTime: number = 0;
  public mode: ModeEnum = ModeEnum.LANING;

  // 技能
  protected ability_1: CDOTABaseAbility | undefined;
  protected ability_2: CDOTABaseAbility | undefined;
  protected ability_3: CDOTABaseAbility | undefined;
  protected ability_4: CDOTABaseAbility | undefined;
  protected ability_5: CDOTABaseAbility | undefined;
  protected ability_utli: CDOTABaseAbility | undefined;

  protected getNeutralItemConfig(): Record<number, NeutralTierConfig> {
    return NeutralItemManager.GetDefaultConfig();
  }

  protected heroState = {
    currentHealth: 0,
    maxHealth: 0,
    currentMana: 0,
    maxMana: 0,
    currentLevel: 0,
  };

  // 出装状态
  public buildState: HeroBuildState | undefined;
  // 是否使用新出装系统
  public useNewBuildSystem: boolean = false;

  public aroundEnemyHeroes: CDOTA_BaseNPC[] = [];
  public aroundEnemyCreeps: CDOTA_BaseNPC[] = [];
  public aroundEnemyBuildings: CDOTA_BaseNPC[] = [];
  public aroundEnemyBuildingsInvulnerable: CDOTA_BaseNPC[] = [];

  Init() {
    this.hero = this.GetParent() as CDOTA_BaseNPC_Hero;
    print(`[AI] HeroBase OnCreated ${this.hero.GetUnitName()}`);

    // Personality: each bot rolls its own aggression/caution scalars at spawn so
    // five bots of the same hero play noticeably differently.
    this.aggressionBias = 0.85 + RandomFloat(0, 0.30); // [0.85, 1.15]
    this.cautionBias    = 0.85 + RandomFloat(0, 0.30);

    // 中路模式：推进所需等级缩短一半
    if (GameRules.Option.midOnlyMode) {
      this.PushLevel = Math.floor(this.PushLevel / 2);
    }

    // 初始化出装状态
    // FIXME 待所有英雄使用新出装系统后删除
    if (this.useNewBuildSystem) {
      const config = getHeroBuildConfig(this.hero.GetUnitName());
      if (config) {
        this.buildState = InitializeHeroBuild(this.hero, config);
      }
    }

    // 初始化Think
    if (IsInToolsMode()) {
      this.StartIntervalThink(this.ThinkIntervalTool);
    } else {
      this.StartIntervalThink(this.ThinkInterval);
    }
  }

  OnIntervalThink(): void {
    this.hero = this.GetParent() as CDOTA_BaseNPC_Hero;

    this.gameTime = GameRules.GetDOTATime(false, true);
    if (this.StopAction()) {
      return;
    }

    // Track HP delta for spike-dodge detection before any actions run this tick
    const currentHp = this.hero.GetHealthPercent();
    this.lastHpDrop = this.lastHpPercent - currentHp;
    this.lastHpPercent = currentHp;

    // Update rolling HP history for sustained damage detection
    this.hpHistory.push(currentHp);
    if (this.hpHistory.length > BotBaseAIModifier.SUSTAINED_HP_WINDOW) {
      this.hpHistory.shift();
    }

    this.FindAround();
    TeamCommander.getInstance().UpdateGameState([this]);
    // update state
    this.mode = GameRules.AI.FSA.GetMode(this);
    if (this.gameTime < this.continueActionEndTime) {
      // print(`[AI] HeroBase Think break 持续动作中 ${this.hero.GetUnitName()}`);
      return;
    }
    if (this.IsInAbilityPhase()) {
      // print(`[AI] HeroBase Think break 正在施法中 ${this.hero.GetUnitName()}`);
      return;
    }
    // Damage evasion: check before normal mode actions so dodge takes priority
    if (this.mode !== ModeEnum.RETREAT && this.ActionDodge()) {
      return;
    }
    if (this.ActionMode()) {
      return;
    }

    if (this.BuildItem()) {
      return;
    }
  }

  // ---------------------------------------------------------
  // Need Override
  // ---------------------------------------------------------
  /**
   * 因自身而进行的施法
   */
  CastSelf(): boolean {
    if (this.UseItemSelf()) {
      return true;
    }
    if (this.UseAbilitySelf()) {
      return true;
    }
    return false;
  }

  /**
   * 因敌人而进行的施法
   */
  CastEnemy(): boolean {
    if (UseItem.UseItemEnemy(this.hero, this.aroundEnemyHeroes)) {
      return true;
    }
    if (this.UseAbilityEnemy()) {
      return true;
    }
    return false;
  }

  /**
   * 因队友而进行的施法
   */
  CastTeam(): boolean {
    return false;
  }

  /**
   * 因小兵而进行的施法
   */
  CastCreep(): boolean {
    if (UseItem.UseItemCreep(this.hero, this.aroundEnemyCreeps)) {
      return true;
    }
    if (this.UseAbilityCreep()) {
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------
  // Item usage
  // ---------------------------------------------------------
  UseItemSelf(): boolean {
    return false;
  }

  // ---------------------------------------------------------
  // Ability usage
  // ---------------------------------------------------------
  UseAbilitySelf(): boolean {
    return false;
  }

  UseAbilityEnemy(): boolean {
    return false;
  }

  UseAbilityCreep(): boolean {
    return false;
  }

  // ---------------------------------------------------------
  // Action Mode
  // ---------------------------------------------------------
  ActionMode(): boolean {
    switch (this.mode) {
      case ModeEnum.ATTACK:
        return this.ActionAttack();
      case ModeEnum.LANING:
        return this.ActionLaning();
      case ModeEnum.PUSH:
        return this.ActionPush();
      case ModeEnum.RETREAT:
        return this.ActionRetreat();
      default:
        print(`[AI] HeroBase ThinkMode ${this.hero.GetUnitName()} mode ${this.mode} not found`);
        return false;
    }
  }

  // ---------------------------------------------------------
  // Damage evasion
  // ---------------------------------------------------------

  private static readonly DODGE_COMMIT_DURATION = 0.4;
  private static readonly DODGE_STEP_DISTANCE = 350;
  private static readonly DODGE_MELEE_RADIUS = 250;
  private static readonly DODGE_CLUMP_RADIUS = 250;
  private static readonly DODGE_CHANNEL_RADIUS = 1000;
  /** Radius to search for ranged attackers (e.g. Serpent Wards attack from ~600 units). */
  private static readonly DODGE_RANGED_ATTACKER_RADIUS = 750;

  /**
   * Reward tier for the current action.
   * NONE    → any dodge is justified.
   * PARTIAL → suppress positional/spreading dodges (ally clump, melee cluster)
   *           but still react to spikes and sustained damage.
   * FULL    → suppress all non-channeling dodges; the bot should stand its ground.
   */
  private static readonly REWARD_NONE    = 0;
  private static readonly REWARD_PARTIAL = 1;
  private static readonly REWARD_FULL    = 2;

  /**
   * Evaluates how valuable the bot's current action is to determine whether
   * incoming damage should suppress the dodge system.
   *
   * FULL suppression (don't dodge anything except channeling):
   *   • A killable (≤20% HP) enemy hero is within attack range — finish the kill.
   *
   * PARTIAL suppression (skip positional/spreading dodges, react to burst/DoT):
   *   • In PUSH mode with a tower actively being attacked — tower damage is worth
   *     taking some chip damage.
   *   • A last-hittable creep (≤15% HP) is within attack range — small reward,
   *     but abandoning a near-death creep for one creep-hit of damage is not worth it.
   *
   * NONE: default — dodge freely.
   */
  private GetRewardTier(): number {
    const attackRange = this.hero.GetBaseAttackRange() + 300;

    // FULL: high team tower-kill confidence — team kills target before tower kills anyone
    // PARTIAL: medium confidence — worth staying but not diving deep
    //
    // Use team HP+DPS within 1200 units so a coordinated group correctly recognises
    // that their combined burst far exceeds what a single bot's individual calc would show.
    const allyHeroes = ActionFind.Find(
      this.hero,
      1200,
      UnitTargetTeam.FRIENDLY,
      UnitTargetType.HERO,
      UnitTargetFlags.NONE,
    );
    let teamHp  = this.hero.GetHealth();
    let teamDps = this.hero.GetLevel() * 10;
    for (const ally of allyHeroes) {
      teamHp  += ally.GetHealth();
      teamDps += ally.GetLevel() * 10;
    }

    let bestConfidence = 0;
    for (const enemy of this.aroundEnemyHeroes) {
      if (HeroUtil.GetDistanceToHero(this.hero, enemy) <= attackRange) {
        const conf = BotBehaviorUtil.TowerKillConfidence(teamHp, teamDps, enemy.GetHealth(), 150);
        if (conf > bestConfidence) bestConfidence = conf;
      }
    }
    if (bestConfidence >= BotBehaviorUtil.TOWER_KILL_HIGH_CONFIDENCE) {
      return BotBaseAIModifier.REWARD_FULL;
    }
    if (bestConfidence >= BotBehaviorUtil.TOWER_KILL_MEDIUM_CONFIDENCE) {
      return BotBaseAIModifier.REWARD_PARTIAL;
    }

    // PARTIAL: actively pushing a tower
    if (this.mode === ModeEnum.PUSH) {
      const nearestBuilding = this.FindNearestEnemyBuildings();
      if (nearestBuilding) {
        const distToBuilding = HeroUtil.GetDistanceToHero(this.hero, nearestBuilding);
        if (distToBuilding <= attackRange) {
          return BotBaseAIModifier.REWARD_PARTIAL;
        }
      }
    }

    // PARTIAL: last-hittable creep in range
    const lastHitCreep = this.FindCreepToLastHit();
    if (lastHitCreep) {
      if (HeroUtil.GetDistanceToHero(this.hero, lastHitCreep) <= attackRange) {
        return BotBaseAIModifier.REWARD_PARTIAL;
      }
    }

    return BotBaseAIModifier.REWARD_NONE;
  }

  /**
   * Returns the cumulative HP drop over the last SUSTAINED_HP_WINDOW ticks (1.5s).
   * Catches slow DoT sources (e.g. Firestorm) that are below the per-tick spike
   * threshold but whose sustained damage is significant.
   */
  private GetSustainedHpDrop(): number {
    if (this.hpHistory.length < BotBaseAIModifier.SUSTAINED_HP_WINDOW) return 0;
    return this.hpHistory[0] - this.hpHistory[this.hpHistory.length - 1];
  }

  /**
   * React to immediate incoming damage and positional danger.
   * Checks conditions in priority order and issues a dodge-step when any fires.
   *
   * The reward tier gates which checks are active:
   *   FULL    → only channeling dodge fires (bot is finishing a kill).
   *   PARTIAL → burst/DoT/ranged-attacker checks fire; positional spreading suppressed
   *             (bot is hitting a tower or last-hitting — minor chip is acceptable).
   *   NONE    → all checks active.
   *
   * 1. Channeling AoE: always fires (existential threat).
   * 2. HP spike: ≥8% in one tick — fires unless FULL reward.
   * 3. Sustained damage: ≥20% over 1.5s — fires unless FULL reward.
   * 4. Active ranged attackers: non-hero targeting this hero within 750 units — fires unless FULL.
   * 5. Melee-range cluster: ≥2 enemy units within 250 units — fires at NONE only.
   * 6. Ally clump: ≥2 allies within 250 units — fires at NONE only.
   */
  protected ActionDodge(): boolean {
    // 1. Channeling AoE — always dodge regardless of reward (existential threat)
    for (const enemy of this.aroundEnemyHeroes) {
      if (
        enemy.IsChanneling() &&
        HeroUtil.GetDistanceToHero(this.hero, enemy) <= BotBaseAIModifier.DODGE_CHANNEL_RADIUS
      ) {
        this.IssueDodgeFromPos(enemy.GetAbsOrigin());
        return true;
      }
    }

    const rewardTier = this.GetRewardTier();

    // FULL reward: the current action is worth standing in burst — skip all other checks
    if (rewardTier === BotBaseAIModifier.REWARD_FULL) {
      return false;
    }

    // 2. HP spike — lost enough HP in one tick to indicate a burst or spell
    if (this.lastHpDrop >= BotBehaviorUtil.HP_SPIKE_THRESHOLD) {
      const nearestThreat = this.aroundEnemyHeroes[0] ?? this.aroundEnemyCreeps[0];
      if (nearestThreat !== undefined) {
        this.IssueDodgeFromPos(nearestThreat.GetAbsOrigin());
        return true;
      }
    }

    // 3. Sustained damage — cumulative drop over 1.5s indicates a persistent AoE or DoT
    const sustainedDrop = this.GetSustainedHpDrop();
    if (sustainedDrop >= BotBaseAIModifier.SUSTAINED_HP_THRESHOLD) {
      const nearestThreat = this.aroundEnemyHeroes[0] ?? this.aroundEnemyCreeps[0];
      if (nearestThreat !== undefined) {
        this.IssueDodgeFromPos(nearestThreat.GetAbsOrigin());
        return true;
      }
    }

    // 4. Active ranged attackers (e.g. Serpent Wards, Warlock Golems) — non-hero units
    //    within 750 units that are actively targeting this hero.
    //    Guards:
    //    • Requires visible enemy heroes — ignore neutral aggro while walking to lane.
    //    • Skip regular lane creeps (npc_dota_creep_*) — normal lane trading; dodging
    //      away from the creep wave every tick destroys positioning. Only summoned or
    //      special units (wards, golems, ancients) justify a dodge step.
    if (this.aroundEnemyHeroes.length > 0) {
      for (const creep of this.aroundEnemyCreeps) {
        if (HeroUtil.GetDistanceToHero(this.hero, creep) > BotBaseAIModifier.DODGE_RANGED_ATTACKER_RADIUS) {
          continue;
        }
        if (creep.GetUnitName().indexOf('npc_dota_creep_') === 0) {
          continue; // lane creep — not worth dodging
        }
        if (creep.GetAttackTarget() === this.hero) {
          this.IssueDodgeFromPos(creep.GetAbsOrigin());
          return true;
        }
      }
    }

    // PARTIAL reward: spike/DoT/ranged checks already ran above — positional spreading
    // (melee cluster, ally clump) is not worth abandoning a tower attack or last-hit
    if (rewardTier === BotBaseAIModifier.REWARD_PARTIAL) {
      return false;
    }

    // 5. Melee-range enemy units — summons and melee creeps clustering on the bot
    let summonCx = 0;
    let summonCy = 0;
    let summonCount = 0;
    for (const creep of this.aroundEnemyCreeps) {
      if (HeroUtil.GetDistanceToHero(this.hero, creep) <= BotBaseAIModifier.DODGE_MELEE_RADIUS) {
        const p = creep.GetAbsOrigin();
        summonCx += p.x;
        summonCy += p.y;
        summonCount++;
      }
    }
    if (summonCount >= 2) {
      this.IssueDodgeFromPos(Vector(summonCx / summonCount, summonCy / summonCount, 0) as Vector);
      return true;
    }

    // 6. Ally clump — spread out to reduce AoE damage taken by the team.
    //    Guards:
    //    • Requires visible enemy heroes (no spreading in base or on the way to lane).
    //    • Cooldown of 5s per bot — bots naturally stay close together in lane,
    //      so without a cooldown this fires every tick and wastes movement budget.
    if (this.aroundEnemyHeroes.length === 0) {
      return false;
    }
    if (this.gameTime - this.lastClumpDodgeTime < BotBaseAIModifier.CLUMP_DODGE_COOLDOWN) {
      return false;
    }
    const nearAllies = ActionFind.Find(
      this.hero,
      BotBaseAIModifier.DODGE_CLUMP_RADIUS,
      UnitTargetTeam.FRIENDLY,
      UnitTargetType.HERO,
      UnitTargetFlags.NONE,
    );
    if (nearAllies.length >= 2) {
      let ax = 0;
      let ay = 0;
      for (const a of nearAllies) {
        const p = a.GetAbsOrigin();
        ax += p.x;
        ay += p.y;
      }
      this.lastClumpDodgeTime = this.gameTime;
      this.IssueDodgeFromPos(
        Vector(ax / nearAllies.length, ay / nearAllies.length, 0) as Vector,
      );
      return true;
    }

    return false;
  }

  /**
   * Issues a dodge-step move away from a threat position and commits the bot
   * to the movement for DODGE_COMMIT_DURATION seconds.
   *
   * A perpendicular component (±40%) is added to the escape direction so the
   * dodge is less predictable and doesn't always retrace the same path.
   */
  private IssueDodgeFromPos(threatPos: Vector): void {
    const heroPos = this.hero.GetAbsOrigin();
    const awayDx = heroPos.x - threatPos.x;
    const awayDy = heroPos.y - threatPos.y;
    const awayLen = Math.sqrt(awayDx * awayDx + awayDy * awayDy) || 1;
    const awayX = awayDx / awayLen;
    const awayY = awayDy / awayLen;

    // Random perpendicular component: left or right of the escape vector
    const perpSign = Math.random() > 0.5 ? 1 : -1;
    const dodgeX = awayX + -awayY * perpSign * 0.4;
    const dodgeY = awayY + awayX * perpSign * 0.4;
    const dodgeLen = Math.sqrt(dodgeX * dodgeX + dodgeY * dodgeY) || 1;

    ActionMove.MoveHeroToDirection(
      this.hero,
      Vector(dodgeX / dodgeLen, dodgeY / dodgeLen, 0) as Vector,
      BotBaseAIModifier.DODGE_STEP_DISTANCE,
    );
    this.continueActionEndTime = this.gameTime + BotBaseAIModifier.DODGE_COMMIT_DURATION;
  }

  ActionLaning(): boolean {
    if (this.CastSelf()) {
      return true;
    }
    if (this.CastTeam()) {
      return true;
    }
    // Conserve mana: skip offensive casts when critically low
    if (this.HasManaForCombat()) {
      if (this.CastEnemy()) {
        this.MaybeScheduleAggroDrop();
        return true;
      }
      // Last-hit: only cast on creeps that are near death
      const lastHitCreep = this.FindCreepToLastHit();
      if (lastHitCreep) {
        if (this.CastCreep()) {
          return true;
        }
        // Direct auto-attack fallback when no cast is available
        ActionAttack.Attack(this.hero, lastHitCreep);
        return true;
      }
    }
    // Opportunistic kill: auto-attack a killable enemy even without spells
    const killTarget = this.FindKillableEnemy();
    if (killTarget) {
      ActionAttack.Attack(this.hero, killTarget);
      this.MaybeScheduleAggroDrop();
      return true;
    }
    return false;
  }

  /**
   * Aggro drop: after attacking an enemy hero in laning phase, check if enough
   * nearby enemy creeps are present to make the aggro-reset worthwhile. If so,
   * schedule a brief 150-unit move toward base ~0.6s later.
   *
   * In Dota 2, issuing any move command briefly causes creeps that targeted you
   * after you hit their ward (the enemy hero) to re-evaluate targets — the
   * equivalent of the human "move-attack-move" rhythm in high-level laning.
   *
   * The 2-second cooldown prevents this from spamming the move order.
   */
  private aggroDropScheduledAt: number = -60;
  private static readonly AGGRO_DROP_DELAY = 0.6;
  private static readonly AGGRO_DROP_CREEP_RADIUS = 450;
  private static readonly AGGRO_DROP_CREEP_THRESHOLD = 2;

  protected MaybeScheduleAggroDrop(): void {
    if (this.gameTime - this.aggroDropScheduledAt < 2) return;
    const nearCreepCount = this.aroundEnemyCreeps.filter(
      (c) => HeroUtil.GetDistanceToHero(this.hero, c) <= BotBaseAIModifier.AGGRO_DROP_CREEP_RADIUS,
    ).length;
    if (nearCreepCount < BotBaseAIModifier.AGGRO_DROP_CREEP_THRESHOLD) return;

    this.aggroDropScheduledAt = this.gameTime;
    Timers.CreateTimer(BotBaseAIModifier.AGGRO_DROP_DELAY, () => {
      if (!this.hero || !this.hero.IsAlive()) return;
      if (this.mode !== ModeEnum.LANING) return; // switched modes — don't interrupt
      const basePos =
        this.hero.GetTeamNumber() === DotaTeam.GOODGUYS
          ? ActionMove.posRadiantBase
          : ActionMove.posDireBase;
      const awayDir = (basePos.__sub(this.hero.GetAbsOrigin()) as Vector).Normalized();
      ActionMove.MoveHeroToDirection(this.hero, awayDir, 150);
    });
  }

  ActionAttack(): boolean {
    if (this.CastSelf()) {
      return true;
    }
    // Conserve mana even in attack mode — keep enough to escape if needed
    if (this.HasManaForCombat()) {
      if (this.CastEnemy()) {
        return true;
      }
    }
    if (this.CastTeam()) {
      return true;
    }
    // Auto-attack + orb-walk between spell casts
    const attackTarget = this.FindBestAttackTarget();
    if (attackTarget) {
      ActionAttack.Attack(this.hero, attackTarget);
      this.OrbWalk(attackTarget);
      return true;
    }
    return false;
  }

  /**
   * Select the highest-priority attack target among visible enemy heroes.
   * Scoring: (1 - hpRatio) * level, with a soft penalty for targets already
   * claimed by other bots this tick (prevents stampeding one target).
   * Falls back to nearest enemy when none are in attack range.
   */
  FindBestAttackTarget(): CDOTA_BaseNPC | undefined {
    if (this.aroundEnemyHeroes.length === 0) {
      return undefined;
    }
    const commander = TeamCommander.getInstance();
    const attackRange = this.hero.GetBaseAttackRange() + 100;
    let bestInRange: CDOTA_BaseNPC | undefined;
    let bestScore = -1;
    for (const enemy of this.aroundEnemyHeroes) {
      const dist = HeroUtil.GetDistanceToHero(this.hero, enemy);
      if (dist <= attackRange) {
        const claimCount = commander.GetTargetClaimCount(enemy.GetEntityIndex() as unknown as number);
        // Soft penalty: each prior claim reduces score by 30%, floored at 10%
        const claimMultiplier = Math.max(0.1, 1 - 0.3 * claimCount);
        const score =
          BotBehaviorUtil.ScoreAttackTarget(enemy.GetHealthPercent(), enemy.GetLevel()) *
          claimMultiplier;
        if (score > bestScore) {
          bestScore = score;
          bestInRange = enemy;
        }
      }
    }
    const target = bestInRange ?? this.aroundEnemyHeroes[0];
    // Register this bot's intent so subsequent bots factor it in
    commander.ClaimTarget(target.GetEntityIndex() as unknown as number);
    return target;
  }

  /**
   * Orb-walk: ranged heroes step back after attacking to maintain optimal kiting
   * distance and avoid walking into melee range.
   */
  protected OrbWalk(target: CDOTA_BaseNPC): void {
    const attackRange = this.hero.GetBaseAttackRange();
    const dist = HeroUtil.GetDistanceToHero(this.hero, target);
    if (BotBehaviorUtil.ShouldOrbWalkBack(dist, attackRange)) {
      const heroPos = this.hero.GetAbsOrigin();
      const targetPos = target.GetAbsOrigin();
      const dir = heroPos.__sub(targetPos).Normalized();
      ActionMove.MoveHeroToDirection(this.hero, dir, attackRange - dist, 50);
    }
  }

  ActionRetreat(): boolean {
    const hp = this.hero.GetHealthPercent();
    const basePos =
      this.hero.GetTeamNumber() === DotaTeam.GOODGUYS
        ? ActionMove.posRadiantBase
        : ActionMove.posDireBase;

    // --- Emergency run ---
    // At critical HP, movement takes absolute priority over casting.
    if (hp <= BotBehaviorUtil.CRITICAL_RETREAT_HP_PERCENT) {
      ActionMove.MoveHero(this.hero, basePos);
      this.continueActionEndTime = this.gameTime + 3;
      return true;
    }

    // --- Normal retreat: spells first, then movement ---
    if (this.CastSelf()) {
      return true;
    }
    if (this.CastTeam()) {
      return true;
    }

    // Flee from enemy towers first
    const enemyTower = this.FindNearestEnemyTowerInvulnerable();
    if (enemyTower) {
      this.continueActionEndTime = this.gameTime + this.continueActionTime;
      this.ThinkRetreatGetAwayFromTower();
      return true;
    }

    // Flee from chasers
    if (this.aroundEnemyHeroes.length > 0) {
      ActionMove.MoveHero(this.hero, basePos);
      this.continueActionEndTime = this.gameTime + 1;
      return true;
    }

    // No immediate threat but still injured: walk to base for healing
    if (BotBehaviorUtil.BASE_HEAL_HP_PERCENT > hp) {
      ActionMove.MoveHero(this.hero, basePos);
      return true;
    }

    return false;
  }

  ThinkRetreatGetAwayFromTower(): void {
    const enemyTower = this.FindNearestEnemyTowerInvulnerable();
    if (!enemyTower) {
      // end
      this.continueActionEndTime = this.gameTime;
      return;
    }
    if (ActionMove.GetAwayFromTower(this.hero, enemyTower)) {
      // print(`[AI] HeroBase ThinkRetreatGetAwayFromTower ${this.hero.GetUnitName()} 撤退`);
      if (this.gameTime > this.continueActionEndTime) {
        return;
      }
      Timers.CreateTimer(0.03, () => {
        this.ThinkRetreatGetAwayFromTower();
      });
      return;
    } else {
      // end
      this.continueActionEndTime = this.gameTime;
    }
  }

  ActionPush(): boolean {
    if (this.CastSelf()) {
      return true;
    }
    if (this.CastEnemy()) {
      return true;
    }
    if (this.CastTeam()) {
      return true;
    }
    // 推塔
    if (this.ForceAttackTower()) {
      return true;
    }
    if (this.CastCreep()) {
      return true;
    }
    return false;
  }

  // 强制A塔
  ForceAttackTower(): boolean {
    const enemyBuild = this.FindNearestEnemyBuildings();
    if (!enemyBuild) {
      return false;
    }
    if (enemyBuild.HasModifier('modifier_backdoor_protection_active')) {
      // print(`[AI] HeroBase ThinkPush ${this.hero.GetUnitName()} 偷塔保护，不攻击`);
      return false;
    }

    if (this.IsInAttackPhase()) {
      // print(`[AI] HeroBase Think break 正在攻击中 ${this.hero.GetUnitName()}`);
      return false;
    }
    const enemyHero = this.FindNearestEnemyHero();
    if (enemyHero) {
      // if hero in attack range
      const distanceToAttackHero = HeroUtil.GetDistanceToAttackRange(this.hero, enemyHero);
      if (distanceToAttackHero <= this.NotAttactTowerHeroAttackRangeBuff) {
        return false;
      }

      const distanceToHero = HeroUtil.GetDistanceToHero(this.hero, enemyHero);
      if (distanceToHero <= this.CastRange) {
        return false;
      }
    }

    if (ActionAttack.Attack(this.hero, enemyBuild)) {
      return true;
    }
    return false;
  }

  StopAction(): boolean {
    if (HeroUtil.NotActionable(this.hero)) {
      return true;
    }

    return false;
  }

  // ---------------------------------------------------------
  // Build Item
  // ---------------------------------------------------------
  BuildItem(): boolean {
    // 使用消耗品
    UseItem.UseConsumeItems(this.hero);
    // SellItem.SellExtraItems 内部已包含智能出售系统
    if (SellItem.SellExtraItems(this.hero, this.buildState)) {
      return true;
    }
    if (this.PurchaseItem()) {
      return true;
    }
    if (this.PickNeutralItem()) {
      return true;
    }
    if (this.RepairNeutralSlotsIfStomped()) {
      return true;
    }
    return false;
  }

  PurchaseItem(): boolean {
    if (!this.buildState) {
      return false;
    }
    return HeroBuildManager.TryPurchaseItem(this.hero, this.buildState);
  }

  /** 按间隔校验并修复中立主动/强化槽 */
  private RepairNeutralSlotsIfStomped(): boolean {
    if (this.gameTime < this.neutralItemRepairNextTime) {
      return false;
    }
    this.neutralItemRepairNextTime = this.gameTime + this.neutralItemRepairInterval;

    const desiredActive = this.desiredNeutralActive;
    const desiredPassive = this.desiredNeutralPassive;
    if (this.neutralItemTier <= 0 || desiredActive === undefined || desiredPassive === undefined) {
      return false;
    }

    const active = this.hero.GetItemInSlot(InventorySlot.NEUTRAL_ACTIVE_SLOT);
    const passive = this.hero.GetItemInSlot(InventorySlot.NEUTRAL_PASSIVE_SLOT);
    const activeOk =
      active !== undefined &&
      active.GetAbilityName() === desiredActive.name &&
      active.GetLevel() === desiredActive.level;
    const passiveOk =
      passive !== undefined &&
      passive.GetAbilityName() === desiredPassive.name &&
      passive.GetLevel() === desiredPassive.level;

    if (activeOk && passiveOk) {
      return false;
    }

    if (active !== undefined) {
      UTIL_RemoveImmediate(active);
    }
    if (passive !== undefined) {
      UTIL_RemoveImmediate(passive);
    }
    this.hero.AddItemByName(desiredActive.name).SetLevel(desiredActive.level);
    this.hero.AddItemByName(desiredPassive.name).SetLevel(desiredPassive.level);
    return true;
  }

  PickNeutralItem(): boolean {
    const targetTier = NeutralItemManager.GetTargetTier();
    if (targetTier <= this.neutralItemTier) {
      return false;
    }

    const neutralItemConfig = this.getNeutralItemConfig();
    const selectedItem = NeutralItemManager.GetRandomTierItem(targetTier, neutralItemConfig);
    if (!selectedItem) {
      print(`[AI] HeroBase PickNeutralItem ${this.hero.GetUnitName()} 没有找到中立物品`);
      return false;
    }

    const selectedEnhancement = NeutralItemManager.GetRandomTierEnhancements(
      targetTier,
      neutralItemConfig,
      this.hero,
    );
    if (!selectedEnhancement) {
      print(`[AI] HeroBase PickNeutralItem ${this.hero.GetUnitName()} 没有找到中立增强`);
      return false;
    }

    //print(
    //  `[AI] HeroBase PickNeutralItem ${this.hero.GetUnitName()} 选取中立物品 ${selectedItem.name} 和 中立增强 ${selectedEnhancement.name}`,
    // );

    // 移除当前中立物品
    const oldItem = this.hero.GetItemInSlot(InventorySlot.NEUTRAL_ACTIVE_SLOT);
    if (oldItem) {
      UTIL_RemoveImmediate(oldItem);
    }
    const oldEnhancement = this.hero.GetItemInSlot(InventorySlot.NEUTRAL_PASSIVE_SLOT);
    if (oldEnhancement) {
      UTIL_RemoveImmediate(oldEnhancement);
    }

    this.hero.AddItemByName(selectedItem.name).SetLevel(selectedItem.level);
    this.hero.AddItemByName(selectedEnhancement.name).SetLevel(selectedEnhancement.level);
    this.desiredNeutralActive = { name: selectedItem.name, level: selectedItem.level };
    this.desiredNeutralPassive = {
      name: selectedEnhancement.name,
      level: selectedEnhancement.level,
    };
    this.neutralItemRepairNextTime = this.gameTime + this.neutralItemRepairInterval;
    this.neutralItemTier = targetTier;
    return true;
  }

  // ---------------------------------------------------------
  // Check
  // ---------------------------------------------------------
  IsInAbilityPhase(): boolean {
    if (this.hero.IsChanneling()) {
      return true;
    }

    this.ability_1 = this.hero.GetAbilityByIndex(0);
    this.ability_2 = this.hero.GetAbilityByIndex(1);
    this.ability_3 = this.hero.GetAbilityByIndex(2);
    this.ability_4 = this.hero.GetAbilityByIndex(3);
    this.ability_5 = this.hero.GetAbilityByIndex(4);
    this.ability_utli = this.hero.GetAbilityByIndex(5);

    if (this.ability_1 && this.ability_1.IsInAbilityPhase()) {
      return true;
    }
    if (this.ability_2 && this.ability_2.IsInAbilityPhase()) {
      return true;
    }
    if (this.ability_3 && this.ability_3.IsInAbilityPhase()) {
      return true;
    }
    if (this.ability_4 && this.ability_4.IsInAbilityPhase()) {
      return true;
    }
    if (this.ability_5 && this.ability_5.IsInAbilityPhase()) {
      return true;
    }
    if (this.ability_utli && this.ability_utli.IsInAbilityPhase()) {
      return true;
    }

    return false;
  }

  IsInAttackPhase(): boolean {
    return this.hero.IsAttacking();
  }

  // ---------------------------------------------------------
  // Find unit
  // ---------------------------------------------------------

  private FindAround(): void {
    this.aroundEnemyHeroes = ActionFind.FindEnemyHeroes(this.hero, this.FindHeroRadius);
    this.aroundEnemyCreeps = ActionFind.FindEnemyCreeps(this.hero, this.FindRadius);
    this.aroundEnemyBuildings = ActionFind.FindEnemyBuildings(this.hero, this.FindRadius);
    this.aroundEnemyBuildingsInvulnerable = ActionFind.FindEnemyBuildingsInvulnerable(
      this.hero,
      this.FindRadius,
    );
  }

  // ---------------------------------------------------------
  // Combat helpers
  // ---------------------------------------------------------

  /** True when the hero has enough mana to spend on combat abilities. */
  protected HasManaForCombat(): boolean {
    return BotBehaviorUtil.HasManaForCombat(
      this.hero.GetMana(),
      this.hero.GetMaxMana(),
    );
  }

  /** Max distance the bot will chase a killable enemy without disengaging. */
  private static readonly KILLABLE_PURSUIT_DISTANCE = 800;

  /**
   * Returns the first visible enemy hero that is both killable (≤20% HP) and
   * within pursuit range. The distance cap prevents the bot from chasing a
   * kiting target across the map when the kill never materialises.
   */
  protected FindKillableEnemy(): CDOTA_BaseNPC | undefined {
    for (const enemy of this.aroundEnemyHeroes) {
      if (BotBehaviorUtil.IsEnemyKillable(enemy.GetHealthPercent())) {
        const dist = HeroUtil.GetDistanceToHero(this.hero, enemy);
        if (dist <= BotBaseAIModifier.KILLABLE_PURSUIT_DISTANCE) {
          return enemy;
        }
      }
    }
    return undefined;
  }

  /** Returns the first enemy creep that is near death (worth last-hitting). */
  protected FindCreepToLastHit(): CDOTA_BaseNPC | undefined {
    for (const creep of this.aroundEnemyCreeps) {
      if (BotBehaviorUtil.IsCreepLastHittable(creep.GetHealthPercent())) {
        return creep;
      }
    }
    return undefined;
  }

  /** Returns the nearest friendly hero within 1200 units (for flee blending). */
  protected FindNearestAllyHero(): CDOTA_BaseNPC | undefined {
    const allies = ActionFind.Find(
      this.hero,
      1200,
      UnitTargetTeam.FRIENDLY,
      UnitTargetType.HERO,
      UnitTargetFlags.NONE,
    );
    return allies.length > 0 ? allies[0] : undefined;
  }

  public FindNearestEnemyHero(): CDOTA_BaseNPC | undefined {
    if (this.aroundEnemyHeroes.length === 0) {
      return undefined;
    }

    const target = this.aroundEnemyHeroes[0];
    return target;
  }

  public FindNearestEnemyCreep(): CDOTA_BaseNPC | undefined {
    if (this.aroundEnemyCreeps.length === 0) {
      return undefined;
    }

    const target = this.aroundEnemyCreeps[0];
    return target;
  }

  public FindNearestEnemyBuildings(): CDOTA_BaseNPC | undefined {
    if (this.aroundEnemyBuildings.length === 0) {
      return undefined;
    }

    // return 1st name contains tower
    for (const building of this.aroundEnemyBuildingsInvulnerable) {
      if (
        building.GetUnitName().includes('tower') ||
        building.GetUnitName().includes('rax') ||
        building.GetUnitName().includes('fort')
      ) {
        return building;
      }
    }
    return undefined;
  }

  public FindNearestEnemyTowerInvulnerable(): CDOTA_BaseNPC | undefined {
    if (this.aroundEnemyBuildingsInvulnerable.length === 0) {
      return undefined;
    }

    // return 1st name contains tower
    for (const building of this.aroundEnemyBuildingsInvulnerable) {
      if (building.GetUnitName().includes('tower') || building.GetUnitName().includes('fort')) {
        return building;
      }
    }
    return undefined;
  }

  // ---------------------------------------------------------
  // DotaModifierFunctions
  // ---------------------------------------------------------
  // modifier functions
  OnCreated() {
    if (IsClient()) {
      return;
    }

    const delay = RandomFloat(1, 2);
    print(`[AI] HeroBase OnCreated delay ${delay}`);
    Timers.CreateTimer(delay, () => {
      this.Init();
    });
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  IsHidden(): boolean {
    return true;
  }
}
