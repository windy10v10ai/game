export class ActionMove {
  static MoveHero(hero: CDOTA_BaseNPC_Hero, pos: Vector) {
    hero.MoveToPosition(pos);
  }

  static MoveAround(hero: CDOTA_BaseNPC_Hero, pos: Vector, radius: number) {
    const randomPos = pos.__add(RandomVector(radius));
    hero.MoveToPosition(randomPos);
  }
}
