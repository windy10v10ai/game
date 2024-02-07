import { BaseModifier, registerModifier } from "../../utils/dota_ts_adapter";
import { ActionAttack } from "../action/action-attack";
import { ActionFind } from "../action/action-find";
import { ActionItem } from "../action/action-item";
import { ActionMove } from "../action/action-move";
import { ModeEnum } from "../mode/mode-enum";
import { HeroUtil } from "./hero-util";

@registerModifier()
export class BaseHeroAIModifier extends BaseModifier {
  protected readonly ThinkInterval: number = 0.3;
  protected readonly ThinkIntervalTool: number = 0.3;

  // 持续动作结束时间
  protected readonly continueActionTime: number = 8;
  protected continueActionEndTime: number = 0;

  protected readonly FindRadius: number = 1600;
  protected readonly PushNoAttactTowerHeroDistanceBuff: number = 300;
  protected readonly CastRange: number = 600;

  public readonly PushLevel: number = 10;

  protected hero: CDOTA_BaseNPC_Hero;
  public GetHero(): CDOTA_BaseNPC_Hero {
    return this.hero;
  }

  // 当前状态
  public gameTime: number = 0;
  public mode: ModeEnum = ModeEnum.RUNE;

  // 技能
  protected ability_1: CDOTABaseAbility | undefined;
  protected ability_2: CDOTABaseAbility | undefined;
  protected ability_3: CDOTABaseAbility | undefined;
  protected ability_4: CDOTABaseAbility | undefined;
  protected ability_5: CDOTABaseAbility | undefined;
  protected ability_utli: CDOTABaseAbility | undefined;

  // 物品

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
    print(`[AI] HeroBase OnCreated ${this.hero.GetUnitName()}`);
    // 初始化技能
    this.ability_1 = this.hero.GetAbilityByIndex(0);
    this.ability_2 = this.hero.GetAbilityByIndex(1);
    this.ability_3 = this.hero.GetAbilityByIndex(2);
    this.ability_4 = this.hero.GetAbilityByIndex(3);
    this.ability_5 = this.hero.GetAbilityByIndex(4);
    this.ability_utli = this.hero.GetAbilityByIndex(5);

    // 初始化Think
    if (IsInToolsMode()) {
      this.StartIntervalThink(this.ThinkIntervalTool);
    } else {
      this.StartIntervalThink(this.ThinkInterval);
    }
  }

  Think(): void {
    this.hero = this.GetParent() as CDOTA_BaseNPC_Hero;
    this.gameTime = GameRules.GetDOTATime(false, false);
    if (this.StopAction()) {
      return;
    }

    this.FindAround();
    this.ThinkMode();
    if (this.gameTime < this.continueActionEndTime) {
      print(`[AI] HeroBase Think break 持续动作中 ${this.hero.GetUnitName()}`);
      return;
    }
    this.ActionMode();
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
    return false;
  }

  /**
   * 因敌人而进行的施法
   */
  CastEnemy(): boolean {
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
    return false;
  }

  // ---------------------------------------------------------
  // Item usage
  // ---------------------------------------------------------
  UseItemSelf(): boolean {
    const creep = this.FindNearestEnemyCreep();
    if (
      ActionItem.UseItemOnTarget(this.hero, "item_hand_of_group", creep, (target) => {
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
  // Think Mode
  // ---------------------------------------------------------
  ThinkMode(): void {
    if (this.IsInAbilityPhase()) {
      // print(`[AI] HeroBase Think break 正在施法中 ${this.hero.GetUnitName()}`);
      return;
    }

    if (this.IsInAttackPhase()) {
      // print(`[AI] HeroBase Think break 正在攻击中 ${this.hero.GetUnitName()}`);
      return;
    }

    this.mode = GameRules.AI.FSA.GetMode(this);
  }

  ActionMode(): void {
    switch (this.mode) {
      case ModeEnum.RUNE:
        this.ActionRune();
        break;
      case ModeEnum.ATTACK:
        this.ActionAttack();
        break;
      case ModeEnum.LANING:
        this.ActionLaning();
        break;
      case ModeEnum.PUSH:
        this.ActionPush();
        break;
      case ModeEnum.RETREAT:
        this.ActionRetreat();
        break;
      default:
        print(`[AI] HeroBase ThinkMode ${this.hero.GetUnitName()} mode ${this.mode} not found`);
        break;
    }
  }

  ActionRune(): void {
    // 出高低就 返回基地
    const teamBuildings = ActionFind.FindTeamBuildingsInvulnerable(this.hero, 800);
    for (const building of teamBuildings) {
      const buildingName = building.GetUnitName();
      if (
        buildingName.includes("tower1") ||
        buildingName.includes("tower2") ||
        buildingName.includes("tower3")
      ) {
        print(`[AI] HeroBase ThinkRune ${this.hero.GetUnitName()} 返回基地`);
        const item = this.hero.FindItemInInventory("item_tpscroll");
        if (item) {
          item.EndCooldown();
        }
        ActionItem.UseItemOnPosition(this.hero, "item_tpscroll", Vector(6671, 5951, 384));
      }
    }
  }

  ActionLaning(): void {
    if (this.CastSelf()) {
      return;
    }
    if (this.CastEnemy()) {
      return;
    }
    if (this.CastTeam()) {
      return;
    }
    // TODO 对线期攻击小兵，技能清兵，根据英雄继承后实装
  }

  ActionAttack(): void {
    if (this.CastSelf()) {
      return;
    }
    if (this.CastEnemy()) {
      return;
    }
    if (this.CastTeam()) {
      return;
    }
    if (this.CastCreep()) {
      return;
    }
  }

  ActionRetreat(): void {
    // 撤离动作持续
    this.continueActionEndTime = this.gameTime + this.continueActionTime;
    this.ThinkRetreatGetAwayFromTower();
  }

  ThinkRetreatGetAwayFromTower(): void {
    const enemyTower = this.FindNearestEnemyTowerInvulnerable();
    if (!enemyTower) {
      // end
      this.continueActionEndTime = this.gameTime;
      return;
    }
    if (ActionMove.GetAwayFromTower(this.hero, enemyTower)) {
      print(`[AI] HeroBase ThinkRetreatGetAwayFromTower ${this.hero.GetUnitName()} 撤退`);
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

  ActionPush(): void {
    if (this.CastSelf()) {
      return;
    }
    if (this.CastEnemy()) {
      return;
    }
    if (this.CastTeam()) {
      return;
    }
    // 推塔
    if (this.ForceAttackTower()) {
      return;
    }
    if (this.CastCreep()) {
      return;
    }
  }

  // 强制A塔
  ForceAttackTower(): boolean {
    const enemyBuild = this.FindNearestEnemyBuildings();
    if (!enemyBuild) {
      return false;
    }
    if (enemyBuild.HasModifier("modifier_backdoor_protection_active")) {
      // print(`[AI] HeroBase ThinkPush ${this.hero.GetUnitName()} 偷塔保护，不攻击`);
      return false;
    }

    const enemyHero = this.FindNearestEnemyHero();
    if (enemyHero) {
      // if hero in attack range
      const distanceToAttackHero = HeroUtil.GetDistanceToAttackRange(this.hero, enemyHero);
      if (distanceToAttackHero <= this.PushNoAttactTowerHeroDistanceBuff) {
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

  ThinkPushKillCreep(): void {
    // TODO 攻击小兵，技能清兵，根据英雄继承后实装
    // const enemyCreep = this.FindNearestEnemyCreep();
    // if (enemyCreep) {
    //   if (ActionAttack.Attack(this.hero, enemyCreep)) {
    //     print(`[AI] HeroBase ThinkPush ${this.hero.GetUnitName()} 攻击小兵`);
    //     return;
    //   }
    // }
  }

  StopAction(): boolean {
    if (HeroUtil.NotActionable(this.hero)) {
      return true;
    }

    return false;
  }

  // ---------------------------------------------------------
  // Check
  // ---------------------------------------------------------
  IsInAbilityPhase(): boolean {
    if (this.hero.IsChanneling()) {
      return true;
    }

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
    this.aroundEnemyHeroes = ActionFind.FindEnemyHeroes(this.hero, this.FindRadius);
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
        building.GetUnitName().includes("tower") ||
        building.GetUnitName().includes("rax") ||
        building.GetUnitName().includes("fort")
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
      if (building.GetUnitName().includes("tower") || building.GetUnitName().includes("fort")) {
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

  OnIntervalThink(): void {
    this.Think();
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
