export class HeroHelper {
  static stunModifiers = [
    "modifier_axe_berserkers_call", // 战吼
    "modifier_legion_commander_duel", // 决斗
    "modifier_winter_wyvern_winters_curse", // 冰龙大
    "modifier_teleporting", // TP
  ];

  static NotActionable(hero: CDOTA_BaseNPC): boolean {
    // 死亡
    if (hero.IsAlive() === false) {
      return true;
    }
    // 眩晕
    if (hero.IsStunned()) {
      return true;
    }
    // 变羊
    if (hero.IsHexed()) {
      return true;
    }
    // 噩梦
    if (hero.IsNightmared()) {
      return true;
    }
    // 虚空大
    if (hero.IsFrozen()) {
      return true;
    }
    // FIXME 禁用物品
    if (hero.IsMuted()) {
      return true;
    }
    // is hero has stun modifier
    for (const modifier of this.stunModifiers) {
      if (hero.HasModifier(modifier)) {
        return true;
      }
    }

    return false;
  }
}
