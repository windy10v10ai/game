export class ActionFind {
  static FindEnemyHeroes(self: CDOTA_BaseNPC_Hero, radius: number): CDOTA_BaseNPC[] {
    const enemies = this.FindEnemies(self, radius, UnitTargetType.HERO);

    return enemies;
  }

  static FindEnemyCreeps(self: CDOTA_BaseNPC_Hero, radius: number): CDOTA_BaseNPC[] {
    const enemies = this.FindEnemies(self, radius, UnitTargetType.BASIC);

    return enemies;
  }

  static FindEnemyBuildings(self: CDOTA_BaseNPC_Hero, radius: number): CDOTA_BaseNPC[] {
    const enemies = this.FindEnemies(self, radius, UnitTargetType.BUILDING);

    return enemies;
  }

  static FindEnemies(
    self: CDOTA_BaseNPC_Hero,
    radius: number,
    typeFilter: UnitTargetType,
  ): CDOTA_BaseNPC[] {
    const enemies = FindUnitsInRadius(
      self.GetTeamNumber(),
      self.GetAbsOrigin(),
      undefined,
      radius,
      UnitTargetTeam.ENEMY,
      typeFilter,
      UnitTargetFlags.FOW_VISIBLE + UnitTargetFlags.NO_INVIS,
      FindOrder.CLOSEST,
      false,
    );

    return enemies;
  }
}
