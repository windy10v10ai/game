import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';
import { AbilityDispatcher } from '../ability/ability-dispatcher';
import { AbilityRegistry } from '../ability/ability-registry';
import { ActionAttack } from '../action/action-attack';
import { ActionFind, FRIENDLY_CREEP_SEARCH_RADIUS } from '../action/action-find';
import { getHeroBuildConfig } from '../build-item/bot-build-config';
import { HeroBuildManager } from '../build-item/bot-build-manager';
import { HeroBuildState, InitializeHeroBuild } from '../build-item/bot-build-state';
import { SellItem } from '../build-item/sell-item';
import { EMPTY_SLOT, planSlotSwaps } from '../item/arrange-items';
import { ConsumeItem } from '../item/consume-item';
import { ItemDispatcher } from '../item/item-dispatcher';
import { ItemRegistry } from '../item/item-registry';
import { NeutralItemConfig, NeutralItemManager, NeutralTierConfig } from '../item/neutral-item';
import { IS_DEBUG_RUN, PERF_CONFIG } from '../../modules/debug/perf-config';
import { PerfSampler } from '../../modules/debug/perf-sampler';
import { CachedTowers, TowerAttackRange } from '../team/building-cache';
import { FORMATION_SPACING } from '../team/formation';
import { Point } from '../team/lane-geometry';
import { QUICK_CLEAR_POWER } from '../team/power';
import { HeroShortName, TeamBrain, UnitPower } from '../team/team-brain';
import { FIGHT_DANGER_RADIUS, Task, TaskKind, TELEPORT_MIN_DISTANCE } from '../team/team-plan';
import { WardPlacement } from '../ward/ward-placement';
import { canEngage, canEscape, decideStance, Stance, survivalSeconds } from './engagement';
import { HeroUtil } from './hero-util';
import { EngageToward, FindBlinkItem, MoveContext, MoveToward } from './mobility';
import { ROADSIDE_CHANNELS, TryRoadside } from './roadside';
import { canOutlastTower, passesTower, retreatPointFromTowers } from './tower-retreat';
import { calculateAttackDPS } from '../../utils/damage-calculation';

/** 英雄当前在做什么：对线期交给原生时是 laning，接管后是交战状态或团队任务。 */
export type BotMode = 'laning' | 'fight' | 'retreat' | TaskKind;

@registerModifier('ai/hero/bot-base')
export class BotBaseAIModifier extends BaseModifier {
  protected readonly ThinkInterval: number = 0.4;
  protected readonly ThinkIntervalTool: number = 0.4;

  // 原生期间躲塔要和原生抢控制，在这段时间内持续下移动指令
  protected readonly towerEscapeTime: number = 3;
  protected readonly towerEscapeTick: number = 0.03;
  protected continueActionEndTime: number = -60;
  private roadsideUntil = 0;
  private roadsideCheckAt = 0;

  // 中立槽修复节奏：间隔与下次校验时间（gameTime）
  protected readonly neutralItemRepairInterval: number = 5;
  protected neutralItemRepairNextTime: number = -60;
  // 中立槽状态
  private neutralItemTier: number = 0;
  private desiredNeutralActive: NeutralItemConfig | undefined;
  private desiredNeutralPassive: NeutralItemConfig | undefined;

  // 插眼节流：下次允许尝试的 gameTime
  public wardPlaceNextTime: number = -60;

  // 出装节流：下次允许尝试的 gameTime
  protected readonly buildItemInterval: number = 2;
  protected buildItemNextTime: number = -60;

  protected readonly FindRadius: number = 1800;
  protected readonly CastRange: number = 900;
  protected readonly LocalFightRadius: number = 1500;
  // 这么近有一团打不过的敌人、又没被派去打时，提前离开，不在旁边推塔打兵等人来抓
  protected readonly ThreatRadius: number = 2500;
  protected readonly ChaseRange: number = 1200;
  // 原地还手时只打攻击距离外这么一点以内的敌人，再远就算追
  protected readonly HitBackExtraRange: number = 100;
  // 智力英雄靠技能输出，追着普攻跑会脱离队伍
  protected readonly IntChaseExtra: number = 300;
  // 挨打或出手后这段时间内仍算交战中
  protected readonly EngageMemory: number = 3;
  // 一次思考内掉血超过最大血量这个比例，看不见敌人也当作在挨打
  protected readonly UnseenBurstRatio: number = 0.08;
  // 按这段时间内受到的伤害估算还能撑几秒
  protected readonly DamageWindow: number = 2;
  // 打不过的敌人没打起来时，离它攻击距离外至少这么远，留出转身离开的余地，不等它贴上来
  protected readonly HoldDistanceBuffer: number = 600;

  protected readonly RecoverHealthPercent: number = 35;
  protected readonly RecoverManaPercent: number = 15;
  protected readonly RecoverDoneHealthPercent: number = 90;
  protected readonly RecoverDoneManaPercent: number = 70;
  protected readonly FountainArriveRadius: number = 600;

  // 进塔攻击范围前留的余量，以及能扛塔的人数、血量、塔下兵数
  protected readonly TowerDangerBuffer: number = 150;
  // 退出塔区时一并背离的附近塔，绕塔时再多留的余量
  protected readonly TowerNearbyRange: number = 600;
  protected readonly TowerDetourMargin: number = 200;
  protected readonly DiveMinHeroes: number = 3;
  protected readonly DiveMinHealthPercent: number = 50;
  protected readonly DiveMinCreeps: number = 2;
  protected readonly DiveCheckRadius: number = 900;
  protected readonly DiveGatherRange: number = 400;
  // 血厚时让自己扛塔，否则人人一挨打就转移，塔下来回倒仇恨谁都不扛
  protected readonly DeaggroHealthPercent: number = 60;
  // 转移仇恨后塔若很快又打回自己，说明身边没有别的目标可换，这段时间内直接退出射程
  protected readonly DeaggroCooldown: number = 3;

  // 传送要引导，落地后还得追着往前走的兵线，省下的时间不够多就直接走过去
  protected readonly TaskTeleportSavingSeconds: number = 5;
  protected readonly TeleportLandingOffset: number = 400;
  protected readonly PushAttackRange: number = 1000;
  // 攻击距离外再多这么远的敌方小兵也顺手打掉，近战英雄也能照顾到身边一整波兵
  protected readonly CreepClearExtraRange: number = 400;
  // 远程野怪的攻击距离
  protected readonly NeutralThreatRadius: number = 800;
  // 推进路过时这个距离内的野怪可以顺手清
  protected readonly NeutralClearRange: number = 800;
  // 推进时在等待点迎上去打的敌方兵线距离，不站着等兵线自己走过来
  protected readonly PushCreepChaseRange: number = 1200;
  // 离肉山这么近才指定它打，远处照常赶路，不在半路被引到别处
  protected readonly RoshanAttackRange: number = 1500;
  protected readonly RoadsideCheckInterval: number = 1;
  // 走去捡东西期间不再下别的移动命令，但最多这么久，路上的情况会变
  protected readonly RoadsideMaxSeconds: number = 3;

  // 同一目的地不重复下指令；单位停下或太久没更新时才重下
  // 到达判定要比站位间距小，否则都停在靠自己一侧的站位边缘、又挤回一团
  protected readonly ArriveRadius: number = 100;
  // 开发模式记录位置的间隔
  protected readonly PositionTraceInterval: number = 5;
  // 一小步前后地面高度差超过这么多就是隔着一层悬崖
  protected readonly CliffHeight: number = 96;
  // 地形与扛塔判断的结果记这么久，每次思考都算太贵
  protected readonly TerrainCheckInterval: number = 1;
  // 回防离目的地这么近才边走边打
  protected readonly DefendAttackMoveRange: number = 1500;
  // 停下来后和队友挨着超过这么久才让开
  protected readonly CrowdedSeconds: number = 2;
  protected readonly OrderRepeatDistance: number = 400;
  protected readonly OrderRefreshTime: number = 10;

  // 撤退回泉水的血量上限：高于此值多半只是躲塔或让位，不值得消耗卷轴
  protected readonly RetreatTeleportMaxHealthPercent: number = 30;
  // 传送引导约 3 秒，塔攻击距离 700 之外再留一段缓冲，避免刚起手就被塔火力打断
  protected readonly RetreatTeleportTowerSafeRange: number = 1200;
  // 刚挨过打时附近多半还有看不见的敌人，引导会被打断
  protected readonly TeleportCalmSeconds: number = 2;

  protected hero: CDOTA_BaseNPC_Hero;
  public GetHero(): CDOTA_BaseNPC_Hero {
    return this.hero;
  }

  // 当前状态
  public gameTime: number = 0;
  public mode: BotMode = 'laning';
  protected stance: Stance = 'task';
  public GetStance(): Stance {
    return this.stance;
  }

  private engagedUntil: number = -60;
  private lastHurtTime: number = -60;
  private recentDamage: { time: number; damage: number }[] = [];
  private lastHealth: number = 0;
  private tookDamage: boolean = false;
  private needsRecover: boolean = false;
  private lastOrderPos: Vector | undefined;
  private lastOrderType: UnitOrder | undefined;
  private lastOrderTime: number = -60;
  private lastDeaggroTime: number = -60;

  // 开发模式决策日志：本轮交战判断的依据、选中的目标、上一次打印的内容
  private traceInfo: string = '';
  private traceTarget: string = '';
  private lastTraceKey: string = '';
  // 交战中团队大脑给的集合点，撤退时退向这里
  private retreatPoint: Point | undefined;
  private crowdedSince: number | undefined;
  private spreadCheckedAt = 0;
  private nextPositionTrace = 0;
  private stepCache: { point: Vector; until: number } | undefined;
  private readonly outlastCache = new Map<EntityIndex, { ok: boolean; until: number }>();
  private brain: TeamBrain | undefined;
  // 引导中最后一次看到范围内敌方英雄的时间，用来判断敌人离开了多久
  private channelEnemySeenTime = 0;

  protected getNeutralItemConfig(): Record<number, NeutralTierConfig> {
    return NeutralItemManager.GetDefaultConfig();
  }

  // 出装状态
  public buildState: HeroBuildState | undefined;

  public aroundEnemyHeroes: CDOTA_BaseNPC[] = [];
  public aroundEnemyCreeps: CDOTA_BaseNPC[] = [];
  private aroundEnemyAncients: CDOTA_BaseNPC[] = [];
  private aroundEnemyAncientsTime: number = -1;
  public aroundEnemyBuildings: CDOTA_BaseNPC[] = [];
  public aroundEnemyBuildingsInvulnerable: CDOTA_BaseNPC[] = [];
  public aroundFriendlyHeroes: CDOTA_BaseNPC[] = [];
  public aroundFriendlyCreeps: CDOTA_BaseNPC[] = [];
  public aroundFriendlyBuildings: CDOTA_BaseNPC[] = [];

  protected isIntHero: boolean = false;

  Init() {
    this.hero = this.GetParent() as CDOTA_BaseNPC_Hero;

    this.isIntHero = this.hero.GetPrimaryAttribute() === Attributes.INTELLECT;

    const config = getHeroBuildConfig(this.hero.GetUnitName());
    if (config) {
      this.buildState = InitializeHeroBuild(this.hero, config);
    }

    // 初始化Think
    if (IsInToolsMode()) {
      this.StartIntervalThink(this.ThinkIntervalTool);
    } else {
      this.StartIntervalThink(this.ThinkInterval);
    }
  }

  OnIntervalThink(): void {
    if (IS_DEBUG_RUN) {
      PerfSampler.measureAiThink(() => this.think());
      return;
    }
    this.think();
  }

  private think(): void {
    this.hero = this.GetParent() as CDOTA_BaseNPC_Hero;

    this.gameTime = GameRules.GetDOTATime(false, true);
    if (this.StopAction()) {
      return;
    }

    this.FindAround();
    const botTeam = GameRules.AI.BotTeam;
    const brain = botTeam?.GetBrain(this.hero);
    brain?.Join(this.hero);
    if (!botTeam || !brain || botTeam.IsNativeActive()) {
      this.ThinkNative();
      return;
    }
    this.ThinkCustom(brain);
  }

  /** 对线期：移动交给原生，只负责施法、躲塔、插眼与出装。 */
  private ThinkNative(): void {
    this.mode = 'laning';
    this.stance = 'task';
    const botTeam = GameRules.AI.BotTeam;
    // 残血时让原生自己决定去留，不再被回线任务拖着走
    if (this.hero.GetHealthPercent() < this.RecoverHealthPercent) {
      botTeam?.cancelJungleRecoveryMovement(this.hero);
      botTeam?.suppressLaneRecoveryForRetreat(this.hero);
    } else if (botTeam?.isJungleRecoveryMovementActive(this.hero)) {
      return;
    }
    if (this.gameTime < this.continueActionEndTime) {
      return;
    }
    if (this.IsInAbilityPhase()) {
      return;
    }
    if (this.DropTowerAggro()) {
      return;
    }
    if (this.AvoidTowerDive()) {
      return;
    }
    if (this.ActionLaning()) {
      return;
    }
    if (WardPlacement.Run(this)) {
      return;
    }
    this.BuildItem();
  }

  /** 接管后：先判断交战，没打起来就执行团队任务。 */
  private ThinkCustom(brain: TeamBrain): void {
    if (IS_DEBUG_RUN) {
      this.TracePosition(brain.GetTask(this.hero));
    }
    if (this.gameTime < this.continueActionEndTime) {
      return;
    }
    if (this.IsInAbilityPhase()) {
      return;
    }
    if (this.DropTowerAggro()) {
      return;
    }

    this.brain = brain;
    this.UpdateRecoverNeed(brain);
    const task = brain.GetTask(this.hero);
    this.stance = this.DecideStance(brain, task);
    // 出装与整理物品栏不占用行动，接管后几乎每轮都在行动，排在后面会一直轮不到
    if (this.BuildItem()) {
      return;
    }
    this.traceTarget = '';
    const acted = this.ActionStance(task);
    if (IS_DEBUG_RUN) {
      this.TraceDecision(task);
    }
    if (acted) {
      return;
    }
    WardPlacement.Run(this);
  }

  private ActionStance(task: Task | undefined): boolean {
    switch (this.stance) {
      case 'fight':
        this.mode = 'fight';
        return this.ActionAttack(task) || this.ActionTask(task);
      case 'lastStand':
        this.mode = 'fight';
        // 跑不掉时原地还手：技能物品照放，只打够得着的敌人，不追，够不着就继续撤
        if (ItemDispatcher.Run(this) || AbilityDispatcher.Run(this) || this.HitBackInRange()) {
          return true;
        }
        return this.ActionRetreat();
      case 'retreat':
        this.mode = 'retreat';
        // 边撤边放技能物品，让追击或靠近有代价；不停下来普攻
        if (ItemDispatcher.Run(this) || AbilityDispatcher.Run(this)) {
          return true;
        }
        return this.ActionRetreat();
      case 'hold':
        // 被派来打但跟得上的人还不够：原地等后面的人，不往敌人跟前凑；守塔时敌人够不着就顺手清兵
        if (this.InEnemyReach()) {
          this.mode = 'retreat';
          if (ItemDispatcher.Run(this) || AbilityDispatcher.Run(this)) {
            return true;
          }
          return this.ActionRetreat();
        }
        this.mode = 'hold';
        if (
          !ItemDispatcher.Run(this) &&
          !AbilityDispatcher.Run(this) &&
          !(task?.kind === 'defend' && this.AttackNearbyCreep(task.kind))
        ) {
          this.SpreadOut();
        }
        return true;
      default:
        this.mode = task?.kind ?? 'hold';
        return this.ActionTask(task);
    }
  }

  // ---------------------------------------------------------
  // Engagement
  // ---------------------------------------------------------
  private UpdateRecoverNeed(brain: TeamBrain): void {
    const health = this.hero.GetHealthPercent();
    const mana = this.hero.GetManaPercent();
    if (this.needsRecover) {
      this.needsRecover =
        health < this.RecoverDoneHealthPercent || mana < this.RecoverDoneManaPercent;
    } else {
      // 力量敏捷英雄没蓝也能靠普攻打，只有智力英雄因缺蓝回家
      this.needsRecover =
        health < this.RecoverHealthPercent || (this.isIntHero && mana < this.RecoverManaPercent);
    }
    brain.SetNeedsRecover(this.hero, this.needsRecover);
  }

  /**
   * 打不打、往哪撤由团队大脑按交战点统一判断，队友之间口径一致；
   * 英雄层只处理自己被打之后的反应：打不过就边撤边放技能物品，跑不掉才打到底。
   */
  private DecideStance(brain: TeamBrain, task: Task | undefined): Stance {
    // 被派去打架或回防的人由团队判断过值得去，到场后不按独自一人的战力掉头
    const committed = task?.kind === 'fight' || task?.kind === 'defend';
    const enemies = this.aroundEnemyHeroes.filter(
      (enemy) => this.hero.GetRangeToUnit(enemy) <= this.LocalFightRadius,
    );
    const health = this.hero.GetHealth();
    const drop = Math.max(0, this.lastHealth - health);
    const tookDamage = drop > 0;
    const burst = drop >= this.hero.GetMaxHealth() * this.UnseenBurstRatio;
    this.tookDamage = tookDamage;
    if (tookDamage) {
      this.lastHurtTime = this.gameTime;
    }
    this.lastHealth = health;
    const survival = this.SurvivalSeconds(drop);
    const attackTarget = this.hero.GetAttackTarget();
    if (
      enemies.length > 0 &&
      (tookDamage || (attackTarget !== undefined && attackTarget.IsHero()))
    ) {
      this.engagedUntil = this.gameTime + this.EngageMemory;
    }
    const engaged = enemies.length > 0 && this.gameTime < this.engagedUntil;
    brain.SetEngaged(this.hero, engaged);
    this.traceInfo = '';
    this.retreatPoint = undefined;
    if (enemies.length === 0) {
      // 高地下或迷雾里被看不见的敌人打得很疼时先撤；小兵和塔打不出这么快的掉血，打肉山时的掉血来自肉山
      if (burst && task?.kind !== 'roshan') {
        this.engagedUntil = this.gameTime + this.EngageMemory;
        return 'retreat';
      }
      // 追兵刚跑出视野多半还在附近，撤退要撤完，不因一时看不见就掉头
      if (this.stance === 'retreat' && this.gameTime < this.engagedUntil) {
        return 'retreat';
      }
      const threat = brain.NearestFight(this.hero, this.ThreatRadius);
      // 交战点附近的人已算进我方战力，只有外面的才要加上自己
      const joining =
        threat &&
        this.hero.GetAbsOrigin().__sub(this.ToWorld(threat.pos)).Length2D() > FIGHT_DANGER_RADIUS
          ? UnitPower(this.hero)
          : 0;
      if (threat && !committed && !canEngage(threat.ourPower + joining, threat.enemyPower)) {
        // 走出威胁范围后再撤一会，不在边界上来回进出
        this.engagedUntil = this.gameTime + this.EngageMemory;
        this.retreatPoint = threat.rally;
        return 'retreat';
      }
      return 'task';
    }

    const fight = brain.AssessFight(this.hero, enemies);
    this.retreatPoint = fight.rally;
    const escape = !engaged || this.CanEscape(enemies);
    if (IS_DEBUG_RUN) {
      this.traceInfo =
        `engaged=${engaged ? 1 : 0} escape=${escape ? 1 : 0}` +
        ` live=${survival === Infinity ? '-' : Math.floor(survival)}` +
        ` our=${Math.floor(fight.ourPower)}(${fight.ourNames.join(',')})` +
        ` enemy=${Math.floor(fight.enemyPower)}(${fight.enemyNames.join(',')}${fight.withTower ? ',tower' : ''})`;
    }
    const stance = decideStance({
      engaged,
      ourPower: fight.ourPower,
      enemyPower: fight.enemyPower,
      canEscape: escape,
      survivalSeconds: survival,
      wasAvoiding: this.stance === 'retreat' || this.stance === 'hold',
      // 回防的人按接战口径，不因对面强一些就在后面看着建筑被拆
      joining: (task?.kind === 'fight' && fight.engaged) || task?.kind === 'defend',
      holdGround: task?.kind === 'defend' && task.hold === true,
    });
    if (engaged) {
      return stance;
    }
    if (this.needsRecover) {
      return 'retreat';
    }
    // 打不过时，被派来打的在外围等队友跟上，其余的离开，不在旁边围观
    if (stance === 'hold') {
      return committed ? 'hold' : 'retreat';
    }
    if (committed) {
      return stance;
    }
    return 'task';
  }

  /** 把这一轮掉的血记进窗口，按窗口内受到的伤害估算还能撑几秒。 */
  private SurvivalSeconds(drop: number): number {
    const since = this.gameTime - this.DamageWindow;
    this.recentDamage = this.recentDamage.filter((entry) => entry.time > since);
    if (drop > 0) {
      this.recentDamage.push({ time: this.gameTime, damage: drop });
    }
    const total = this.recentDamage.reduce((sum, entry) => sum + entry.damage, 0);
    return survivalSeconds(this.hero.GetHealth(), total, this.DamageWindow);
  }

  /** 已经走进某个敌方英雄的攻击距离附近。 */
  private InEnemyReach(): boolean {
    return this.aroundEnemyHeroes.some(
      (enemy) =>
        this.hero.GetRangeToUnit(enemy) <= enemy.Script_GetAttackRange() + this.HoldDistanceBuffer,
    );
  }

  private CanEscape(enemies: CDOTA_BaseNPC[]): boolean {
    const speed = this.hero.GetIdealSpeed();
    const reach = this.hero.Script_GetAttackRange() + this.HitBackExtraRange;
    return canEscape({
      rooted: this.hero.IsRooted(),
      caughtByFaster: enemies.some(
        (enemy) => enemy.GetIdealSpeed() > speed && this.hero.GetRangeToUnit(enemy) <= reach,
      ),
    });
  }

  /** 撤退的落脚点：交战中退向团队大脑给的集合点；否则退向身后最近的己方塔，没有就回泉水。 */
  protected FindSafePoint(): Vector {
    if (this.retreatPoint) {
      return this.ToWorld(this.retreatPoint);
    }
    const team = this.hero.GetTeamNumber();
    const fountain = HeroUtil.GetTeamFountainPosition(team) ?? this.hero.GetAbsOrigin();
    const here = this.hero.GetAbsOrigin();
    const ownDistance = here.__sub(fountain).Length2D();
    let best: Vector = fountain;
    let bestDistance = ownDistance;
    for (const tower of CachedTowers()) {
      if (tower.IsNull() || !tower.IsAlive() || tower.GetTeamNumber() !== team) {
        continue;
      }
      const pos = tower.GetAbsOrigin();
      const distance = here.__sub(pos).Length2D();
      if (pos.__sub(fountain).Length2D() < ownDistance && distance < bestDistance) {
        best = pos;
        bestDistance = distance;
      }
    }
    return best;
  }

  /** 开发模式：定时记下位置与任务，供日志检测脚本找卡住、挤在一起、远路不传送等问题。 */
  private TracePosition(task: Task | undefined): void {
    if (this.gameTime < this.nextPositionTrace) {
      return;
    }
    this.nextPositionTrace = this.gameTime + this.PositionTraceInterval;
    const pos = this.hero.GetAbsOrigin();
    const scroll = this.hero.FindItemInInventory('item_tpscroll');
    const tp = scroll === undefined ? 'none' : scroll.IsFullyCastable() ? 'ready' : 'cd';
    const dist = task ? Math.floor(pos.__sub(this.ToWorld(task.pos)).Length2D()) : -1;
    print(
      `[bot-pos] t=${Math.floor(this.gameTime)} team=${this.hero.GetTeamNumber()} ${HeroShortName(this.hero)}` +
        ` x=${Math.floor(pos.x)} y=${Math.floor(pos.y)} task=${task?.kind ?? 'none'}` +
        ` target=${task?.targetId ?? -1} dist=${dist} stance=${this.stance} tp=${tp}` +
        ` channel=${this.hero.IsChanneling() ? 1 : 0} atk=${this.hero.IsAttacking() ? 1 : 0}`,
    );
  }

  /** 开发模式：判断结果、任务或目标变化时打一行日志，便于对照实机表现排查。 */
  private TraceDecision(task: Task | undefined): void {
    let taskText = task ? `${task.kind}${task.lane ? ':' + task.lane : ''}` : 'none';
    // 推进目标建筑与到目标的距离，用来区分「没选中基地」和「选中了但停在外面等」
    let goalText = '';
    if (task && task.targetId !== undefined && task.kind !== 'fight') {
      const goal = EntIndexToHScript(task.targetId as EntityIndex) as CDOTA_BaseNPC | undefined;
      if (goal && goal.IsBaseNPC()) {
        taskText += `>${goal.GetUnitName().replace('npc_dota_', '')}`;
        const stageGap = this.hero.GetAbsOrigin().__sub(this.ToWorld(task.pos)).Length2D();
        goalText =
          ` goal_dist=${Math.floor(this.hero.GetRangeToUnit(goal))}` +
          ` stage_dist=${Math.floor(stageGap)}`;
      }
    }
    const key = `${this.stance}|${this.mode}|${taskText}|${this.traceTarget}`;
    if (key === this.lastTraceKey) {
      return;
    }
    this.lastTraceKey = key;
    const time = Math.max(0, Math.floor(this.gameTime));
    const seconds = time % 60;
    const clock = `${Math.floor(time / 60)}:${seconds < 10 ? '0' : ''}${seconds}`;
    print(
      `[bot-ai] t=${clock} ${HeroShortName(this.hero)} hp=${Math.floor(this.hero.GetHealthPercent())}%` +
        ` pw=${Math.floor(UnitPower(this.hero))}` +
        ` stance=${this.stance} mode=${this.mode} task=${taskText}` +
        ` target=${this.traceTarget === '' ? '-' : this.traceTarget}${goalText} ${this.traceInfo}`,
    );
  }

  // ---------------------------------------------------------
  // Action
  // ---------------------------------------------------------
  /** 对线期只施法，移动与补刀交给原生。 */
  ActionLaning(): boolean {
    if (ItemDispatcher.Run(this)) {
      return true;
    }
    return AbilityDispatcher.Run(this);
  }

  ActionAttack(task: Task | undefined): boolean {
    if (ItemDispatcher.Run(this)) {
      return true;
    }
    if (AbilityDispatcher.Run(this)) {
      return true;
    }
    const focusId = task?.kind === 'fight' ? task.targetId : undefined;
    const target = this.PickFightTarget(focusId);
    if (!target) {
      return false;
    }
    this.traceTarget = HeroShortName(target);
    // 被派去集火的 bot 走过去打；自发迎战的智力英雄靠技能输出，不追着普攻跑
    let range = this.ChaseRange;
    if (target.GetEntityIndex() === focusId) {
      range = this.FindRadius;
    } else if (this.isIntHero) {
      range = this.hero.GetBaseAttackRange() + this.IntChaseExtra;
    }
    if (EngageToward(this.MoveContext(), target)) {
      return true;
    }
    return ActionAttack.MoveToAttack(this.hero, target, range);
  }

  /** 打攻击距离内最近的敌方英雄。 */
  private HitBackInRange(): boolean {
    const reach = this.hero.Script_GetAttackRange() + this.HitBackExtraRange;
    for (const enemy of this.aroundEnemyHeroes) {
      if (this.hero.GetRangeToUnit(enemy) <= reach) {
        this.traceTarget = HeroShortName(enemy);
        return ActionAttack.MoveToAttack(this.hero, enemy, reach);
      }
    }
    return false;
  }

  /**
   * 优先团队指定的集火目标，否则挑血最少的；站在不能进的敌方塔下、或躲到还没推掉的塔后面的目标不追。
   * 已经贴到身边的敌人不算追，照打，免得放着身边的英雄不打去打野怪。
   */
  private PickFightTarget(focusId: number | undefined): CDOTA_BaseNPC | undefined {
    const reach = this.hero.Script_GetAttackRange() + this.HitBackExtraRange;
    let best: CDOTA_BaseNPC | undefined;
    for (const enemy of this.aroundEnemyHeroes) {
      const isFocus = enemy.GetEntityIndex() === focusId;
      const range = this.hero.GetRangeToUnit(enemy);
      if (!isFocus && range > this.ChaseRange) {
        continue;
      }
      if (
        this.IsProtectedByTower(enemy) ||
        (range > reach && this.brain?.IsPastFront(enemy.GetAbsOrigin()))
      ) {
        continue;
      }
      if (isFocus) {
        return enemy;
      }
      if (!best || enemy.GetHealth() < best.GetHealth()) {
        best = enemy;
      }
    }
    return best;
  }

  IsProtectedByTower(enemy: CDOTA_BaseNPC): boolean {
    for (const building of this.aroundEnemyBuildingsInvulnerable) {
      if (
        IsTowerLike(building) &&
        HeroUtil.GetDistanceToAttackRange(building, enemy) <= this.TowerDangerBuffer &&
        !this.CanDive(building)
      ) {
        return true;
      }
    }
    return false;
  }

  ActionRetreat(): boolean {
    if (this.TryTeleport()) {
      return true;
    }
    // 要回家补给时撤到集合点或塔下只会站着等，敌人还在附近传送不了，直接往泉水走
    const fountain = HeroUtil.GetTeamFountainPosition(this.hero.GetTeamNumber());
    const safePoint = this.needsRecover && fountain ? fountain : this.FindSafePoint();
    if (MoveToward(this.MoveContext(), safePoint, 'escape')) {
      return true;
    }
    if (!this.MoveTo(safePoint, UnitOrder.MOVE_TO_POSITION)) {
      this.SpreadOut();
    }
    return true;
  }

  ActionTask(task: Task | undefined): boolean {
    if (!task) {
      return false;
    }
    if (task.kind === 'recover') {
      return this.ActionRecover();
    }
    // 打肉山时肉山一定比单个英雄强，靠派够人与回复任务控制去留，不按单挑野怪的口径撤
    if (this.tookDamage && task.kind !== 'roshan' && this.LosingToNeutrals()) {
      return this.ActionRetreat();
    }
    if (this.AvoidTowerDive()) {
      return true;
    }
    if (this.Roadside(task)) {
      return true;
    }
    if (ItemDispatcher.Run(this)) {
      return true;
    }
    if (AbilityDispatcher.Run(this)) {
      return true;
    }
    if (this.TryTeleportToTask(task)) {
      return true;
    }
    if (task.kind === 'push' && this.AttackPushTarget(task)) {
      return true;
    }
    if (task.kind === 'roshan' && this.AttackRoshan(task)) {
      return true;
    }
    if (this.AttackNearbyCreep(task.kind)) {
      return true;
    }
    const destination = this.FormationPoint(task.pos);
    const entry = this.LaneDetour(destination, task.targetId);
    if (entry) {
      this.traceTarget = 'lane';
      return this.MoveTo(entry, UnitOrder.MOVE_TO_POSITION);
    }
    // 赶去交战点只管走，攻击移动会半路停下打野怪小兵，到了才开打的人逐个送；
    // 回防、去肉山离得远时同理，否则会一直打着身边的敌方塔和小兵走不开，也离不开塔区去传送
    const rushing =
      task.kind === 'fight' ||
      ((task.kind === 'defend' || task.kind === 'roshan') &&
        this.hero.GetAbsOrigin().__sub(destination).Length2D() > this.DefendAttackMoveRange);
    const order = rushing ? UnitOrder.MOVE_TO_POSITION : UnitOrder.ATTACK_MOVE;
    if (this.MoveTo(destination, order) || this.SpreadOut()) {
      return true;
    }
    this.traceTarget = 'arrived';
    return false;
  }

  /**
   * 停下来后和队友挨着站了一阵就让开一步，撤退点、等人处也不长期叠成一团。
   * 只在到位后调用，路过、打架时短暂靠近不管，免得互相让来让去走不了位。
   */
  private SpreadOut(): boolean {
    // 中间走开过就重新计时
    if (this.gameTime - this.spreadCheckedAt > 1) {
      this.crowdedSince = undefined;
    }
    this.spreadCheckedAt = this.gameTime;
    const here = this.hero.GetAbsOrigin();
    let pushX = 0;
    let pushY = 0;
    for (const ally of this.aroundFriendlyHeroes) {
      if (ally === this.hero || !ally.IsAlive()) {
        continue;
      }
      const away = here.__sub(ally.GetAbsOrigin());
      const gap = away.Length2D();
      if (gap >= FORMATION_SPACING) {
        continue;
      }
      // 完全重叠时没有方向，按编号错开
      const angle = this.hero.GetEntityIndex();
      const dirX = gap > 1 ? away.x / gap : Math.cos(angle);
      const dirY = gap > 1 ? away.y / gap : Math.sin(angle);
      pushX += dirX * (FORMATION_SPACING - gap);
      pushY += dirY * (FORMATION_SPACING - gap);
    }
    const length = Math.sqrt(pushX * pushX + pushY * pushY);
    if (length < 1) {
      this.crowdedSince = undefined;
      return false;
    }
    this.crowdedSince = this.crowdedSince ?? this.gameTime;
    if (this.gameTime - this.crowdedSince < this.CrowdedSeconds) {
      return false;
    }
    const step = Math.max(length, this.ArriveRadius * 2);
    const target = Vector(
      here.x + (pushX / length) * step,
      here.y + (pushY / length) * step,
      here.z,
    );
    // 让位的一步落到悬崖下或树林里就不让了，免得贴着地形原地打转
    if (!this.CanStepTo(here, target)) {
      return false;
    }
    return this.MoveTo(target, UnitOrder.MOVE_TO_POSITION);
  }

  private ActionRecover(): boolean {
    const fountain = HeroUtil.GetTeamFountainPosition(this.hero.GetTeamNumber());
    if (!fountain) {
      return false;
    }
    if (this.hero.GetAbsOrigin().__sub(fountain).Length2D() <= this.FountainArriveRadius) {
      return false;
    }
    if (this.TryTeleport()) {
      return true;
    }
    return this.MoveTo(fountain, UnitOrder.MOVE_TO_POSITION);
  }

  /**
   * 撤退或回家补给且四下无追兵时，是否该直接传送回泉水而不是一路走回家。
   */
  protected ShouldRetreatTeleportToFountain(): boolean {
    if (this.mode !== 'retreat' && this.mode !== 'recover') {
      return false;
    }
    if (
      this.mode === 'retreat' &&
      this.hero.GetHealthPercent() >= this.RetreatTeleportMaxHealthPercent
    ) {
      return false;
    }
    return this.CanStartTeleport();
  }

  /** 传送引导途中挨打会被打断，起手前要离开敌方英雄、敌方塔，且最近没有挨打；否则先走到安全处。 */
  /**
   * 能否开始读传送。回防要赶时间：传送只会被控制打断，挨小兵打不断，
   * 所以塔没在打自己时，站在敌方塔下、刚挨过打也直接读。
   */
  protected CanStartTeleport(urgent = false): boolean {
    if (this.hero.IsMuted() || this.aroundEnemyHeroes.length > 0) {
      return false;
    }
    const enemyTower = this.FindNearestEnemyTowerInvulnerable();
    if (urgent) {
      return !enemyTower || enemyTower.GetAttackTarget() !== this.hero;
    }
    if (this.gameTime - this.lastHurtTime < this.TeleportCalmSeconds) {
      return false;
    }
    return !enemyTower || this.hero.GetRangeToUnit(enemyTower) > this.RetreatTeleportTowerSafeRange;
  }

  /**
   * 撤退无追兵时用 TP 卷轴传送回自家泉水。英雄自带更好的传送手段时覆盖此方法。
   */
  protected TryTeleport(): boolean {
    if (!this.ShouldRetreatTeleportToFountain()) {
      return false;
    }
    const fountain = HeroUtil.GetTeamFountainPosition(this.hero.GetTeamNumber());
    if (!fountain) {
      return false;
    }
    return this.CastTeleportScroll(fountain);
  }

  private CastTeleportScroll(position: Vector): boolean {
    if (this.hero.IsMuted()) {
      return false;
    }
    const scroll = this.hero.FindItemInInventory('item_tpscroll');
    if (!scroll || !scroll.IsFullyCastable()) {
      return false;
    }
    this.hero.CastAbilityOnPosition(position, scroll, this.hero.GetPlayerOwnerID());
    if (IS_DEBUG_RUN) {
      print(`[bot-ai] ${HeroShortName(this.hero)} tp mode=${this.mode}`);
    }
    return true;
  }

  /**
   * 任务目的地在半张地图外时，TP 到离目的地最近、这会儿没人往上传的己方建筑。
   * 同一处交战或防守的人对齐到达时间，预计到得早的先走着等一等，避免一个个落地被逐个击破。
   */
  private TryTeleportToTask(task: Task): boolean {
    const here = this.hero.GetAbsOrigin();
    const target = this.ToWorld(task.pos);
    const distance = here.__sub(target).Length2D();
    if (
      distance < TELEPORT_MIN_DISTANCE ||
      !this.CanStartTeleport(task.kind === 'defend') ||
      !this.brain
    ) {
      return false;
    }
    const scroll = this.hero.FindItemInInventory('item_tpscroll');
    if (!scroll || !scroll.IsFullyCastable()) {
      return false;
    }
    const speed = Math.max(this.hero.GetIdealSpeed(), 1);
    const channel = scroll.GetChannelTime();
    let landing: CDOTA_BaseNPC | undefined;
    // 落点离目的地要比现在近出「引导时间 + 省下的时间」能走的路程
    let landingDistance = distance - (channel + this.TaskTeleportSavingSeconds) * speed;
    for (const building of this.brain.FindLandings()) {
      const buildingDistance = building.GetAbsOrigin().__sub(target).Length2D();
      if (buildingDistance < landingDistance) {
        landing = building;
        landingDistance = buildingDistance;
      }
    }
    if (!landing) {
      return false;
    }
    const eta = channel + landingDistance / speed;
    // 回防落在自家建筑边上有塔护着，先到的先帮忙，不必等人齐
    const aligned = task.kind === 'fight' && task.targetId !== undefined;
    if (aligned && this.brain.ShouldWaitToTeleport(this.hero, task.targetId as number, eta)) {
      return false;
    }
    const pos = landing.GetAbsOrigin();
    // 回防落在建筑靠泉水一侧，不当着来犯敌人的面落地
    const toward =
      task.kind === 'defend'
        ? (HeroUtil.GetTeamFountainPosition(this.hero.GetTeamNumber()) ?? target)
        : target;
    const offset = toward.__sub(pos).Normalized().__mul(this.TeleportLandingOffset);
    if (!this.CastTeleportScroll(pos.__add(offset))) {
      return false;
    }
    this.brain.CommitTeleport(
      this.hero,
      landing,
      aligned ? task.targetId : undefined,
      channel,
      eta,
    );
    return true;
  }

  /** 离肉山近了就指定它打；攻击移动到坑外会停下，站着不出手。 */
  private AttackRoshan(task: Task): boolean {
    const roshan = EntIndexToHScript(task.targetId as EntityIndex) as CDOTA_BaseNPC | undefined;
    if (!roshan || !IsValidEntity(roshan) || !roshan.IsAlive()) {
      return false;
    }
    if (!ActionAttack.MoveToAttack(this.hero, roshan, this.RoshanAttackRange)) {
      return false;
    }
    this.traceTarget = 'roshan';
    return true;
  }

  /** 附近没有敌方英雄时顺手捡符、捡肉山掉落、占前哨、点观察者；赶去打架或回防时只捡肉山掉落。 */
  private Roadside(task: Task): boolean {
    if (this.aroundEnemyHeroes.length > 0) {
      this.roadsideUntil = 0;
      return false;
    }
    if (this.gameTime < this.roadsideUntil) {
      this.traceTarget = 'roadside';
      return true;
    }
    if (this.gameTime < this.roadsideCheckAt) {
      return false;
    }
    this.roadsideCheckAt = this.gameTime + this.RoadsideCheckInterval;
    const seconds = TryRoadside(
      this.hero,
      task.kind === 'fight' || task.kind === 'defend',
      UnitPower,
    );
    if (seconds <= 0) {
      return false;
    }
    this.roadsideUntil = this.gameTime + Math.min(seconds, this.RoadsideMaxSeconds);
    this.traceTarget = 'roadside';
    return true;
  }

  /** 兵线已到目标建筑时直接点建筑，偷塔保护、塔在打人或附近有敌方英雄时交给普通移动。 */
  private AttackPushTarget(task: Task): boolean {
    if (task.targetId === undefined) {
      return false;
    }
    const building = EntIndexToHScript(task.targetId as EntityIndex) as CDOTA_BaseNPC | undefined;
    // 目标倒下后实体编号会被别的实体复用，拿到的未必还是单位
    if (
      !building ||
      building.IsNull() ||
      !building.IsBaseNPC() ||
      !building.IsAlive() ||
      building.IsInvulnerable()
    ) {
      return false;
    }
    if (this.hero.GetRangeToUnit(building) > this.PushAttackRange) {
      return false;
    }
    if (building.HasModifier('modifier_backdoor_protection_active')) {
      return false;
    }
    if (IsTowerLike(building) && !this.CanDive(building)) {
      return false;
    }
    this.traceTarget = building.GetUnitName();
    if (this.hero.IsAttacking() && this.hero.GetAttackTarget() === building) {
      return true;
    }
    ExecuteOrderFromTable({
      OrderType: UnitOrder.ATTACK_TARGET,
      UnitIndex: this.hero.GetEntityIndex(),
      TargetIndex: building.GetEntityIndex(),
      Queue: false,
    });
    return true;
  }

  /**
   * 攻击移动到了目的地就停手，目的地常在兵线旁，站着不出手时去打最近的敌方小兵。
   * 塔下打不得的不去；野怪只在打野任务时打，路过野区不停下。
   */
  /** 正在打自己的野怪（含远古）战力合计超过自己时先撤，野怪追一段就回营地。 */
  private LosingToNeutrals(): boolean {
    let power = 0;
    for (const unit of FindUnitsInRadius(
      this.hero.GetTeamNumber(),
      this.hero.GetAbsOrigin(),
      undefined,
      this.NeutralThreatRadius,
      UnitTargetTeam.ENEMY,
      UnitTargetType.CREEP,
      UnitTargetFlags.NONE,
      FindOrder.ANY,
      false,
    )) {
      if (unit.GetTeamNumber() === DotaTeam.NEUTRALS && unit.GetAttackTarget() === this.hero) {
        power += UnitPower(unit);
      }
    }
    return power > UnitPower(this.hero);
  }

  /** 顺手打身边最近的敌方小兵；野怪只在发育时打，或推进路过、自己够强时顺手打。远古野靠发育任务的攻击移动去打。 */
  private AttackNearbyCreep(kind: TaskKind): boolean {
    const creep = this.aroundEnemyCreeps[0];
    if (this.hero.IsAttacking() || !creep || this.IsProtectedByTower(creep)) {
      return false;
    }
    let reach = this.hero.Script_GetAttackRange() + this.CreepClearExtraRange;
    if (creep.GetTeamNumber() === DotaTeam.NEUTRALS) {
      if (kind !== 'farm' && (kind !== 'push' || UnitPower(this.hero) < QUICK_CLEAR_POWER)) {
        return false;
      }
      reach = Math.max(reach, this.NeutralClearRange);
    } else if (kind === 'push') {
      reach = Math.max(reach, this.PushCreepChaseRange);
    }
    if (!ActionAttack.MoveToAttack(this.hero, creep, reach)) {
      return false;
    }
    this.traceTarget = 'creep';
    return true;
  }

  /** 主物品栏里闪烁匕首升级链上的任意一件。 */
  protected FindBlinkItem(): CDOTA_Item | undefined {
    return FindBlinkItem(this.hero);
  }

  private MoveContext(): MoveContext {
    return { hero: this.hero, nearestEnemy: this.aroundEnemyHeroes[0], stance: this.stance };
  }

  /** 朝目的地移动，目的地没变且单位还在走或在打时不重复下指令。 */
  private MoveTo(position: Vector, order: UnitOrder): boolean {
    if (this.hero.GetAbsOrigin().__sub(position).Length2D() <= this.ArriveRadius) {
      return false;
    }
    // 赶路时附近没有敌方英雄才闪烁，有敌人时留着切入或逃跑
    if (this.aroundEnemyHeroes.length === 0 && MoveToward(this.MoveContext(), position, 'move')) {
      return true;
    }
    const busy = this.hero.IsMoving() || this.hero.IsAttacking();
    if (
      busy &&
      this.lastOrderPos !== undefined &&
      this.lastOrderType === order &&
      this.lastOrderPos.__sub(position).Length2D() < this.OrderRepeatDistance &&
      this.gameTime - this.lastOrderTime < this.OrderRefreshTime
    ) {
      return false;
    }
    ExecuteOrderFromTable({
      OrderType: order,
      UnitIndex: this.hero.GetEntityIndex(),
      Position: position,
      Queue: false,
    });
    this.lastOrderPos = position;
    this.lastOrderType = order;
    this.lastOrderTime = this.gameTime;
    return true;
  }

  /** 每个英雄在目的地附近各有一个固定站位，一起行动时散开成一片，不挤成一个点、排成一条线走。 */
  private FormationPoint(point: Point): Vector {
    const spot = this.ToWorld(this.brain?.SlotOf(this.hero) ?? point);
    // 目的地贴着进不得的敌方塔时，散开的站位可能落进射程，和躲塔来回拉扯，这时站回目的地本身
    const inTowerRange = this.aroundEnemyBuildingsInvulnerable.some(
      (tower) =>
        IsTowerLike(tower) &&
        !this.CanDive(tower) &&
        tower.GetAbsOrigin().__sub(spot).Length2D() <=
          TowerAttackRange(tower) + this.TowerDangerBuffer,
    );
    return inTowerRange ? this.ToWorld(point) : spot;
  }

  /** 去目的地的路上有进不得的敌方塔时，先绕到它靠自家一侧的外圈；要推的那座塔不绕。 */
  /** 直线赶路会穿过敌方塔区时改走兵线；直接走得过去就直接走，不绕回兵线。 */
  private LaneDetour(destination: Vector, targetId: number | undefined): Vector | undefined {
    const here = this.hero.GetAbsOrigin();
    const towers = this.aroundEnemyBuildingsInvulnerable.filter(
      (tower) => IsTowerLike(tower) && tower.GetEntityIndex() !== targetId && !this.CanDive(tower),
    );
    const blocked = (point: Point) =>
      towers.some((tower) =>
        passesTower(
          here,
          point,
          tower.GetAbsOrigin(),
          TowerAttackRange(tower) + this.TowerDangerBuffer + this.TowerDetourMargin,
        ),
      );
    if (!this.brain || !blocked(destination)) {
      return undefined;
    }
    const entry = this.brain.LaneEntry(here, destination, blocked);
    return entry ? this.ToWorld(entry) : undefined;
  }

  private ToWorld(point: Point): Vector {
    return GetGroundPosition(Vector(point.x, point.y, 0), this.hero);
  }

  // ---------------------------------------------------------
  // Tower dive
  // ---------------------------------------------------------
  /** 不进敌方塔的攻击范围，除非塔在打小兵、塔下人多血厚，或者已经在打到底；被塔盯上就先退出去。 */
  protected CanDive(tower: CDOTA_BaseNPC): boolean {
    const towerTarget = tower.GetAttackTarget();
    // 转移仇恨也没甩掉塔时，等血量掉到扛塔门槛再走已经走不出射程
    if (towerTarget === this.hero && this.hero.GetHealthPercent() < this.DeaggroHealthPercent) {
      return false;
    }
    const towerOnHero = towerTarget !== undefined && towerTarget.IsHero();
    if (!towerOnHero && this.CountCreepsNear(tower) >= this.DiveMinCreeps) {
      return true;
    }
    if (
      this.hero.GetHealthPercent() >= this.DiveMinHealthPercent &&
      this.CountHeroesAtTower(tower) >= this.DiveMinHeroes
    ) {
      return true;
    }
    return this.CanOutlastTower(tower);
  }

  /** 塔下我方一起打塔，能不能在塔把自己打到该撤的血量之前把塔推掉。 */
  private CanOutlastTower(tower: CDOTA_BaseNPC): boolean {
    const index = tower.GetEntityIndex();
    const cached = this.outlastCache.get(index);
    if (cached && this.gameTime < cached.until) {
      return cached.ok;
    }
    const ok = this.EstimateOutlast(tower);
    this.outlastCache.set(index, { ok, until: this.gameTime + this.TerrainCheckInterval });
    return ok;
  }

  private EstimateOutlast(tower: CDOTA_BaseNPC): boolean {
    let teamDps = 0;
    for (const ally of this.aroundFriendlyHeroes) {
      if (
        ally.IsAlive() &&
        ally.IsRealHero() &&
        HeroUtil.GetDistanceToAttackRange(tower, ally) <= this.DiveGatherRange
      ) {
        teamDps += calculateAttackDPS(ally, tower);
      }
    }
    return canOutlastTower({
      heroHealth: this.hero.GetHealth(),
      heroReserve: (this.hero.GetMaxHealth() * this.DeaggroHealthPercent) / 100,
      towerDpsOnHero: calculateAttackDPS(tower, this.hero),
      towerHealth: tower.GetHealth(),
      teamDpsOnTower: teamDps,
    });
  }

  private CountCreepsNear(tower: CDOTA_BaseNPC): number {
    return FindUnitsInRadius(
      this.hero.GetTeamNumber(),
      tower.GetAbsOrigin(),
      undefined,
      this.DiveCheckRadius,
      UnitTargetTeam.FRIENDLY,
      UnitTargetType.CREEP,
      UnitTargetFlags.NOT_ILLUSIONS,
      FindOrder.ANY,
      false,
    ).length;
  }

  /** 已进塔或在射程边缘的健康队友都算，否则先到的人数不够又退出来，大家一直凑不齐。 */
  private CountHeroesAtTower(tower: CDOTA_BaseNPC): number {
    let count = 0;
    for (const ally of this.aroundFriendlyHeroes) {
      if (
        ally.IsAlive() &&
        ally.IsRealHero() &&
        ally.GetHealthPercent() >= this.DiveMinHealthPercent &&
        HeroUtil.GetDistanceToAttackRange(tower, ally) <= this.DiveGatherRange
      ) {
        count++;
      }
    }
    return count;
  }

  /** 被敌方塔攻击到血量不多时，对塔下的友方单位下一次攻击指令，让塔换目标。 */
  protected DropTowerAggro(): boolean {
    if (
      this.hero.GetHealthPercent() >= this.DeaggroHealthPercent ||
      this.gameTime - this.lastDeaggroTime < this.DeaggroCooldown
    ) {
      return false;
    }
    const tower = this.FindNearestEnemyTowerInvulnerable();
    if (!tower || tower.GetAttackTarget() !== this.hero) {
      return false;
    }
    // 只找塔射程内的单位，塔丢掉仇恨后才有别的目标可换
    const ally = FindUnitsInRadius(
      this.hero.GetTeamNumber(),
      tower.GetAbsOrigin(),
      undefined,
      TowerAttackRange(tower),
      UnitTargetTeam.FRIENDLY,
      UnitTargetType.HERO + UnitTargetType.BASIC,
      UnitTargetFlags.NONE,
      FindOrder.CLOSEST,
      false,
    ).find((unit) => unit !== this.hero);
    if (!ally) {
      return false;
    }
    this.lastDeaggroTime = this.gameTime;
    if (IS_DEBUG_RUN) {
      print(
        `[bot-ai] ${HeroShortName(this.hero)} hp=${Math.floor(this.hero.GetHealthPercent())}%` +
          ` deaggro=${ally.GetUnitName()} tower=${tower.GetUnitName()}`,
      );
    }
    ExecuteOrderFromTable({
      OrderType: UnitOrder.ATTACK_TARGET,
      UnitIndex: this.hero.GetEntityIndex(),
      TargetIndex: ally.GetEntityIndex(),
      Queue: false,
    });
    return true;
  }

  protected AvoidTowerDive(): boolean {
    const tower = this.FindNearestEnemyTowerInvulnerable();
    if (!tower) {
      return false;
    }
    if (HeroUtil.GetDistanceToAttackRange(tower, this.hero) > this.TowerDangerBuffer) {
      return false;
    }
    if (this.CanDive(tower)) {
      return false;
    }
    const fountain = HeroUtil.GetTeamFountainPosition(this.hero.GetTeamNumber());
    if (!fountain) {
      return false;
    }
    this.traceTarget = `avoid:${tower.GetUnitName()}`;
    if (GameRules.AI.BotTeam?.IsNativeActive() === false) {
      const here = this.hero.GetAbsOrigin();
      const distance = Math.max(
        this.ArriveRadius + 50,
        this.TowerDangerBuffer - HeroUtil.GetDistanceToAttackRange(tower, this.hero) + 50,
      );
      const dangerous = this.aroundEnemyBuildingsInvulnerable
        .filter(
          (building) =>
            IsTowerLike(building) &&
            HeroUtil.GetDistanceToAttackRange(building, this.hero) <= this.TowerNearbyRange,
        )
        .map((building) => building.GetAbsOrigin());
      const retreat = retreatPointFromTowers(here, dangerous, fountain, distance);
      this.MoveTo(this.ReachableStep(here, retreat, fountain), UnitOrder.MOVE_TO_POSITION);
      return true;
    }
    this.continueActionEndTime = this.gameTime + this.towerEscapeTime;
    this.EscapeFromTower(tower, fountain);
    return true;
  }

  /**
   * 朝 target 方向走一小步的落脚点。高地边缘直线背离塔常落到悬崖下，走过去会贴着崖边原地不动，
   * 这时左右偏转找一个能直接走到的点，都不行就往泉水走，寻路会自己绕下坡道。
   */
  private ReachableStep(here: Vector, target: Point, fountain: Vector): Vector {
    // 躲塔每次思考都会调用，结果记一会儿
    if (this.stepCache && this.gameTime < this.stepCache.until) {
      return this.stepCache.point;
    }
    const point = this.FindReachableStep(here, target, fountain);
    this.stepCache = { point, until: this.gameTime + this.TerrainCheckInterval };
    return point;
  }

  private FindReachableStep(here: Vector, target: Point, fountain: Vector): Vector {
    const dx = target.x - here.x;
    const dy = target.y - here.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length < 1) {
      return fountain;
    }
    for (const degrees of [0, 30, -30, 60, -60, 90, -90]) {
      const angle = (degrees * Math.PI) / 180;
      const x = (dx * Math.cos(angle) - dy * Math.sin(angle)) / length;
      const y = (dx * Math.sin(angle) + dy * Math.cos(angle)) / length;
      const point = GetGroundPosition(
        Vector(here.x + x * length, here.y + y * length, here.z),
        this.hero,
      );
      if (this.CanStepTo(here, point)) {
        return point;
      }
    }
    return fountain;
  }

  /** 短距离一步能不能直接走到：落点可走、没被树挡、和脚下不隔一层悬崖。不用寻路，寻路太贵。 */
  private CanStepTo(here: Vector, point: Vector): boolean {
    const ground = GetGroundPosition(point, this.hero);
    return (
      GridNav.IsTraversable(ground) &&
      !GridNav.IsBlocked(ground) &&
      Math.abs(ground.z - GetGroundPosition(here, this.hero).z) < this.CliffHeight
    );
  }

  private EscapeFromTower(tower: CDOTA_BaseNPC, fountain: Vector): void {
    const now = GameRules.GetDOTATime(false, true);
    if (
      now > this.continueActionEndTime ||
      !IsValidEntity(tower) ||
      !tower.IsAlive() ||
      !this.hero.IsAlive() ||
      HeroUtil.GetDistanceToAttackRange(tower, this.hero) > this.TowerDangerBuffer
    ) {
      this.continueActionEndTime = now;
      return;
    }
    ExecuteOrderFromTable({
      OrderType: UnitOrder.MOVE_TO_POSITION,
      UnitIndex: this.hero.GetEntityIndex(),
      Position: fountain,
      Queue: false,
    });
    Timers.CreateTimer(this.towerEscapeTick, () => this.EscapeFromTower(tower, fountain));
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
    // 为捡盾腾出的主栏空位不能被整理挪回来的或新买的装备占掉
    if (this.gameTime < this.roadsideUntil) {
      return false;
    }
    // 买装卖装都不要求即时响应，而 SellExtraItems 是先扫完物品栏才判断够不够出售阈值，
    // 每 tick 跑一遍绝大多数时候只是在空扫
    if (this.gameTime < this.buildItemNextTime) {
      return false;
    }
    this.buildItemNextTime = this.gameTime + this.buildItemInterval;

    this.ArrangeItems();
    // 测试发的物品不在出装表里，照常买卖会被当成多余装备卖掉；Lua 里空字符串也算真，要显式比较
    const testItems = PERF_CONFIG?.testItems;
    if (testItems !== undefined && testItems !== '') {
      return false;
    }
    if (ConsumeItem.ConsumeKnownItems(this.hero)) {
      return true;
    }
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

  /**
   * 主物品栏有空位时把备用栏的物品挪上来，否则卖装或用掉消耗品后空出的格子一直闲着；
   * 再按施放档位排好主物品栏，施放时按格子顺序检查，重要的先放。
   */
  private ArrangeItems(): void {
    let backpack = InventorySlot.SLOT_7;
    const priorities: number[] = [];
    for (let slot = InventorySlot.SLOT_1; slot <= InventorySlot.SLOT_6; slot++) {
      let item = this.hero.GetItemInSlot(slot);
      if (!item) {
        while (backpack <= InventorySlot.SLOT_9 && !this.hero.GetItemInSlot(backpack)) {
          backpack++;
        }
        if (backpack <= InventorySlot.SLOT_9) {
          this.hero.SwapItems(backpack, slot);
          backpack++;
          item = this.hero.GetItemInSlot(slot);
        }
      }
      priorities.push(item ? ItemRegistry.priorityOf(item.GetName()) : EMPTY_SLOT);
    }
    for (const [from, to] of planSlotSwaps(priorities)) {
      this.hero.SwapItems(from, to);
    }
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
      // print(`[AI] HeroBase PickNeutralItem ${this.hero.GetUnitName()} 没有找到中立物品`);
      return false;
    }

    const selectedEnhancement = NeutralItemManager.GetRandomTierEnhancements(
      targetTier,
      neutralItemConfig,
      this.hero,
    );
    if (!selectedEnhancement) {
      // print(`[AI] HeroBase PickNeutralItem ${this.hero.GetUnitName()} 没有找到中立增强`);
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
  private ShouldStopChannel(): boolean {
    const ability = this.hero.GetCurrentActiveAbility();
    if (ability && ROADSIDE_CHANNELS.includes(ability.GetAbilityName())) {
      return this.aroundEnemyHeroes.length > 0;
    }
    const specs = ability ? AbilityRegistry.get(ability.GetName()) : undefined;
    if (!ability || !specs) {
      return false;
    }
    for (const spec of specs) {
      const stop = spec.stopChannel;
      if (!stop) {
        continue;
      }
      if (
        stop.afterSeconds !== undefined &&
        GameRules.GetGameTime() - ability.GetChannelStartTime() >= stop.afterSeconds
      ) {
        return true;
      }
      if (stop.noEnemyHeroInRange !== undefined) {
        const now = GameRules.GetGameTime();
        const range = stop.noEnemyHeroInRange;
        if (
          this.aroundEnemyHeroes.some(
            (enemy) => enemy.IsAlive() && this.hero.GetRangeToUnit(enemy) <= range,
          )
        ) {
          this.channelEnemySeenTime = now;
        } else if (
          now - Math.max(this.channelEnemySeenTime, ability.GetChannelStartTime()) >=
          (stop.graceSeconds ?? 0)
        ) {
          return true;
        }
      }
    }
    return false;
  }

  IsInAbilityPhase(): boolean {
    if (this.hero.IsChanneling()) {
      if (this.ShouldStopChannel()) {
        if (IS_DEBUG_RUN) {
          print(
            `[bot-cast] ${HeroShortName(this.hero)} stop_channel ${this.hero.GetCurrentActiveAbility()?.GetAbilityName()}`,
          );
        }
        this.hero.Stop();
      }
      return true;
    }

    // 已下达但未完成的施法命令（含 cast point 阶段、命令下发到执行之间的间隙）也算施法中，
    // 避免下个 tick 又下新命令打断自己。
    // if (this.hero.GetCurrentActiveAbility() !== undefined) {
    //   return true;
    // }

    const abilityCount = this.hero.GetAbilityCount();
    for (let i = 0; i < abilityCount; i++) {
      const ability = this.hero.GetAbilityByIndex(i);
      if (ability && ability.IsInAbilityPhase()) {
        return true;
      }
    }

    return false;
  }

  // ---------------------------------------------------------
  // Find unit
  // ---------------------------------------------------------

  /** 身边的远古野，只在有技能想对它施放时才搜，同一轮思考内复用。 */
  GetAroundEnemyAncients(): CDOTA_BaseNPC[] {
    if (this.aroundEnemyAncientsTime !== this.gameTime) {
      this.aroundEnemyAncients = ActionFind.FindEnemyAncients(this.hero, this.FindRadius);
      this.aroundEnemyAncientsTime = this.gameTime;
    }
    return this.aroundEnemyAncients;
  }

  private FindAround(): void {
    this.aroundEnemyHeroes = ActionFind.FindEnemyHeroes(this.hero, this.FindRadius);
    this.aroundEnemyCreeps = ActionFind.FindEnemyCreeps(this.hero, this.FindRadius);
    this.aroundEnemyBuildingsInvulnerable = ActionFind.FindEnemyBuildingsInvulnerable(
      this.hero,
      this.FindRadius,
    );
    const vulnerableBuildings: CDOTA_BaseNPC[] = [];
    for (const building of this.aroundEnemyBuildingsInvulnerable) {
      if (!building.IsInvulnerable()) {
        vulnerableBuildings.push(building);
      }
    }
    this.aroundEnemyBuildings = vulnerableBuildings;
    this.aroundFriendlyHeroes = ActionFind.FindFriendlyHeroes(this.hero, this.FindRadius);
    this.aroundFriendlyCreeps = ActionFind.FindFriendlyCreeps(
      this.hero,
      FRIENDLY_CREEP_SEARCH_RADIUS,
    );
    this.aroundFriendlyBuildings = ActionFind.FindFriendlyBuildings(this.hero, this.FindRadius);
  }

  public FindNearestEnemyHero(): CDOTA_BaseNPC | undefined {
    if (this.aroundEnemyHeroes.length === 0) {
      return undefined;
    }

    const target = this.aroundEnemyHeroes[0];
    return target;
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
    // print(`[AI] HeroBase OnCreated delay ${delay}`);
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

function IsTowerLike(building: CDOTA_BaseNPC): boolean {
  const name = building.GetUnitName();
  return name.includes('tower') || name.includes('fort');
}
