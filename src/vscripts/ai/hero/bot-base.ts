import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';
import { AbilityDispatcher } from '../ability/ability-dispatcher';
import { ActionAttack } from '../action/action-attack';
import { ActionFind } from '../action/action-find';
import { ActionMove } from '../action/action-move';
import { getHeroBuildConfig } from '../build-item/hero-build-config';
import { HeroBuildManager } from '../build-item/hero-build-manager';
import { HeroBuildState, InitializeHeroBuild } from '../build-item/hero-build-state';
import { SellItem } from '../build-item/sell-item';
import { NeutralItemConfig, NeutralItemManager, NeutralTierConfig } from '../item/neutral-item';
import { UseItem } from '../item/use-item';
import { ModeEnum } from '../mode/mode-enum';
import { HeroUtil } from './hero-util';

@registerModifier('ai/hero/bot-base')
export class BotBaseAIModifier extends BaseModifier {
  protected readonly ThinkInterval: number = 0.3;
  protected readonly ThinkIntervalTool: number = 0.3;

  // 持续动作结束时间
  protected readonly continueActionTime: number = 8;
  protected continueActionEndTime: number = -60;

  // 中立槽修复节奏：间隔与下次校验时间（gameTime）
  protected readonly neutralItemRepairInterval: number = 5;
  protected neutralItemRepairNextTime: number = -60;
  // 中立槽状态
  private neutralItemTier: number = 0;
  private desiredNeutralActive: NeutralItemConfig | undefined;
  private desiredNeutralPassive: NeutralItemConfig | undefined;

  protected readonly FindRadius: number = 1800;
  protected readonly CastRange: number = 900;

  protected readonly AttackRangeLaning: number = 300;
  protected readonly AttackRangeAttack: number = 1200;
  // 推塔时贴上去的最小距离：近战在此距离内才走过去A，远程则用自身攻击范围
  protected readonly MinPushTowerRange: number = 300;
  protected readonly AttackRangePushHero: number = 900;

  public PushLevel: number = 10;

  protected hero: CDOTA_BaseNPC_Hero;
  public GetHero(): CDOTA_BaseNPC_Hero {
    return this.hero;
  }

  // 当前状态
  public gameTime: number = 0;
  public mode: ModeEnum = ModeEnum.LANING;

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
  public aroundFriendlyHeroes: CDOTA_BaseNPC[] = [];
  public aroundFriendlyCreeps: CDOTA_BaseNPC[] = [];
  public aroundFriendlyBuildings: CDOTA_BaseNPC[] = [];

  protected isIntHero: boolean = false;

  Init() {
    this.hero = this.GetParent() as CDOTA_BaseNPC_Hero;
    print(`[AI] HeroBase OnCreated ${this.hero.GetUnitName()}`);

    if (GameRules.AI.BotTeam) {
      this.PushLevel = GameRules.AI.BotTeam.botPushLevel;
    }

    this.isIntHero = this.hero.GetPrimaryAttribute() === Attributes.INTELLECT;

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

    this.FindAround();
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

  ActionLaning(): boolean {
    if (AbilityDispatcher.Run(this)) {
      return true;
    }
    if (this.CastSelf()) {
      return true;
    }
    if (this.CastEnemy()) {
      return true;
    }
    if (this.CastTeam()) {
      return true;
    }
    if (this.CastCreep()) {
      return true;
    }
    if (this.aroundFriendlyCreeps.length > 0) {
      const enemy = this.FindNearestEnemyHero();
      if (enemy && ActionAttack.MoveToAttack(this.hero, enemy, this.AttackRangeLaning)) {
        return true;
      }
    }
    return false;
  }

  ActionAttack(): boolean {
    if (AbilityDispatcher.Run(this)) {
      return true;
    }
    if (this.CastSelf()) {
      return true;
    }
    if (this.CastEnemy()) {
      return true;
    }
    if (this.CastTeam()) {
      return true;
    }
    if (this.CastCreep()) {
      return true;
    }
    if (!this.isIntHero) {
      const enemy = this.FindNearestEnemyHero();
      if (enemy && ActionAttack.MoveToAttack(this.hero, enemy, this.AttackRangeAttack)) {
        return true;
      }
    }
    return false;
  }

  ActionRetreat(): boolean {
    if (AbilityDispatcher.Run(this)) {
      return true;
    }
    if (this.CastSelf()) {
      return true;
    }
    if (this.CastTeam()) {
      return true;
    }

    // 撤离动作持续
    const enemyTower = this.FindNearestEnemyTowerInvulnerable();
    if (enemyTower) {
      this.continueActionEndTime = this.gameTime + this.continueActionTime;
      this.ThinkRetreatGetAwayFromTower();
      return true;
    }

    if (this.CastEnemy()) {
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
    if (AbilityDispatcher.Run(this)) {
      return true;
    }
    if (this.CastSelf()) {
      return true;
    }
    if (this.CastEnemy()) {
      return true;
    }
    if (this.CastTeam()) {
      return true;
    }
    if (this.CastCreep()) {
      return true;
    }
    // INT 英雄不强制推塔，攻击
    if (this.isIntHero) {
      return false;
    }
    // 推塔
    if (this.ForceAttackTower()) {
      return true;
    }
    // 攻击附近敌方英雄
    const enemy = this.FindNearestEnemyHero();
    if (enemy && ActionAttack.MoveToAttack(this.hero, enemy, this.AttackRangePushHero)) {
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

    if (this.hero.IsAttacking()) {
      // print(`[AI] HeroBase Think break 正在攻击中 ${this.hero.GetUnitName()}`);
      return false;
    }
    // 敌方英雄进入施法范围则不优先A塔
    const enemyHero = this.FindNearestEnemyHero();
    if (enemyHero && HeroUtil.GetDistanceToHero(this.hero, enemyHero) <= this.CastRange) {
      return false;
    }

    // 近战只在300内走过去A，远程在自身攻击范围内继续A，超出则放弃（允许离开）
    const pushRange = Math.max(this.MinPushTowerRange, this.hero.GetBaseAttackRange());
    if (ActionAttack.MoveToAttack(this.hero, enemyBuild, pushRange)) {
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
    this.aroundEnemyBuildings = ActionFind.FindEnemyBuildings(this.hero, this.FindRadius);
    this.aroundEnemyBuildingsInvulnerable = ActionFind.FindEnemyBuildingsInvulnerable(
      this.hero,
      this.FindRadius,
    );
    this.aroundFriendlyHeroes = ActionFind.FindFriendlyHeroes(this.hero, this.FindRadius);
    this.aroundFriendlyCreeps = ActionFind.FindFriendlyCreeps(this.hero, 900);
    this.aroundFriendlyBuildings = ActionFind.FindFriendlyBuildings(this.hero, this.FindRadius);
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
