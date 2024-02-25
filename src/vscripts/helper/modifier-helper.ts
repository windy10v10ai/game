export class ModifierHelper {
  static refreshGlobalModifierr(unit: CDOTA_BaseNPC, modifierName: string) {
    unit.RemoveModifierByName(modifierName);
    this.applyGlobalModifier(unit, modifierName);
  }

  static applyGlobalModifier(unit: CDOTA_BaseNPC, modifierName: string) {
    this.applyDataDrivenModifier(unit, "item_global_modifiers", modifierName, {
      duration: -1,
    });
  }

  private static applyDataDrivenModifier(
    unit: CDOTA_BaseNPC,
    dataDrivenItemName: string,
    modifierName: string,
    modifierTable: object | undefined,
  ) {
    const dataDrivenItem = CreateItem(
      dataDrivenItemName,
      undefined,
      undefined,
    ) as CDOTA_Item_DataDriven;
    dataDrivenItem.ApplyDataDrivenModifier(unit, unit, modifierName, modifierTable);
    UTIL_RemoveImmediate(dataDrivenItem);
  }
}
