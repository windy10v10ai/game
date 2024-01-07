import { BaseModifier, registerModifier } from "../../utils/dota_ts_adapter";
import { ActionAttack } from "../action/action-attack";
import { ActionFind } from "../action/action-find";
import { ModeEnum } from "../mode/mode-enum";
import { HeroHelper } from "./hero-helper";

@registerModifier()
export class BaseHeroAIModifier extends BaseModifier {
  protected readonly ThinkInterval: number = 0.3;
  protected readonly ThinkIntervalTool: number = 0.3;

  protected readonly FindRadius: number = 1600;
  // 当前状态
  protected mode: ModeEnum = ModeEnum.RUNE;

  // 技能
  protected ability_1: CDOTABaseAbility | undefined;
  protected ability_2: CDOTABaseAbility | undefined;
  protected ability_3: CDOTABaseAbility | undefined;
  protected ability_4: CDOTABaseAbility | undefined;
  protected ability_5: CDOTABaseAbility | undefined;
  protected ability_utli: CDOTABaseAbility | undefined;

  protected hero: CDOTA_BaseNPC_Hero;
  protected heroState = {
    currentHealth: 0,
    maxHealth: 0,
    currentMana: 0,
    maxMana: 0,
    currentLevel: 0,
  };

  protected aroundEnemyHeroes: CDOTA_BaseNPC[] = [];
  protected aroundEnemyCreeps: CDOTA_BaseNPC[] = [];
  protected aroundEnemyBuildings: CDOTA_BaseNPC[] = [];

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
    if (this.NoAction()) {
      return;
    }

    this.FindAround();
    this.ThinkMode();
  }

  FindAround(): void {
    this.aroundEnemyHeroes = ActionFind.FindEnemyHeroes(this.hero, this.FindRadius);
    this.aroundEnemyCreeps = ActionFind.FindEnemyCreeps(this.hero, this.FindRadius);
    this.aroundEnemyBuildings = ActionFind.FindEnemyBuildings(this.hero, this.FindRadius);
  }

  // ---------------------------------------------------------
  // Think Mode
  // ---------------------------------------------------------
  ThinkMode(): void {
    this.mode = GameRules.AI.FSA.GetMode(this.mode, this.hero);
    switch (this.mode) {
      case ModeEnum.RUNE:
        this.ThinkRune();
        break;
      case ModeEnum.ATTACK:
        this.ThinkAttack();
        break;
      default:
        break;
    }
  }

  ThinkRune(): void {
    if (this.aroundEnemyHeroes.length > 0) {
      this.ThinkAttack();
      return;
    }
  }

  ThinkAttack(): void {
    print(`[AI] HeroBase ThinkAttack ${this.hero.GetUnitName()}`);
    if (this.aroundEnemyHeroes.length === 0) {
      return;
    }
    const target = this.aroundEnemyHeroes[0];
    if (!target) {
      return;
    }

    if (this.IsInAbilityPhase()) {
      print(`[AI] HeroBase ThinkAttack 正在施法中 ${this.hero.GetUnitName()}`);
      return;
    }

    // TODO 使用技能

    if (this.IsInAttackPhase()) {
      print(`[AI] HeroBase ThinkAttack 正在攻击中 ${this.hero.GetUnitName()}`);
      return;
    }
    ActionAttack.Attack(this.hero, target);
  }

  ThinkLaning(): void {
    print(`[AI] HeroBase ThinkLaning ${this.hero.GetUnitName()}`);
  }

  ThinkGanking(): void {
    print(`[AI] HeroBase ThinkGanking ${this.hero.GetUnitName()}`);
  }

  ThinkPush(): void {
    print(`[AI] HeroBase ThinkPush ${this.hero.GetUnitName()}`);
  }

  NoAction(): boolean {
    if (HeroHelper.NotActionable(this.hero)) {
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
  // DotaModifierFunctions
  // ---------------------------------------------------------
  // modifier functions
  OnCreated() {
    if (IsClient()) {
      return;
    }

    const delay = RandomFloat(3, 4);
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
