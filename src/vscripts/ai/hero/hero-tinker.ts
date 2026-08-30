import { registerModifier } from '../../utils/dota_ts_adapter';
import { GetFullCastRange } from '../ability/ability-cast';
import { ActionFind } from '../action/action-find';
import { BotBaseAIModifier } from './bot-base';

/** 修补匠专属 AI：跳刀切入与低蓝传送回泉水，两者都要先算落点，AbilitySpec 表达不了。 */

// 升级链上任意一件都能用，按拥有情况取第一件
const BLINK_ITEM_NAMES = [
  'item_blink',
  'item_arcane_blink',
  'item_overwhelming_blink',
  'item_swift_blink',
  'item_arcane_blink_2',
];
const BLINK_ENEMY_SEARCH_RADIUS = 3500;
// 己方英雄的搜索半径在落点距离之外再放宽一点，避免刚好卡在边界上不跳
const BLINK_ALLY_SEARCH_EXTRA = 300;
const BLINK_LANDING_DEGREE = 45;
const BLINK_MIN_MANA_PERCENT = 20;
const BLINK_MIN_HEALTH_PERCENT = 50;

const TELEPORT_MANA = 300;
const TELEPORT_MANA_PERCENT = 10;

@registerModifier('ai/hero/hero-tinker')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class tinker_ai_modifier extends BotBaseAIModifier {
  // 泉水位置全局固定，首次查到后不再变化
  private fountainPosition: Vector | undefined;

  override ActionAttack(): boolean {
    if (this.TryBlinkInitiate()) {
      return true;
    }
    return super.ActionAttack();
  }

  override ActionPush(): boolean {
    if (this.TryBlinkInitiate()) {
      return true;
    }
    return super.ActionPush();
  }

  override ActionRetreat(): boolean {
    if (this.TryTeleportToFountain()) {
      return true;
    }
    return super.ActionRetreat();
  }

  override ActionLaning(): boolean {
    if (this.TryTeleportToFountain()) {
      return true;
    }
    return super.ActionLaning();
  }

  /**
   * 跳到最近敌方英雄的己方一侧，落点距其一个激光施法距离。
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

    const laser = hero.FindAbilityByName('tinker_laser');
    if (!laser) {
      return false;
    }
    // 落点与敌人保持激光施法距离，跳完立刻能接技能
    const landingDistance = GetFullCastRange(hero, laser);

    const enemy = ActionFind.FindEnemyHeroes(hero, BLINK_ENEMY_SEARCH_RADIUS)[0];
    if (!enemy) {
      return false;
    }

    const enemyPosition = enemy.GetAbsOrigin();
    const ally = this.FindNearestAlly(
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
   * 低蓝时传送回泉水补给。
   */
  private TryTeleportToFountain(): boolean {
    const hero = this.GetHero();
    if (hero.GetMana() >= TELEPORT_MANA && hero.GetManaPercent() >= TELEPORT_MANA_PERCENT) {
      return false;
    }

    const teleport = hero.FindAbilityByName('tinker_keen_teleport');
    if (!teleport || !teleport.IsFullyCastable()) {
      return false;
    }

    const fountain = this.GetFountainPosition(hero);
    if (!fountain) {
      return false;
    }

    hero.CastAbilityOnPosition(fountain, teleport, hero.GetPlayerOwnerID());
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

  private FindNearestAlly(
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

  private GetFountainPosition(hero: CDOTA_BaseNPC_Hero): Vector | undefined {
    if (this.fountainPosition) {
      return this.fountainPosition;
    }
    const fountains = Entities.FindAllByClassname('ent_dota_fountain') as CDOTA_BaseNPC[];
    for (const fountain of fountains) {
      if (!fountain.IsNull() && fountain.GetTeamNumber() === hero.GetTeamNumber()) {
        this.fountainPosition = fountain.GetAbsOrigin();
        return this.fountainPosition;
      }
    }
    return undefined;
  }
}
