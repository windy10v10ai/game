import {
  BaseItem,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

const WORLD_DESTRUCTION_MODIFIER = 'modifier_item_blessing_of_dragon_world_destruction';

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
        target.AddNewModifier(caster, this, WORLD_DESTRUCTION_MODIFIER, {});
        target.Kill(this, caster);
        target.RemoveModifierByName(WORLD_DESTRUCTION_MODIFIER);
      }
    }

    this.SpendCharge(1);
  }
}

@registerModifier('items/ts_items/item_blessing_of_dragon', WORLD_DESTRUCTION_MODIFIER)
export class ModifierItemBlessingOfDragonWorldDestruction extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  IsPurgeException(): boolean {
    return false;
  }

  GetAttributes(): ModifierAttribute {
    return ModifierAttribute.IGNORE_INVULNERABLE;
  }
}
