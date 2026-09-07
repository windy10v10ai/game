import { registerModifier } from '../../utils/dota_ts_adapter';
import { GetFullCastRange } from '../ability/ability-cast';
import { ActionFind } from '../action/action-find';
import { BotBaseAIModifier } from './bot-base';
import { HeroUtil } from './hero-util';

/** 修补匠专属 AI：跳刀切入与脱离、传送回泉水与归队，落点都要先算出来，AbilitySpec 表达不了。 */

// 升级链上任意一件都能用，按拥有情况取第一件
const BLINK_ITEM_NAMES = [
  'item_blink',
  'item_arcane_blink',
  'item_overwhelming_blink',
  'item_swift_blink',
  'item_arcane_blink_2',
];
// 落点与敌人的距离取常见主动装备的施法距离，跳完即可直接接装备
const BLINK_LANDING_RANGE = 900;
const BLINK_ENEMY_SEARCH_RADIUS = 3500;
// 己方英雄的搜索半径在落点距离之外再放宽一点，避免刚好卡在边界上不跳
const BLINK_ALLY_SEARCH_EXTRA = 300;
const BLINK_LANDING_DEGREE = 45;
const BLINK_MIN_MANA_PERCENT = 20;
const BLINK_MIN_HEALTH_PERCENT = 50;

const TELEPORT_FOUNTAIN_MANA = 300;
const TELEPORT_FOUNTAIN_MANA_PERCENT = 10;
const TELEPORT_ALLY_MIN_LEVEL = 18;
const TELEPORT_ALLY_MIN_MANA_PERCENT = 80;
const TELEPORT_ALLY_MIN_HEALTH_PERCENT = 80;
// 这个半径内除自己外没有别人才算落单
const TELEPORT_ALONE_RADIUS = 5000;
// 队友可能在地图任意角落，取一个覆盖全图的半径
const TELEPORT_ALLY_SEARCH_RADIUS = 20000;
const TELEPORT_ALLY_TARGET_HEALTH_PERCENT = 90;

@registerModifier('ai/hero/hero-tinker')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class tinker_ai_modifier extends BotBaseAIModifier {
  override ActionAttack(): boolean {
    if (this.TryBlinkInitiate()) {
      return true;
    }
    if (this.TryTeleport()) {
      return true;
    }
    return super.ActionAttack();
  }

  override ActionPush(): boolean {
    if (this.TryBlinkInitiate()) {
      return true;
    }
    if (this.TryTeleport()) {
      return true;
    }
    return super.ActionPush();
  }

  override ActionRetreat(): boolean {
    if (this.TryBlinkEscape()) {
      return true;
    }
    return super.ActionRetreat();
  }

  override ActionLaning(): boolean {
    if (this.TryBlinkInitiate()) {
      return true;
    }
    if (this.TryTeleport()) {
      return true;
    }
    return super.ActionLaning();
  }

  /**
   * 跳到最近敌方英雄的己方一侧，落点距其一个主动装备施法距离。
   */
  private TryBlinkInitiate(): boolean {
    const hero = this.GetHero();
    if (hero.IsMuted()) {
      return false;
    }
    if (
      hero.GetManaPercent() <= BLINK_MIN_MANA_PERCENT ||
      hero.GetHealthPercent() <= BLINK_MIN_HEALTH_PERCENT
    ) {
      return false;
    }

    const blink = this.FindBlinkItem(hero);
    if (!blink || !blink.IsFullyCastable()) {
      return false;
    }

    const landingDistance = BLINK_LANDING_RANGE + hero.GetCastRangeBonus();

    const enemy = ActionFind.FindEnemyHeroes(hero, BLINK_ENEMY_SEARCH_RADIUS)[0];
    if (!enemy) {
      return false;
    }

    const enemyPosition = enemy.GetAbsOrigin();
    const ally = this.FindNearestAllyNear(
      hero,
      enemyPosition,
      landingDistance + BLINK_ALLY_SEARCH_EXTRA,
    );
    // 连自己都够不到说明这一跳是孤军深入
    if (!ally) {
      return false;
    }

    const towardAlly = ally.GetAbsOrigin().__sub(enemyPosition);
    const distance = towardAlly.Length2D();
    if (distance < 1) {
      return false;
    }
    const landing = enemyPosition.__add(towardAlly.__mul(landingDistance / distance));
    const rotated = RotatePosition(
      enemyPosition,
      QAngle(0, RandomInt(-BLINK_LANDING_DEGREE, BLINK_LANDING_DEGREE), 0),
      landing,
    );

    hero.CastAbilityOnPosition(rotated, blink, hero.GetPlayerOwnerID());
    return true;
  }

  /**
   * 撤退时朝最近敌人的反方向跳，只负责瞬间脱离，回家的走位交给后续撤退逻辑。
   */
  private TryBlinkEscape(): boolean {
    const hero = this.GetHero();
    if (hero.IsMuted()) {
      return false;
    }

    const blink = this.FindBlinkItem(hero);
    if (!blink || !blink.IsFullyCastable()) {
      return false;
    }

    // 敌人在跳刀距离之外时威胁已经脱开，不必交
    const escapeDistance = GetFullCastRange(hero, blink);
    const enemy = ActionFind.FindEnemyHeroes(hero, escapeDistance)[0];
    if (!enemy) {
      return false;
    }

    const heroPosition = hero.GetAbsOrigin();
    const awayFromEnemy = heroPosition.__sub(enemy.GetAbsOrigin());
    const distance = awayFromEnemy.Length2D();
    if (distance < 1) {
      return false;
    }
    const landing = heroPosition.__add(awayFromEnemy.__mul(escapeDistance / distance));

    hero.CastAbilityOnPosition(landing, blink, hero.GetPlayerOwnerID());
    return true;
  }

  /**
   * 优先用热机传送：撤退无追兵或低蓝时回泉水，落单且状态健康时传送到最近的队友身边。
   * 热机传送在冷却时回退到通用 TP 卷轴逻辑。
   *
   * 与队伍的 TP 卷轴回线是两套机制：那边按所处位置判断、目标是己方塔。
   */
  protected override TryTeleport(): boolean {
    const hero = this.GetHero();
    const teleport = hero.FindAbilityByName('tinker_keen_teleport');
    if (!teleport || !teleport.IsFullyCastable()) {
      return super.TryTeleport();
    }

    if (this.ShouldRetreatTeleportToFountain() || this.NeedsFountainSupply(hero)) {
      const fountain = HeroUtil.GetTeamFountainPosition(hero.GetTeamNumber());
      if (!fountain) {
        return false;
      }
      // 引导会被控制打断，先跳开一段再传；跳刀冷却随后会被热机重置刷掉
      if (this.TryBlinkToward(hero, fountain)) {
        return true;
      }
      hero.CastAbilityOnPosition(fountain, teleport, hero.GetPlayerOwnerID());
      return true;
    }

    return this.TryTeleportToAlly(hero, teleport);
  }

  private NeedsFountainSupply(hero: CDOTA_BaseNPC_Hero): boolean {
    return (
      hero.GetMana() < TELEPORT_FOUNTAIN_MANA ||
      hero.GetManaPercent() < TELEPORT_FOUNTAIN_MANA_PERCENT
    );
  }

  /**
   * 朝目标点跳一次跳刀，跳完本轮结束，下一轮才继续传送。
   *
   * 落点直接给目的地，超出跳刀距离时引擎按最大距离释放。
   */
  private TryBlinkToward(hero: CDOTA_BaseNPC_Hero, destination: Vector): boolean {
    if (hero.IsMuted()) {
      return false;
    }

    const blink = this.FindBlinkItem(hero);
    if (!blink || !blink.IsFullyCastable()) {
      return false;
    }

    hero.CastAbilityOnPosition(destination, blink, hero.GetPlayerOwnerID());
    return true;
  }

  private TryTeleportToAlly(hero: CDOTA_BaseNPC_Hero, teleport: CDOTABaseAbility): boolean {
    if (hero.GetLevel() < TELEPORT_ALLY_MIN_LEVEL) {
      return false;
    }
    if (
      hero.GetManaPercent() <= TELEPORT_ALLY_MIN_MANA_PERCENT ||
      hero.GetHealthPercent() <= TELEPORT_ALLY_MIN_HEALTH_PERCENT
    ) {
      return false;
    }
    if (ActionFind.FindFriendlyHeroes(hero, TELEPORT_ALONE_RADIUS).length > 1) {
      return false;
    }

    const ally = this.FindNearestTeammate(hero);
    // 归队是为了跟上队友的节奏，残血的队友多半正在被追
    if (!ally || ally.GetHealthPercent() <= TELEPORT_ALLY_TARGET_HEALTH_PERCENT) {
      return false;
    }

    hero.CastAbilityOnPosition(ally.GetAbsOrigin(), teleport, hero.GetPlayerOwnerID());
    return true;
  }

  private FindBlinkItem(hero: CDOTA_BaseNPC_Hero): CDOTA_Item | undefined {
    for (const itemName of BLINK_ITEM_NAMES) {
      const item = hero.FindItemInInventory(itemName);
      if (item) {
        return item;
      }
    }
    return undefined;
  }

  private FindNearestAllyNear(
    hero: CDOTA_BaseNPC_Hero,
    center: Vector,
    radius: number,
  ): CDOTA_BaseNPC | undefined {
    const allies = FindUnitsInRadius(
      hero.GetTeamNumber(),
      center,
      undefined,
      radius,
      UnitTargetTeam.FRIENDLY,
      UnitTargetType.HERO,
      UnitTargetFlags.NOT_ILLUSIONS,
      FindOrder.CLOSEST,
      false,
    );
    return allies[0];
  }

  private FindNearestTeammate(hero: CDOTA_BaseNPC_Hero): CDOTA_BaseNPC | undefined {
    const allies = ActionFind.FindFriendlyHeroes(hero, TELEPORT_ALLY_SEARCH_RADIUS);
    for (const ally of allies) {
      if (ally.GetEntityIndex() !== hero.GetEntityIndex()) {
        return ally;
      }
    }
    return undefined;
  }
}
