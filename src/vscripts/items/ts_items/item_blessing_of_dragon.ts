import { modifier_ignore_invulnerable_kill } from '../../modifiers/global/modifier_ignore_invulnerable_kill';
import { BaseItem, registerAbility } from '../../utils/dota_ts_adapter';

const EXCLUDED_UNIT_NAMES = new Set([
  'npc_dota_roshan',
  'npc_dota_courier',
  'npc_dota_flying_courier',
  'npc_dota_miniboss',
]);

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
      if (target.IsAlive() && !EXCLUDED_UNIT_NAMES.has(target.GetUnitName())) {
        if (target.IsHero()) {
          target.AddNewModifier(caster, this, modifier_ignore_invulnerable_kill.name, {});
          target.Kill(this, caster);
          target.RemoveModifierByName(modifier_ignore_invulnerable_kill.name);
        } else {
          target.Kill(this, caster);
        }
      }
    }

    this.SpendCharge(1);
  }
}
