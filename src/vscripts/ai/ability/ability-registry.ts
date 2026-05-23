import { AbilitySpec } from './ability-spec';

/**
 * 按技能名注册 AbilitySpec。
 *
 * 同一个 abilityName 允许多条 spec：
 *  - 例如 medusa_split_shot 同时打英雄/小兵，但两者 condition 不同
 *  - 多条 spec 按注册顺序保存，dispatcher 按数组顺序尝试，作者负责把更优先的写在前面
 */
class AbilityRegistryClass {
  private readonly map = new Map<string, AbilitySpec[]>();

  register(spec: AbilitySpec): void {
    const list = this.map.get(spec.abilityName);
    if (list) {
      list.push(spec);
    } else {
      this.map.set(spec.abilityName, [spec]);
    }
  }

  registerAll(specs: AbilitySpec[]): void {
    for (const spec of specs) {
      this.register(spec);
    }
  }

  get(abilityName: string): AbilitySpec[] | undefined {
    return this.map.get(abilityName);
  }

  getAll(): Map<string, AbilitySpec[]> {
    return this.map;
  }

  /** 仅供测试使用 */
  _clear(): void {
    this.map.clear();
  }
}

export const AbilityRegistry = new AbilityRegistryClass();
