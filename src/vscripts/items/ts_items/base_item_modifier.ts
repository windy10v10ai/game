import { BaseModifier } from '../../utils/dota_ts_adapter';

export class BaseItemModifier extends BaseModifier {
  protected statsModifierName: string = '';

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
