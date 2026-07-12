import { BaseItem, registerAbility } from '../../utils/dota_ts_adapter';

@registerAbility('item_blessing_of_dragon_2')
export class ItemBlessingOfDragonDestruction extends BaseItem {
  OnSpellStart(): void {
    const caster = this.GetCaster();
    if (!caster) return;

    const targets = FindUnitsInRadius(
      caster.GetTeamNumber(),
      caster.GetAbsOrigin(),
      undefined,
      FIND_UNITS_EVERYWHERE,
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO + UnitTargetType.BASIC,
      UnitTargetFlags.MAGIC_IMMUNE_ENEMIES +
        UnitTargetFlags.INVULNERABLE +
        UnitTargetFlags.OUT_OF_WORLD,
      FindOrder.ANY,
      false,
    );

    for (const target of targets) {
      if (target.IsAlive()) {
        target.Kill(this, caster);
      }
    }

    this.SpendCharge(1);
  }
}
