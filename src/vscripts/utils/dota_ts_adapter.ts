export interface BaseAbility extends CDOTA_Ability_Lua {}
export class BaseAbility {}

export interface BaseItem extends CDOTA_Item_Lua {}
export class BaseItem {}

export interface BaseModifier extends CDOTA_Modifier_Lua {}
export class BaseModifier {
  public static apply<T extends typeof BaseModifier>(
    this: T,
    target: CDOTA_BaseNPC,
    caster?: CDOTA_BaseNPC,
    ability?: CDOTABaseAbility,
    modifierTable?: object,
  ): InstanceType<T> {
    return target.AddNewModifier(
      caster,
      ability,
      this.name,
      modifierTable,
    ) as unknown as InstanceType<T>;
  }

  public static find_on<T extends typeof BaseModifier>(
    this: T,
    target: CDOTA_BaseNPC,
  ): InstanceType<T> {
    return target.FindModifierByName(this.name) as unknown as InstanceType<T>;
  }

  public static remove<T extends typeof BaseModifier>(this: T, target: CDOTA_BaseNPC): void {
    target.RemoveModifierByName(this.name);
  }
}

export interface BaseModifierMotionHorizontal extends CDOTA_Modifier_Lua_Horizontal_Motion {}
export class BaseModifierMotionHorizontal extends BaseModifier {}

export interface BaseModifierMotionVertical extends CDOTA_Modifier_Lua_Vertical_Motion {}
export class BaseModifierMotionVertical extends BaseModifier {}

export interface BaseModifierMotionBoth extends CDOTA_Modifier_Lua_Motion_Both {}
export class BaseModifierMotionBoth extends BaseModifier {}

// Add standard base classes to prototype chain to make `super.*` work as `self.BaseClass.*`
setmetatable(BaseAbility.prototype, { __index: CDOTA_Ability_Lua ?? C_DOTA_Ability_Lua });
setmetatable(BaseItem.prototype, { __index: CDOTA_Item_Lua ?? C_DOTA_Item_Lua });
setmetatable(BaseModifier.prototype, { __index: CDOTA_Modifier_Lua });

export const registerAbility =
  (name?: string) => (ability: new () => CDOTA_Ability_Lua | CDOTA_Item_Lua) => {
    if (name !== undefined) {
      // @ts-ignore
      ability.name = name;
    } else {
      name = ability.name;
    }

    const [env] = getFileScope();

    env[name] = {};

    toDotaClassInstance(env[name], ability);

    const originalSpawn = (env[name] as CDOTA_Ability_Lua).Spawn;
    env[name].Spawn = function () {
      this.____constructor();
      if (originalSpawn) {
        originalSpawn.call(this);
      }
    };
  };

/**
 * 在「当前调用方」所在脚本的 env（用于 registerModifier 的 env 参数）。
 * 应在模块顶层调用（如 const _env = getCallerEnv()），此时调用方即该模块 chunk，返回的即该模块全局 env。
 * 与显式 scriptPath 一起传入 registerModifier，可避免移除 debug 后 path/env 错位导致的 "unknown modifier"。
 */
export function getCallerEnv(): any {
  const env = getfenv(2);
  print('[getCallerEnv] level=2 env=' + (env == null ? 'nil' : 'table'));
  return env;
}

/**
 * 注册 Lua modifier。
 * @param name  modifier 名，不传则用类名
 * @param scriptPath 可选。LinkLuaModifier 的脚本路径（相对 vscripts，不含 .lua）
 * @param envOverride 可选。modifier 表写入的全局 env，应与 scriptPath 对应脚本的 env 一致；用于玩家属性等需客户端正确加载以显示数值时，在模块顶层 getCallerEnv() 后传入。
 */
export const registerModifier = (name?: string, scriptPath?: string, envOverride?: any) => (modifier: new () => CDOTA_Modifier_Lua) => {
  if (name !== undefined) {
    // @ts-ignore
    modifier.name = name;
  } else {
    name = modifier.name;
  }

  const env =
    envOverride !== undefined
      ? envOverride
      : scriptPath !== undefined
        ? (getfenv(3) ?? getfenv(1))
        : getFileScope()[0];
  if (envOverride !== undefined && env == null) {
    print('[test-ModifierReg] ERROR env is nil for name=' + name + ' path=' + (scriptPath ?? '?'));
  }
  const [, source] = getFileScope();
  const pathForLink =
    scriptPath !== undefined
      ? scriptPath
      : (() => {
          const [raw] = string.gsub(source, ".*scripts[\\/]vscripts[\\/]", "");
          const [noExt] = string.gsub(raw, "%.lua$", "");
          return noExt;
        })();

  env[name] = {};

  toDotaClassInstance(env[name], modifier);

  // 传入 envOverride 时（玩家属性等）同时写入 _G，确保客户端无论从脚本 env 还是全局查找都能找到 modifier，从而正确执行 HandleCustomTransmitterData 并显示数值
  if (envOverride !== undefined) {
    (_G as any)[name] = env[name];
    const side = typeof IsServer === 'function' && IsServer() ? 'server' : 'client';
    print('[test-ModifierReg] side=' + side + ' name=' + name + ' path=' + pathForLink + ' _G set');
  }

  const originalOnCreated = (env[name] as CDOTA_Modifier_Lua).OnCreated;
  env[name].OnCreated = function (parameters: any) {
    this.____constructor();
    if (originalOnCreated !== undefined) {
      originalOnCreated.call(this, parameters);
    }
  };

  let type = LuaModifierMotionType.NONE;
  let base = (modifier as any).____super;
  while (base) {
    if (base === BaseModifierMotionBoth) {
      type = LuaModifierMotionType.BOTH;
      break;
    } else if (base === BaseModifierMotionHorizontal) {
      type = LuaModifierMotionType.HORIZONTAL;
      break;
    } else if (base === BaseModifierMotionVertical) {
      type = LuaModifierMotionType.VERTICAL;
      break;
    }

    base = base.____super;
  }

  LinkLuaModifier(name, pathForLink, type);
  if (envOverride !== undefined) {
    print('[test-ModifierReg] LinkLuaModifier done name=' + name + ' path=' + pathForLink);
  }
};

function clearTable(table: object) {
  for (const key in table) {
    delete (table as any)[key];
  }
}

function getFileScope(): [any, string] {
  // 不再使用 debug.getinfo（Valve 已移除 debug 库）。路径由 tstl 在每文件首行设置 _G.__TS__currentFile，供 LinkLuaModifier 等使用。
  return [getfenv(1), (_G as any).__TS__currentFile ?? "?"];
}

function toDotaClassInstance(instance: any, table: new () => any) {
  let { prototype } = table;
  while (prototype) {
    for (const key in prototype) {
      // Using hasOwnProperty to ignore methods from metatable added by ExtendInstance
      // https://github.com/SteamDatabase/GameTracking-Dota2/blob/7edcaa294bdcf493df0846f8bbcd4d47a5c3bd57/game/core/scripts/vscripts/init.lua#L195
      if (!instance.hasOwnProperty(key)) {
        if (key != "__index") {
          instance[key] = prototype[key];
        }
      }
    }

    prototype = getmetatable(prototype);
  }
}
