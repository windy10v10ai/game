import { BaseModifier, registerModifier } from "../../utils/dota_ts_adapter";
import { ActionAttack } from "../action/action-attack";
import { ActionFind } from "../action/action-find";
import { ActionMove } from "../action/action-move";
import { ModeEnum } from "../mode/mode-enum";
import { HeroUtil } from "./hero-util";

@registerModifier()
export class BaseHeroAIModifier extends BaseModifier {
  protected readonly ThinkInterval: number = 0.3;
  protected readonly ThinkIntervalTool: number = 0.3;

  protected readonly FindRadius: number = 1600;

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
    if (this.NoAction()) {
      return;
    }

    this.FindAround();
    this.ThinkMode();
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
    switch (this.mode) {
      case ModeEnum.RUNE:
        this.ThinkRune();
        break;
      case ModeEnum.ATTACK:
        this.ThinkAttack();
        break;
      case ModeEnum.LANING:
        this.ThinkLaning();
        break;
      case ModeEnum.GANKING:
        this.ThinkGanking();
        break;
      case ModeEnum.PUSH:
        this.ThinkPush();
        break;
      case ModeEnum.RETREAT:
        this.ThinkRetreat();
        break;
      default:
        print(`[AI] HeroBase ThinkMode ${this.hero.GetUnitName()} mode ${this.mode} not found`);
        break;
    }
  }

  ThinkRune(): void {
    // DO Nothing
  }

  ThinkLaning(): void {
    // TODO
  }

  ThinkAttack(): void {
    const target = this.FindNearestEnemyHero();
    if (!target) {
      return;
    }

    // TODO 使用技能

    // 攻击
    ActionAttack.Attack(this.hero, target);
  }

  ThinkRetreat(): void {
    const enemyTower = this.FindNearestEnemyTowerInvulnerable();
    if (enemyTower) {
      print(`[AI] HeroBase ThinkRetreat ${this.hero.GetUnitName()} 撤退`);
      const direction = HeroUtil.GetDirectionAwayFromEnemies(this.hero, enemyTower);
      ActionMove.MoveHeroToDirection(this.hero, direction, 100);
      return;
    }
  }

  ThinkGanking(): void {
    // TODO
  }

  ThinkPush(): void {
    const enemyHero = this.FindNearestEnemyHero();
    const enemyBuild = this.FindNearestEnemyBuildings();
    if (enemyBuild) {
      // TODO 偷塔保护时 不A塔
      if (enemyBuild.HasModifier("backdoor_protection")) {
        print(`[AI] HeroBase ThinkPush ${this.hero.GetUnitName()} 塔有保护，不攻击`);
        return;
      }
      const distanceToBuild = HeroUtil.GetDistanceToAttackRange(this.hero, enemyBuild);
      if (enemyHero) {
        const distanceToHero = HeroUtil.GetDistanceToAttackRange(this.hero, enemyHero);
        if (distanceToHero < distanceToBuild) {
          // 敌人更近，优先攻击英雄
          return;
        }
      }
      if (ActionAttack.Attack(this.hero, enemyBuild)) {
        print(`[AI] HeroBase ThinkPush ${this.hero.GetUnitName()} 攻击建筑`);
        return;
      }
    }
  }

  NoAction(): boolean {
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
  // Find
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
