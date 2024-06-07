import { ActionItem } from "../../ai/action/action-item";
import { ModifierHelper } from "../../helper/modifier-helper";
import { PlayerHelper } from "../../helper/player-helper";
import { reloadable } from "../../utils/tstl-utils";
import { CMD } from "./debug-cmd";

@reloadable
export class Debug {
  DebugEnabled = false;
  // 在线测试白名单
  OnlineDebugWhiteList = [
    136407523, // windy
    916506173, // windy
    385130282, // mimihua
  ];

  constructor() {
    // 工具模式下默认开启调试
    this.DebugEnabled = IsInToolsMode();
    ListenToGameEvent(`player_chat`, (keys) => this.OnPlayerChat(keys), this);
  }

  OnPlayerChat(keys: GameEventProvidedProperties & PlayerChatEvent): void {
    const steamid = PlayerResource.GetSteamAccountID(keys.playerid);

    if (!this.OnlineDebugWhiteList.includes(steamid)) {
      return;
    }

    const strs = keys.text.split(" ");
    const cmd = strs[0];
    const args = strs.slice(1);

    if (cmd === "-debug") {
      this.DebugEnabled = !this.DebugEnabled;
    }

    // 只在允许调试的时候才执行以下指令
    // commands that only work in debug mode below:
    if (!this.DebugEnabled) return;

    if (cmd === CMD.G) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      // 获得金钱经验技能升满
      hero.SetGold(99999, false);
      hero.AddExperience(100000, ModifyXpReason.UNSPECIFIED, false, true);
      // refresh teleport
      hero.GetItemInSlot(15)?.EndCooldown();
    }

    if (cmd === CMD.G_ALL) {
      PlayerHelper.ForEachPlayer((playerId) => {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) return;
        // 获得金钱经验技能升满
        hero.SetGold(20000, false);
        hero.AddExperience(20000, ModifyXpReason.UNSPECIFIED, false, true);
      });
    }

    if (cmd === CMD.L_ALL) {
      // loop 35 times time 1s
      for (let i = 0; i < 35; i++) {
        Timers.CreateTimer(i, () => {
          PlayerHelper.ForEachPlayer((playerId) => {
            const hero = PlayerResource.GetSelectedHeroEntity(playerId);
            if (!hero) return;
            hero.HeroLevelUp(true);
          });
        });
      }
    }

    // v 获取当前vector
    if (cmd === CMD.V) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      const pos = hero.GetAbsOrigin();
      const vectorString = `Vector(${Math.floor(pos.x)}, ${Math.floor(pos.y)}, ${Math.floor(
        pos.z,
      )})`;
      this.log(`当前位置: ${vectorString}`);
    }

    if (cmd === CMD.REFRESH_AI) {
      this.log(`REFRESH_AI`);
      PlayerHelper.ForEachPlayer((playerId) => {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) return;
        GameRules.AI.EnableAI(hero);
      });
    }

    if (cmd === "-kill") {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;

      print(`kill hero`);
      hero.Kill(undefined, hero);
    }

    if (cmd === "-killall") {
      PlayerHelper.ForEachPlayer((playerId) => {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) return;
        hero.Kill(undefined, hero);
      });
    }

    if (cmd.startsWith("-getUseableItemByName")) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      const itemName = args[0];
      const item = ActionItem.FindItemInInventoryUseable(hero, itemName);
      if (!item) {
        this.log(`没有找到物品: ${itemName}`);
        return;
      } else {
        this.log(`找到物品: ${itemName}`);
      }
    }

    if (cmd.startsWith("-getUseableItemByName")) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      const itemName = args[0];
      const item = ActionItem.FindItemInInventoryUseable(hero, itemName);
      if (!item) {
        this.log(`没有找到物品: ${itemName}`);
        return;
      } else {
        this.log(`找到物品: ${itemName}`);
      }
    }

    // 其他的测试指令写在下面
    if (cmd.startsWith("-get_key_v3")) {
      const version = args[0];
      const key = GetDedicatedServerKeyV3(version);
      this.log(`${version}: ${key}`);
    }

    if (cmd.startsWith("-get_key_v2")) {
      const version = args[0];
      const key = GetDedicatedServerKeyV2(version);
      this.log(`${version}: ${key}`);
    }

    if (cmd.startsWith("-removeModifier")) {
      const modifierName = args[0];
      PlayerHelper.ForEachPlayer((playerId) => {
        // add modifier
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (hero) {
          // remove all modifier
          for (let i = 0; i < 100; i++) {
            hero.RemoveModifierByName(modifierName);
          }
        }
      });
    }
    if (cmd.startsWith("-addModifier")) {
      const modifierName = args[0];
      PlayerHelper.ForEachPlayer((playerId) => {
        // add modifier
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (hero) {
          for (let i = 0; i < 100; i++) {
            hero.AddNewModifier(hero, undefined, modifierName, {});
          }
        }
      });
    }
    if (cmd.startsWith("-addDataDriveModifier")) {
      const modifierName = args[0];
      PlayerHelper.ForEachPlayer((playerId) => {
        // add modifier
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (hero) {
          for (let i = 0; i < 100; i++) {
            ModifierHelper.applyGlobalModifier(hero, modifierName);
          }
        }
      });
    }

    // 重置技能
    if (cmd === "-resetAbility") {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      for (let i = 0; i < 16; i++) {
        const ability = hero.GetAbilityByIndex(i);
        if (ability) {
          ability.SetLevel(0);
        }
      }
    }
    // 获取状态抗性
    if (cmd === "-getSR") {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      const sr = hero.GetStatusResistance();
      this.log(`status resistance: ${sr}`);
    }
    // 造成伤害
    if (cmd === "-damage") {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      const damage = Number(args[0]);
      ApplyDamage({
        attacker: hero,
        victim: hero,
        damage: damage,
        damage_type: DamageTypes.PURE,
        ability: undefined,
        damage_flags: DamageFlag.NONE,
      });
    }
  }

  log(message: string) {
    print(`[Debug] ${message}`);
    Say(HeroList.GetHero(0), message, false);
  }
}
