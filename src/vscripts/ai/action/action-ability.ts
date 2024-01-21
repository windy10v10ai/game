export class ActionAbility {
  static CastAbilityOnEnemy(
    self: CDOTA_BaseNPC_Hero,
    ability: CDOTABaseAbility,
    target: CDOTA_BaseNPC,
  ) {
    if (!ability.IsFullyCastable()) {
      return;
    }

    // if ability is point target
    if (this.IsAbilityBehavior(ability, AbilityBehavior.POINT)) {
      print(`cast ability ${ability.GetAbilityName()} on point`);
      self.CastAbilityOnTarget(target, ability, self.GetPlayerOwnerID());
    } else if (this.IsAbilityBehavior(ability, AbilityBehavior.AOE)) {
      print(`cast ability ${ability.GetAbilityName()} on aoe`);
      self.CastAbilityOnPosition(target.GetAbsOrigin(), ability, self.GetPlayerOwnerID());
    }
  }

  /**
   * @return 施法距离 + 施法距离加成
   */
  public static GetFullCastRange(self: CDOTA_BaseNPC_Hero, ability: CDOTABaseAbility): number {
    const range = ability.GetCastRange(self.GetAbsOrigin(), undefined);
    const castRangeIncrease = self.GetCastRangeBonus();
    return range + castRangeIncrease;
  }

  private static IsAbilityBehavior(ability: CDOTABaseAbility, behavior: AbilityBehavior): boolean {
    const abilityBehavior = ability.GetBehavior() as Uint64;
    const isBitSet = abilityBehavior.IsBitSet(behavior);
    return !!isBitSet;
  }
}
