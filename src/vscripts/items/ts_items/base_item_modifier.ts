import { BaseModifier } from '../../utils/dota_ts_adapter';

export abstract class BaseItemModifier extends BaseModifier {
  /**
   * 使用DataDriven实现的modifier名称，用以缓解lua属性的卡顿问题。
   *
   * 如果不需要使用DataDriven实现，填''
   *
   * 如果override了`OnCreated/OnRefresh/OnDestroy`，
   * 切记要手动调用`super.OnCreated()/super.OnRefresh()/super.OnDestroy()`
   */
  protected abstract statsModifierName: string;

  /**
   * 复用的原版 modifier 名，随物品得失挂摘，物品自己的 KV 字段即是它们的数值来源。
   *
   * 句柄由基类保存、销毁时逐个 `Destroy()`：`RemoveModifierByName` 会连同其他物品实例
   * 挂的同名 modifier 一起删掉，多件叠加时表现为静默丢属性。
   */
  protected vanillaModifierNames: string[] = [];

  private vanillaModifiers: CDOTA_Buff[] = [];

  protected RefreshStatsModifier(): void {
    if (this.statsModifierName && this.statsModifierName.trim() !== '') {
      const item = this.GetAbility() as CDOTA_Item_Lua;
      RefreshItemDataDrivenModifier(item, this.statsModifierName);
    }
  }

  OnCreated(): void {
    if (IsServer()) {
      this.RefreshStatsModifier();
      this.AddVanillaModifiers();
    }
  }

  OnRefresh(): void {
    if (IsServer()) {
      this.RefreshStatsModifier();
    }
  }

  OnDestroy(): void {
    if (IsServer()) {
      this.RefreshStatsModifier();
      this.RemoveVanillaModifiers();
    }
  }

  private AddVanillaModifiers(): void {
    const ability = this.GetAbility();
    if (!ability) {
      return;
    }

    const parent = this.GetParent();
    for (const modifierName of this.vanillaModifierNames) {
      // 引擎可能返回 nil，类型声明没有体现
      const modifier = parent.AddNewModifier(parent, ability, modifierName, {}) as
        | CDOTA_Buff
        | undefined;
      if (modifier !== undefined) {
        this.vanillaModifiers.push(modifier);
      }
    }
  }

  private RemoveVanillaModifiers(): void {
    for (const modifier of this.vanillaModifiers) {
      if (!modifier.IsNull()) {
        modifier.Destroy();
      }
    }
    this.vanillaModifiers = [];
  }

  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  IsPurgeException(): boolean {
    return false;
  }

  AllowIllusionDuplicate(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  GetAttributes(): ModifierAttribute {
    return (
      ModifierAttribute.PERMANENT +
      ModifierAttribute.MULTIPLE +
      ModifierAttribute.IGNORE_INVULNERABLE
    );
  }
}
