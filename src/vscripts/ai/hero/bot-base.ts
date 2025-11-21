import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';
import { ActionAttack } from '../action/action-attack';
import { ActionFind } from '../action/action-find';
import { ActionItem } from '../action/action-item';
import { ActionMove } from '../action/action-move';
import { BuildItemManager } from '../build-item/BuildItemManager';
import { getHeroBuildConfig } from '../build-item/hero-build-config';
import { HeroBuildState, InitializeHeroBuild } from '../build-item/hero-build-state';
import { HeroTemplate } from '../build-item/hero-template-config';
import { SellItem } from '../build-item/sell-item';
import { NeutralItemManager, NeutralTierConfig } from '../item/neutral-item';
import { UseItem } from '../item/use-item';
import { ModeEnum } from '../mode/mode-enum';
import { HeroUtil } from './hero-util';

@registerModifier()
export class BotBaseAIModifier extends BaseModifier {
  protected readonly ThinkInterval: number = 0.3;
  protected readonly ThinkIntervalTool: number = 0.3;

  // 持续动作结束时间
  protected readonly continueActionTime: number = 8;
  protected continueActionEndTime: number = 0;

  protected readonly FindHeroRadius: number = 1600;
  protected readonly FindRadius: number = 1600;
  protected readonly NotAttactTowerHeroAttackRangeBuff: number = 400;
  protected readonly CastRange: number = 900;

  public readonly PushLevel: number = 10;

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

  // 物品
  private neutralItemTier: number = 0;
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

    // 初始化出装状态
    // FIXME 待所有英雄使用新出装系统后删除
    if (this.useNewBuildSystem) {
      const config = getHeroBuildConfig(this.hero.GetUnitName());
      if (config) {
        this.buildState = InitializeHeroBuild(this.hero, config);
      } else {
        // 如果没有配置，使用默认 PhysicalCarry 模板
        this.buildState = InitializeHeroBuild(this.hero, { template: HeroTemplate.PhysicalCarry });
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
    // 检查是否被精神控制
    if (this.hero.HasModifier('modifier_mind_control')) {
      return; // 暂停AI思考
    }

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
    if (this.UseAbilityCreep()) {
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------
  // Item usage
  // ---------------------------------------------------------
  UseItemSelf(): boolean {
    // 使用点金手
    const creep = this.FindNearestEnemyCreep();
    if (
      ActionItem.UseItemOnTarget(this.hero, 'item_hand_of_group', creep, (target) => {
        // 点金手目标不能是远古
        if (target.IsAncient()) {
          return false;
        }
        return true;
      })
    ) {
      return true;
    }

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
    return false;
  }

  ActionAttack(): boolean {
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
    return false;
  }

  ActionRetreat(): boolean {
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
    return false;
  }

  PurchaseItem(): boolean {
    if (!this.buildState) {
      return false;
    }
    return BuildItemManager.TryPurchaseItem(this.hero, this.buildState);
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
