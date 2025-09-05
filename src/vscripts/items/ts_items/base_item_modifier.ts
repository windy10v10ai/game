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

  protected RefreshStatsModifier(): void {
    if (this.statsModifierName && this.statsModifierName.trim() !== '') {
      const item = this.GetAbility() as CDOTA_Item_Lua;
      RefreshItemDataDrivenModifier(item, this.statsModifierName);
    }
  }

  OnCreated(): void {
    if (IsServer()) {
      this.RefreshStatsModifier();
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
    }
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
