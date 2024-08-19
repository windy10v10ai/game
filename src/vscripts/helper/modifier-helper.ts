export class ModifierHelper {
  static ITEM_GLOBAL_MODIFIERS: CDOTA_Item_DataDriven = CreateItem(
    "item_global_modifiers",
    undefined,
    undefined,
  ) as CDOTA_Item_DataDriven;

  static ITEM_TOWER_MODIFIER: CDOTA_Item_DataDriven = CreateItem(
    "item_tower_modifiers",
    undefined,
    undefined,
  ) as CDOTA_Item_DataDriven;

  static refreshGlobalModifierr(unit: CDOTA_BaseNPC, modifierName: string) {
    unit.RemoveModifierByName(modifierName);
    this.applyGlobalModifier(unit, modifierName);
  }

  static applyGlobalModifier(unit: CDOTA_BaseNPC, modifierName: string, level?: number) {
    this.applyDataDrivenModifier(
      unit,
      this.ITEM_GLOBAL_MODIFIERS,
      modifierName,
      {
        duration: -1,
      },
      level,
    );
  }

  static appleTowerModifier(unit: CDOTA_BaseNPC, modifierName: string, level?: number) {
    this.applyDataDrivenModifier(
      unit,
      this.ITEM_TOWER_MODIFIER,
      modifierName,
      {
        duration: -1,
      },
      level,
    );
  }

  private static applyDataDrivenModifier(
    unit: CDOTA_BaseNPC,
    dataDrivenItem: CDOTA_Item_DataDriven,
    modifierName: string,
    modifierTable: object | undefined,
    level: number = 1,
  ) {
    dataDrivenItem.SetLevel(level);
    dataDrivenItem.ApplyDataDrivenModifier(unit, unit, modifierName, modifierTable);
  }
}
