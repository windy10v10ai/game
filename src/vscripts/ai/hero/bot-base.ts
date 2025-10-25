import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';
import { ActionAttack } from '../action/action-attack';
import { ActionFind } from '../action/action-find';
import { ActionItem } from '../action/action-item';
import { ActionMove } from '../action/action-move';
import { SellItem } from '../build-item/sell-item';
import { NeutralItemManager, NeutralTierConfig } from '../item/neutral-item';
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
  protected assassinTargetSpot: Vector | undefined;

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

  public aroundEnemyHeroes: CDOTA_BaseNPC[] = [];
  public aroundEnemyCreeps: CDOTA_BaseNPC[] = [];
  public aroundEnemyBuildings: CDOTA_BaseNPC[] = [];
  public aroundEnemyBuildingsInvulnerable: CDOTA_BaseNPC[] = [];

  Init() {
    this.hero = this.GetParent() as CDOTA_BaseNPC_Hero;
    //print(`[AI] HeroBase OnCreated ${this.hero.GetUnitName()}`);

    // 初始化Think
    if (IsInToolsMode()) {
      this.StartIntervalThink(this.ThinkIntervalTool);
    } else {
      this.StartIntervalThink(this.ThinkInterval);
    }
  }

  OnIntervalThink(): void {
    this.hero = this.GetParent() as CDOTA_BaseNPC_Hero;
    this.gameTime = GameRules.GetDOTATime(false, false);
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
        //if (this.hero.isBoss) print(`[BotBoss] ${this.hero.GetUnitName()} executing ATTACK action`);
        return this.ActionAttack();
      case ModeEnum.LANING:
        //if (this.hero.isBoss) print(`[BotBoss] ${this.hero.GetUnitName()} executing LANING action`);
        return this.ActionLaning();
      case ModeEnum.PUSH:
        //if (this.hero.isBoss) print(`[BotBoss] ${this.hero.GetUnitName()} executing PUSH action`);
        return this.ActionPush();
      case ModeEnum.RETREAT:
        //if (this.hero.isBoss)
        //  print(`[BotBoss] ${this.hero.GetUnitName()} executing RETREAT action`);
        return this.ActionRetreat();
      case ModeEnum.SPLIT_PUSH:
        //if (this.hero.isBoss)
        //  print(`[BotBoss] ${this.hero.GetUnitName()} executing SPLIT_PUSH action`);
        return this.ActionSplitPush();
      case ModeEnum.ASSASSIN:
        //if (this.hero.isBoss)
        //  print(`[BotBoss] ${this.hero.GetUnitName()} executing ASSASSIN action`);
        return this.ActionAssassin();
      //case ModeEnum.VANGUARD:
      //  if (this.hero.isBoss) print(`[BotBoss] ${this.hero.GetUnitName()} executing VANGUARD action`);
      //  return this.ActionVanguard();
      default:
        //print(`[AI] HeroBase ThinkMode ${this.hero.GetUnitName()} mode ${this.mode} not found`);
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

  // 添加新的行为方法
  protected ActionSplitPush(): boolean {
    //const heroName = this.hero.GetUnitName();
    //print(`[AI-SplitPush] ${heroName} executing split push action`);

    // 寻找最远的可推进兵线
    const lanes = [
      Vector(-6000, -6000, 0), // 下路
      Vector(0, 0, 0), // 中路
      Vector(6000, 6000, 0), // 上路
    ];

    // 找到离队友最远的路
    const nearbyAllies = this.FindNearbyAllies(1800);
    //print(`[AI-SplitPush] ${heroName} found ${nearbyAllies.length} allies nearby`);

    let bestLane = lanes[0];
    let maxDistance = 0;

    for (let i = 0; i < lanes.length; i++) {
      const lane = lanes[i];
      let totalDistance = 0;
      for (const ally of nearbyAllies) {
        totalDistance += ((ally.GetAbsOrigin() - lane) as Vector).Length2D();
      }
      if (totalDistance > maxDistance) {
        maxDistance = totalDistance;
        bestLane = lane;
        //const laneNames = ['下路', '中路', '上路'];
        //print(
        //  `[AI-SplitPush] ${heroName} selected ${laneNames[i]} (distance: ${maxDistance.toFixed(0)})`,
        //);
      }
    }

    // 移动到该路
    //const distanceToLane = this.GetDistanceToPosition(bestLane);
    //print(`[AI-SplitPush] ${heroName} moving to lane (distance: ${distanceToLane.toFixed(0)})`);
    this.hero.MoveToPosition(bestLane);

    // 攻击附近的塔
    const nearestTower = this.FindNearestEnemyTower();
    if (nearestTower && this.GetDistanceTo(nearestTower) < 800) {
      //print(
      // `[AI-SplitPush] ${heroName} attacking tower at distance ${this.GetDistanceTo(nearestTower).toFixed(0)}`,
      //);
      ActionAttack.Attack(this.hero, nearestTower);
    } else if (nearestTower) {
      //print(
      //  `[AI-SplitPush] ${heroName} tower too far (${this.GetDistanceTo(nearestTower).toFixed(0)})`,
      //);
    } else {
      //print(`[AI-SplitPush] ${heroName} no tower found`);
    }

    // 使用技能清兵
    if (this.CastCreep()) {
      //print(`[AI-SplitPush] ${heroName} cast ability on creeps`);
    }

    return true;
  }

  // 在 ModeBase 类中
  protected ActionAssassin(): boolean {
    //const heroName = this.hero.GetUnitName();
    //print(`[AI-Assassin] ${heroName} executing assassin action`);

    // ✅ 简化: 直接使用 FindNearestAloneEnemyAssassin()
    const nearestAloneEnemy = this.FindNearestAloneEnemyAssassin();

    if (!nearestAloneEnemy) {
      //print(`[AI-Assassin] ${heroName} no suitable target found, deactivating assassin mode`);
      return false;
    }

    //const distanceToEnemy = this.GetDistanceTo(nearestAloneEnemy);
    //print(
    // `[AI-Assassin] ${heroName} targeting ${nearestAloneEnemy.GetUnitName()} at distance ${distanceToEnemy.toFixed(0)}`,
    //);

    // 直接攻击目标
    //print(`[AI-Assassin] ${heroName} engaging target!`);
    this.hero.MoveToTargetToAttack(nearestAloneEnemy);

    return true;
  }

  // 在 BotBaseAIModifier 或 ModeBase 中修改
  public FindNearestAloneEnemyAssassin(): CDOTA_BaseNPC_Hero | undefined {
    const hero = this.GetHero();
    const myLevel = hero.GetLevel();

    // 使用更大的搜索半径(5000单位)来寻找敌人
    const enemies = ActionFind.FindEnemyHeroes(hero, 5000);

    if (enemies.length === 0) {
      return undefined;
    }

    // 按距离排序,从近到远检查
    enemies.sort((a, b) => {
      const distA = ((a.GetAbsOrigin() - hero.GetAbsOrigin()) as Vector).Length2D();
      const distB = ((b.GetAbsOrigin() - hero.GetAbsOrigin()) as Vector).Length2D();
      return distA - distB;
    });

    // ✅ 新增: 检查是否有等级优势足够大的敌人(30级以上)
    for (const enemy of enemies) {
      const enemyHero = enemy as CDOTA_BaseNPC_Hero;
      const enemyLevel = enemyHero.GetLevel();
      const levelDifference = myLevel - enemyLevel;

      // 如果等级差距>=30,直接返回最近的敌人,无视是否落单
      if (levelDifference >= 30) {
        //const distance = ((enemyHero.GetAbsOrigin() - hero.GetAbsOrigin()) as Vector).Length2D();
        //print(
        //  `[AI-Assassin] Found enemy with 30+ level disadvantage: ${enemyHero.GetUnitName()} at distance ${distance.toFixed(0)} (level diff: ${levelDifference})`,
        //);
        return enemyHero;
      }
    }

    // ✅ 新增: 如果没有30级优势,检查是否有足够等级优势可以无视塔的落单敌人
    for (const enemy of enemies) {
      const enemyHero = enemy as CDOTA_BaseNPC_Hero;
      const enemyLevel = enemyHero.GetLevel();
      const levelDifference = myLevel - enemyLevel;

      // 检查敌人周围1200范围内的队友数量
      const enemyAllies = FindUnitsInRadius(
        enemyHero.GetTeamNumber(),
        enemyHero.GetAbsOrigin(),
        undefined,
        1200,
        UnitTargetTeam.FRIENDLY,
        UnitTargetType.HERO,
        UnitTargetFlags.NONE,
        FindOrder.ANY,
        false,
      );

      // 如果敌人落单(周围只有自己,没有队友)
      if (enemyAllies.length <= 1) {
        // ✅ 新增: 根据等级差距判断是否可以无视塔
        const canIgnoreTower = this.CanIgnoreTowerByLevel(hero, enemyHero, levelDifference);

        if (canIgnoreTower) {
          //const distance = ((enemyHero.GetAbsOrigin() - hero.GetAbsOrigin()) as Vector).Length2D();
          //print(
          //  `[AI-Assassin] Found alone enemy ${enemyHero.GetUnitName()} at distance ${distance.toFixed(0)} (level diff: ${levelDifference}, can ignore tower)`,
          //);
          return enemyHero;
        }
      }
    }

    // 所有敌人都不符合条件
    //print(`[AI-Assassin] No suitable target found among ${enemies.length} enemies`);
    return undefined;
  }

  // ✅ 新增: 辅助方法 - 根据等级差距判断是否可以无视塔
  private CanIgnoreTowerByLevel(
    hero: CDOTA_BaseNPC_Hero,
    enemy: CDOTA_BaseNPC_Hero,
    levelDifference: number,
  ): boolean {
    // 等级差距不足10级,不能无视任何塔
    if (levelDifference < 10) {
      return false;
    }

    // 查找敌人附近的塔
    const nearbyTowers = ActionFind.FindEnemyBuildingsInvulnerable(hero, 1800);

    if (nearbyTowers.length === 0) {
      // 没有塔,可以追杀
      return true;
    }

    // 检查每个塔的等级
    for (const tower of nearbyTowers) {
      const towerName = tower.GetUnitName();
      let towerTier = 0;

      if (towerName.includes('tower1')) {
        towerTier = 1;
      } else if (towerName.includes('tower2')) {
        towerTier = 2;
      } else if (towerName.includes('tower3')) {
        towerTier = 3;
      } else if (towerName.includes('tower4') || towerName.includes('fort')) {
        towerTier = 4;
      }

      // 根据等级差距判断是否可以无视这个塔
      const requiredLevelDiff = towerTier * 10;
      if (levelDifference < requiredLevelDiff) {
        // 等级差距不足以无视这个塔
        //print(
        //  `[AI-Assassin] Cannot ignore tower${towerTier} (need ${requiredLevelDiff} level diff, have ${levelDifference})`,
        //);
        return false;
      }
    }

    // 可以无视所有附近的塔
    return true;
  }

  // 计算到目标坐标的距离
  public GetDistanceToPosition(position: Vector): number {
    return ((this.hero.GetAbsOrigin() - position) as Vector).Length2D();
  }

  //冲锋者
  protected ActionVanguard(): boolean {
    //const heroName = this.hero.GetUnitName();
    //print(`[AI-Vanguard] ${heroName} executing vanguard action`);

    // 找到最近的敌方塔
    const nearestTower = this.FindNearestEnemyTowerInvulnerable();

    if (nearestTower) {
      const distanceToTower = this.GetDistanceTo(nearestTower);
      //print(`[AI-Vanguard] ${heroName} found tower at distance ${distanceToTower.toFixed(0)}`);

      const targetPos = nearestTower.GetAbsOrigin();

      // 检查队友是否在附近
      const nearbyAllies = this.FindNearbyAllies(1500);
      //print(`[AI-Vanguard] ${heroName} has ${nearbyAllies.length} allies nearby`);

      if (nearbyAllies.length > 0) {
        // 向塔方向前进,比队友更靠前
        const direction = ((targetPos - this.hero.GetAbsOrigin()) as Vector).Normalized();
        const vanguardPos = (this.hero.GetAbsOrigin() + direction * 300) as Vector;

        //print(`[AI-Vanguard] ${heroName} moving ahead of team towards tower`);
        this.hero.MoveToPosition(vanguardPos);

        // 优先检查并处理附近的敌方英雄
        const nearestEnemyHero = this.FindNearestEnemyHero();

        if (nearestEnemyHero) {
          const distanceToHero = this.GetDistanceTo(nearestEnemyHero);
          const attackRange = 1000;
          //print(
          //  `[AI-Vanguard] ${heroName} found enemy hero ${nearestEnemyHero.GetUnitName()} at distance ${distanceToHero.toFixed(0)}`,
          //);

          // 如果敌方英雄在攻击范围或施法范围内,优先处理英雄
          if (distanceToHero <= attackRange + this.NotAttactTowerHeroAttackRangeBuff) {
            //print(`[AI-Vanguard] ${heroName} enemy in attack range, engaging hero`);
            // 优先对英雄施法
            if (this.CastEnemy()) {
              //print(`[AI-Vanguard] ${heroName} successfully cast ability on enemy hero`);
              return true;
            }
            // 如果施法失败,攻击英雄
            //print(`[AI-Vanguard] ${heroName} attacking enemy hero`);
            ActionAttack.Attack(this.hero, nearestEnemyHero);
            return true;
          }

          // 如果英雄在施法范围内但不在攻击范围内,只施法
          if (distanceToHero <= this.CastRange) {
            //print(`[AI-Vanguard] ${heroName} enemy in cast range, attempting to cast`);
            if (this.CastEnemy()) {
              //print(`[AI-Vanguard] ${heroName} successfully cast ability on enemy hero`);
              return true;
            }
          } else {
            //print(
            //   `[AI-Vanguard] ${heroName} enemy too far for abilities (${distanceToHero.toFixed(0)} > ${this.CastRange})`,
            // );
          }
        } else {
          //print(`[AI-Vanguard] ${heroName} no enemy hero found nearby`);
        }

        // 只有在没有敌方英雄威胁时才攻击塔
        if (distanceToTower < 800) {
          //print(`[AI-Vanguard] ${heroName} attacking tower (no enemy threat)`);
          ActionAttack.Attack(this.hero, nearestTower);
        } else {
          //print(`[AI-Vanguard] ${heroName} tower too far (${distanceToTower.toFixed(0)})`);
        }

        return true;
      } else {
        //print(`[AI-Vanguard] ${heroName} no allies nearby, falling back to normal push`);
      }
    } else {
      //print(`[AI-Vanguard] ${heroName} no tower found, falling back to normal push`);
    }

    // 没有队友时按正常推进
    return this.ActionPush();
  }

  // 查找附近队友
  public FindNearbyAllies(radius: number): CDOTA_BaseNPC[] {
    return ActionFind.FindTeams(this.hero, radius, UnitTargetType.HERO);
  }

  // 查找最近的敌方塔
  public FindNearestEnemyTower(): CDOTA_BaseNPC | undefined {
    const towers = ActionFind.FindEnemyBuildings(this.hero, 1800);
    if (towers.length > 0) {
      return towers[0];
    }
    return undefined;
  }

  // 计算到目标的距离
  public GetDistanceTo(target: CDOTA_BaseNPC): number {
    return HeroUtil.GetDistanceToHero(this.hero, target);
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
    if (this.ConsumeItem()) {
      return true;
    }
    if (SellItem.SellExtraItems(this.hero)) {
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
    return false;
  }

  PickNeutralItem(): boolean {
    const targetTier = NeutralItemManager.GetTargetTier();
    if (targetTier <= this.neutralItemTier) {
      return false;
    }

    const neutralItemConfig = this.getNeutralItemConfig();
    const selectedItem = NeutralItemManager.GetRandomTierItem(targetTier, neutralItemConfig);
    if (!selectedItem) {
      //print(`[AI] HeroBase PickNeutralItem ${this.hero.GetUnitName()} 没有找到中立物品`);
      return false;
    }

    const selectedEnhancement = NeutralItemManager.GetRandomTierEnhancements(
      targetTier,
      neutralItemConfig,
    );
    if (!selectedEnhancement) {
      //print(`[AI] HeroBase PickNeutralItem ${this.hero.GetUnitName()} 没有找到中立增强`);
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

  ConsumeItem(): boolean {
    return false;
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
    //print(`[AI] HeroBase OnCreated delay ${delay}`);
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
