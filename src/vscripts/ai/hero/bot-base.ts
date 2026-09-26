import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';
import { AbilityDispatcher } from '../ability/ability-dispatcher';
import { GetFullCastRange } from '../ability/ability-cast';
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
import { BLINK_ITEM_NAMES } from '../item/specs/item_jump_jump_jump';
import { NeutralItemConfig, NeutralItemManager, NeutralTierConfig } from '../item/neutral-item';
import { PerfSampler } from '../../modules/debug/perf-sampler';
import { Point } from '../team/lane-geometry';
import { HeroShortName, TeamBrain, UnitPower } from '../team/team-brain';
import { Task, TaskKind } from '../team/team-plan';
import { WardPlacement } from '../ward/ward-placement';
import { canEscape, decideStance, Stance } from './engagement';
import { HeroUtil } from './hero-util';

// 性能排查只在工具模式生效，发布版每次思考只多一次常量判断
const IS_TOOLS_MODE = IsInToolsMode();

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
  protected readonly ChaseRange: number = 1200;
  // 智力英雄靠技能输出，追着普攻跑会脱离队伍
  protected readonly IntChaseExtra: number = 300;
  // 挨打或出手后这段时间内仍算交战中
  protected readonly EngageMemory: number = 3;

  protected readonly RecoverHealthPercent: number = 35;
  protected readonly RecoverManaPercent: number = 15;
  protected readonly RecoverDoneHealthPercent: number = 90;
  protected readonly RecoverDoneManaPercent: number = 70;
  protected readonly FountainArriveRadius: number = 600;

  // 进塔攻击范围前留的余量，以及能扛塔的人数、血量、塔下兵数
  protected readonly TowerDangerBuffer: number = 150;
  protected readonly DiveMinHeroes: number = 3;
  protected readonly DiveMinHealthPercent: number = 50;
  protected readonly DiveMinCreeps: number = 2;
  protected readonly DiveCheckRadius: number = 900;
  protected readonly DiveGatherRange: number = 400;
  // 血厚时让自己扛塔，否则人人一挨打就转移，塔下来回倒仇恨谁都不扛
  protected readonly DeaggroHealthPercent: number = 60;
  // 转移仇恨后塔若很快又打回自己，说明身边没有别的目标可换，这段时间内直接退出射程
  protected readonly DeaggroCooldown: number = 3;

  // 任务目的地很远、而己方建筑离目的地近得多时，用 TP 过去
  protected readonly TaskTeleportDistance: number = 6000;
  // 传送要引导，落地后还得追着往前走的兵线，省下的时间不够多就直接走过去
  protected readonly TaskTeleportSavingSeconds: number = 5;
  protected readonly TeleportLandingOffset: number = 400;
  protected readonly PushAttackRange: number = 1000;
  // 攻击距离外再多这么远的敌方小兵也顺手打掉，近战英雄也能照顾到身边一整波兵
  protected readonly CreepClearExtraRange: number = 400;
  // 远程野怪的攻击距离
  protected readonly NeutralThreatRadius: number = 800;

  // 同一目的地不重复下指令；单位停下或太久没更新时才重下
  protected readonly ArriveRadius: number = 300;
  protected readonly OrderRepeatDistance: number = 400;
  protected readonly OrderRefreshTime: number = 10;

  // 撤退回泉水的血量上限：高于此值多半只是躲塔或让位，不值得消耗卷轴
  protected readonly RetreatTeleportMaxHealthPercent: number = 30;
  // 传送引导约 3 秒，塔攻击距离 700 之外再留一段缓冲，避免刚起手就被塔火力打断
  protected readonly RetreatTeleportTowerSafeRange: number = 1200;

  protected hero: CDOTA_BaseNPC_Hero;
  public GetHero(): CDOTA_BaseNPC_Hero {
    return this.hero;
  }

  // 当前状态
  public gameTime: number = 0;
  public mode: BotMode = 'laning';
  protected stance: Stance = 'task';

  private engagedUntil: number = -60;
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
    if (IS_TOOLS_MODE) {
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
    this.traceTarget = '';
    const acted = this.ActionStance(task);
    if (IS_TOOLS_MODE) {
      this.TraceDecision(task);
    }
    if (acted) {
      return;
    }
    if (WardPlacement.Run(this)) {
      return;
    }
    this.BuildItem();
  }

  private ActionStance(task: Task | undefined): boolean {
    switch (this.stance) {
      case 'fight':
      case 'lastStand':
        this.mode = 'fight';
        return this.ActionAttack(task) || this.ActionTask(task);
      case 'retreat':
        this.mode = 'retreat';
        // 边撤边放技能物品，让追击有代价；不停下来普攻
        if (ItemDispatcher.Run(this) || AbilityDispatcher.Run(this)) {
          return true;
        }
        return this.ActionRetreat();
      case 'avoid':
        this.mode = 'retreat';
        return this.ActionRetreat();
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
    const enemies = this.aroundEnemyHeroes.filter(
      (enemy) => this.hero.GetRangeToUnit(enemy) <= this.LocalFightRadius,
    );
    const health = this.hero.GetHealth();
    const tookDamage = health < this.lastHealth;
    this.tookDamage = tookDamage;
    this.lastHealth = health;
    const attackTarget = this.hero.GetAttackTarget();
    if (
      enemies.length > 0 &&
      (tookDamage || (attackTarget !== undefined && attackTarget.IsHero()))
    ) {
      this.engagedUntil = this.gameTime + this.EngageMemory;
    }
    const engaged = enemies.length > 0 && this.gameTime < this.engagedUntil;
    this.traceInfo = '';
    this.retreatPoint = undefined;
    if (enemies.length === 0) {
      // 追兵刚跑出视野多半还在附近，撤退要撤完，不因一时看不见就掉头
      if (this.stance === 'retreat' && this.gameTime < this.engagedUntil) {
        return 'retreat';
      }
      return 'task';
    }

    const fight = brain.AssessFight(this.hero, enemies);
    this.retreatPoint = fight.rally;
    const escape = !engaged || this.CanEscape(enemies);
    if (IS_TOOLS_MODE) {
      this.traceInfo =
        `engaged=${engaged ? 1 : 0} escape=${escape ? 1 : 0}` +
        ` our=${Math.floor(fight.ourPower)}(${fight.ourNames.join(',')})` +
        ` enemy=${Math.floor(fight.enemyPower)}(${fight.enemyNames.join(',')}${fight.withTower ? ',tower' : ''})`;
    }
    const stance = decideStance({
      engaged,
      ourPower: fight.ourPower,
      enemyPower: fight.enemyPower,
      canEscape: escape,
    });
    if (engaged) {
      return stance;
    }
    if (this.needsRecover || task?.kind === 'regroup') {
      return 'avoid';
    }
    // 没被派去打的 bot 继续手上的任务，只在明显打不过时避开
    if (stance === 'avoid' || task?.kind === 'fight') {
      return stance;
    }
    return 'task';
  }

  private CanEscape(enemies: CDOTA_BaseNPC[]): boolean {
    let fastest = 0;
    for (const enemy of enemies) {
      fastest = Math.max(fastest, enemy.GetIdealSpeed());
    }
    return canEscape({
      rooted: this.hero.IsRooted(),
      ourSpeed: this.hero.GetIdealSpeed(),
      fastestEnemySpeed: fastest,
      distanceToSafety: this.hero.GetAbsOrigin().__sub(this.FindSafePoint()).Length2D(),
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
    for (const tower of Entities.FindAllByClassname('npc_dota_tower') as CDOTA_BaseNPC[]) {
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
    return ActionAttack.MoveToAttack(this.hero, target, range);
  }

  /** 优先团队指定的集火目标，否则挑血最少的；站在不能进的敌方塔下、或躲到还没推掉的塔后面的目标不追。 */
  private PickFightTarget(focusId: number | undefined): CDOTA_BaseNPC | undefined {
    let best: CDOTA_BaseNPC | undefined;
    for (const enemy of this.aroundEnemyHeroes) {
      const isFocus = enemy.GetEntityIndex() === focusId;
      if (!isFocus && this.hero.GetRangeToUnit(enemy) > this.ChaseRange) {
        continue;
      }
      if (this.IsProtectedByTower(enemy) || this.brain?.IsPastFront(enemy.GetAbsOrigin())) {
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

  private IsProtectedByTower(enemy: CDOTA_BaseNPC): boolean {
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
    const safePoint = this.FindSafePoint();
    if (this.TryBlinkToward(safePoint)) {
      return true;
    }
    this.MoveTo(safePoint, UnitOrder.MOVE_TO_POSITION);
    return true;
  }

  ActionTask(task: Task | undefined): boolean {
    if (!task) {
      return false;
    }
    if (task.kind === 'recover') {
      return this.ActionRecover();
    }
    if (task.kind === 'regroup') {
      return this.MoveTo(this.ToWorld(task.pos), UnitOrder.MOVE_TO_POSITION);
    }
    if (this.tookDamage && this.LosingToNeutrals()) {
      return this.ActionRetreat();
    }
    if (ItemDispatcher.Run(this)) {
      return true;
    }
    if (AbilityDispatcher.Run(this)) {
      return true;
    }
    if (this.AvoidTowerDive()) {
      return true;
    }
    if (this.TryTeleportToTask(task.pos)) {
      return true;
    }
    if (task.kind === 'push' && this.AttackPushTarget(task)) {
      return true;
    }
    if (this.AttackNearbyCreep(task.kind === 'farm')) {
      return true;
    }
    if (this.MoveTo(this.ToWorld(task.pos), UnitOrder.ATTACK_MOVE)) {
      return true;
    }
    this.traceTarget = 'arrived';
    return false;
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
    if (this.hero.IsMuted()) {
      return false;
    }
    if (
      this.mode === 'retreat' &&
      this.hero.GetHealthPercent() >= this.RetreatTeleportMaxHealthPercent
    ) {
      return false;
    }
    if (this.aroundEnemyHeroes.length > 0) {
      return false;
    }
    // 附近有敌方塔就不开引导，会被塔火力打断
    const enemyTower = this.FindNearestEnemyTowerInvulnerable();
    if (enemyTower && this.hero.GetRangeToUnit(enemyTower) <= this.RetreatTeleportTowerSafeRange) {
      return false;
    }
    return true;
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
    return true;
  }

  /** 任务目的地在半张地图外时，TP 到离目的地最近的己方建筑。 */
  private TryTeleportToTask(destination: Point): boolean {
    const here = this.hero.GetAbsOrigin();
    const target = this.ToWorld(destination);
    const distance = here.__sub(target).Length2D();
    if (distance < this.TaskTeleportDistance || this.aroundEnemyHeroes.length > 0) {
      return false;
    }
    const scroll = this.hero.FindItemInInventory('item_tpscroll');
    if (!scroll || !scroll.IsFullyCastable()) {
      return false;
    }
    const speed = Math.max(this.hero.GetIdealSpeed(), 1);
    const team = this.hero.GetTeamNumber();
    let landing: Vector | undefined;
    // 落点离目的地要比现在近出「引导时间 + 省下的时间」能走的路程
    let landingDistance =
      distance - (scroll.GetChannelTime() + this.TaskTeleportSavingSeconds) * speed;
    for (const tower of Entities.FindAllByClassname('npc_dota_tower') as CDOTA_BaseNPC[]) {
      if (tower.IsNull() || !tower.IsAlive() || tower.GetTeamNumber() !== team) {
        continue;
      }
      const towerDistance = tower.GetAbsOrigin().__sub(target).Length2D();
      if (towerDistance < landingDistance) {
        landing = tower.GetAbsOrigin();
        landingDistance = towerDistance;
      }
    }
    if (!landing) {
      return false;
    }
    const offset = target.__sub(landing).Normalized().__mul(this.TeleportLandingOffset);
    return this.CastTeleportScroll(landing.__add(offset));
  }

  /** 兵线已到目标建筑时直接点建筑，偷塔保护、塔在打人或附近有敌方英雄时交给普通移动。 */
  private AttackPushTarget(task: Task): boolean {
    if (task.targetId === undefined) {
      return false;
    }
    const building = EntIndexToHScript(task.targetId as EntityIndex) as CDOTA_BaseNPC | undefined;
    if (!building || building.IsNull() || !building.IsAlive() || building.IsInvulnerable()) {
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

  private AttackNearbyCreep(includeNeutrals: boolean): boolean {
    const creep = this.aroundEnemyCreeps[0];
    const reach = this.hero.Script_GetAttackRange() + this.CreepClearExtraRange;
    if (
      this.hero.IsAttacking() ||
      !creep ||
      (!includeNeutrals && creep.GetTeamNumber() === DotaTeam.NEUTRALS) ||
      this.IsProtectedByTower(creep)
    ) {
      return false;
    }
    if (!ActionAttack.MoveToAttack(this.hero, creep, reach)) {
      return false;
    }
    this.traceTarget = 'creep';
    return true;
  }

  /** 朝目的地闪烁；剩下的路不够闪一次满距离时不交，留给切入或逃跑。 */
  protected TryBlinkToward(position: Vector): boolean {
    if (this.hero.IsMuted() || this.hero.IsRooted()) {
      return false;
    }
    const blink = this.FindBlinkItem();
    if (!blink || !blink.IsFullyCastable()) {
      return false;
    }
    const here = this.hero.GetAbsOrigin();
    const offset = position.__sub(here);
    const distance = offset.Length2D();
    const range = GetFullCastRange(this.hero, blink);
    if (range <= 0 || distance < range) {
      return false;
    }
    this.hero.CastAbilityOnPosition(
      here.__add(offset.__mul(range / distance)),
      blink,
      this.hero.GetPlayerOwnerID(),
    );
    return true;
  }

  /** 主物品栏里闪烁匕首升级链上的任意一件。 */
  protected FindBlinkItem(): CDOTA_Item | undefined {
    for (let slot = InventorySlot.SLOT_1; slot <= InventorySlot.SLOT_6; slot++) {
      const item = this.hero.GetItemInSlot(slot);
      if (item && BLINK_ITEM_NAMES.includes(item.GetName())) {
        return item;
      }
    }
    return undefined;
  }

  /** 朝目的地移动，目的地没变且单位还在走或在打时不重复下指令。 */
  private MoveTo(position: Vector, order: UnitOrder): boolean {
    if (this.hero.GetAbsOrigin().__sub(position).Length2D() <= this.ArriveRadius) {
      return false;
    }
    // 赶路时附近没有敌方英雄才闪烁，有敌人时留着切入或逃跑
    if (this.aroundEnemyHeroes.length === 0 && this.TryBlinkToward(position)) {
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

  private ToWorld(point: Point): Vector {
    return GetGroundPosition(Vector(point.x, point.y, 0), this.hero);
  }

  // ---------------------------------------------------------
  // Tower dive
  // ---------------------------------------------------------
  /** 不进敌方塔的攻击范围，除非塔在打小兵、塔下人多血厚，或者已经在打到底；被塔盯上就先退出去。 */
  protected CanDive(tower: CDOTA_BaseNPC): boolean {
    // 基地塔与基地伤害高，打到底也不进
    if (this.stance === 'lastStand' && !IsBaseTower(tower)) {
      return true;
    }
    const towerTarget = tower.GetAttackTarget();
    // 转移仇恨也没甩掉塔时，等血量掉到扛塔门槛再走已经走不出射程
    if (towerTarget === this.hero && this.hero.GetHealthPercent() < this.DeaggroHealthPercent) {
      return false;
    }
    const towerOnHero = towerTarget !== undefined && towerTarget.IsHero();
    if (!towerOnHero && this.CountCreepsNear(tower) >= this.DiveMinCreeps) {
      return true;
    }
    return (
      this.hero.GetHealthPercent() >= this.DiveMinHealthPercent &&
      this.CountHeroesAtTower(tower) >= this.DiveMinHeroes
    );
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
      tower.Script_GetAttackRange(),
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
    if (IS_TOOLS_MODE) {
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
      this.MoveTo(fountain, UnitOrder.MOVE_TO_POSITION);
      return true;
    }
    this.continueActionEndTime = this.gameTime + this.towerEscapeTime;
    this.EscapeFromTower(tower, fountain);
    return true;
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
    // 买装卖装都不要求即时响应，而 SellExtraItems 是先扫完物品栏才判断够不够出售阈值，
    // 每 tick 跑一遍绝大多数时候只是在空扫
    if (this.gameTime < this.buildItemNextTime) {
      return false;
    }
    this.buildItemNextTime = this.gameTime + this.buildItemInterval;

    this.ArrangeItems();
    // 使用消耗品
    ConsumeItem.ConsumeKnownItems(this.hero);
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
        if (IS_TOOLS_MODE) {
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

function IsBaseTower(building: CDOTA_BaseNPC): boolean {
  const name = building.GetUnitName();
  return name.includes('tower4') || name.includes('fort');
}
