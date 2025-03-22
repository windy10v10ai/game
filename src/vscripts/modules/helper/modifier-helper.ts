export class ModifierHelper {
  private static GLOBAL_APPLY_MODIFIERS_ITEM: CDOTA_Item_DataDriven = CreateItem(
    'item_apply_modifiers',
    undefined,
    undefined,
  ) as CDOTA_Item_DataDriven;

  private static ITEM_GLOBAL_MODIFIERS: CDOTA_Item_DataDriven = CreateItem(
    'item_global_modifiers',
    undefined,
    undefined,
  ) as CDOTA_Item_DataDriven;

  private static ITEM_TOWER_MODIFIER: CDOTA_Item_DataDriven = CreateItem(
    'item_tower_modifiers',
    undefined,
    undefined,
  ) as CDOTA_Item_DataDriven;

  /**
   * 刷新物品的数据驱动修饰器
   * @param item 物品实例
   * @param modifierName 修饰器名称
   */
  static refreshItemDataDrivenModifier(item: CDOTA_Item_Lua, modifierName: string): void {
    const caster = item.GetCaster();
    const itemName = item.GetName();

    Timers.CreateTimer(0.1, () => {
      // 计算持有者拥有的该物品数量
      let itemCount = 0;
      for (let i = 0; i < 6; i++) {
        const itemInSlot = caster.GetItemInSlot(i);
        if (itemInSlot && itemInSlot.GetName() === itemName) {
          itemCount++;
        }
      }

      const modifiers = caster.FindAllModifiersByName(modifierName);
      const modifierCount = modifiers.length;

      if (itemCount > modifierCount) {
        for (let i = 0; i < itemCount - modifierCount; i++) {
          this.GLOBAL_APPLY_MODIFIERS_ITEM.ApplyDataDrivenModifier(
            caster,
            caster,
            modifierName,
            {},
          );
        }
      }

      if (itemCount < modifierCount) {
        // 移除多余的修饰器
        for (let i = 0; i < modifierCount - itemCount; i++) {
          modifiers[i].Destroy();
        }
      }
    });
  }

  /**
   * 应用物品的数据驱动修饰器
   * @param target 目标单位
   * @param modifierName 修饰器名称
   * @param modifierTable 修饰器参数表
   */
  static applyItemDataDrivenModifier(
    target: CDOTA_BaseNPC,
    modifierName: string,
    modifierTable?: object,
  ): void {
    this.GLOBAL_APPLY_MODIFIERS_ITEM.ApplyDataDrivenModifier(
      target,
      target,
      modifierName,
      modifierTable,
    );
  }

  /**
   * 刷新全局修饰器
   * @param unit 目标单位
   * @param modifierName 修饰器名称
   */
  static refreshGlobalModifier(unit: CDOTA_BaseNPC, modifierName: string): void {
    unit.RemoveModifierByName(modifierName);
    this.applyGlobalModifier(unit, modifierName);
  }

  /**
   * 应用全局修饰器
   * @param unit 目标单位
   * @param modifierName 修饰器名称
   */
  static applyGlobalModifier(unit: CDOTA_BaseNPC, modifierName: string): void {
    this.applyDataDrivenModifier(unit, this.ITEM_GLOBAL_MODIFIERS, modifierName, {
      duration: -1,
    });
  }

  /**
   * 应用防御塔修饰器
   * @param unit 目标单位
   * @param modifierName 修饰器名称
   * @param level 修饰器等级
   */
  static applyTowerModifier(unit: CDOTA_BaseNPC, modifierName: string, level?: number): void {
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

  /**
   * 应用数据驱动修饰器
   * @param unit 目标单位
   * @param dataDrivenItem 数据驱动物品
   * @param modifierName 修饰器名称
   * @param modifierTable 修饰器参数表
   * @param level 修饰器等级
   */
  private static applyDataDrivenModifier(
    unit: CDOTA_BaseNPC,
    dataDrivenItem: CDOTA_Item_DataDriven,
    modifierName: string,
    modifierTable?: object,
    level: number = 1,
  ): void {
    dataDrivenItem.SetLevel(level);
    dataDrivenItem.ApplyDataDrivenModifier(unit, unit, modifierName, modifierTable);
  }
}

// 导出function到全局环境，使Lua可以调用
declare global {
  function RefreshItemDataDrivenModifier(item: CDOTA_Item_Lua, modifierName: string): void;
  function ApplyItemDataDrivenModifier(
    target: CDOTA_BaseNPC,
    modifierName: string,
    modifierTable?: object,
  ): void;
}

_G.RefreshItemDataDrivenModifier = (item: CDOTA_Item_Lua, modifierName: string) => {
  ModifierHelper.refreshItemDataDrivenModifier(item, modifierName);
};

_G.ApplyItemDataDrivenModifier = (
  target: CDOTA_BaseNPC,
  modifierName: string,
  modifierTable?: object,
) => ModifierHelper.applyItemDataDrivenModifier(target, modifierName, modifierTable);
