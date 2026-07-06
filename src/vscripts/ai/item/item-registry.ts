import { ItemSpec } from './item-spec';

/**
 * 按物品名注册 ItemSpec，结构与 AbilityRegistry 一致。
 */
class ItemRegistryClass {
  private readonly map = new Map<string, ItemSpec[]>();

  register(spec: ItemSpec): void {
    const list = this.map.get(spec.itemName);
    if (list) {
      list.push(spec);
    } else {
      this.map.set(spec.itemName, [spec]);
    }
  }

  registerAll(specs: ItemSpec[]): void {
    for (const spec of specs) {
      this.register(spec);
    }
  }

  get(itemName: string): ItemSpec[] | undefined {
    return this.map.get(itemName);
  }

  getAll(): Map<string, ItemSpec[]> {
    return this.map;
  }

  /** 仅供测试使用 */
  _clear(): void {
    this.map.clear();
  }
}

export const ItemRegistry = new ItemRegistryClass();
