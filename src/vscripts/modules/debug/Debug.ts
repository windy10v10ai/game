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

    if (cmd.startsWith("-test")) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      this.log(`test command: ${cmd}`);
      ModifierHelper.appleTowerModifier(hero, `modifier_tower_power`, 3);
    }

    // 常用命令
    if (cmd === CMD.G_ALL) {
      PlayerHelper.ForEachPlayer((playerId) => {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) return;
        // 获得金钱经验技能升满
        hero.SetGold(20000, false);
        hero.AddExperience(30000, ModifyXpReason.UNSPECIFIED, false, true);
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

    if (cmd === CMD.KILL) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;

      hero.Kill(undefined, hero);
    }

    if (cmd === CMD.KILL_ALL) {
      PlayerHelper.ForEachPlayer((playerId) => {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) return;
        hero.Kill(undefined, hero);
      });
    }

    if (cmd.startsWith(CMD.GET_KEY_V3)) {
      const version = args[0];
      const key = GetDedicatedServerKeyV3(version);
      this.log(`${version}: ${key}`);
    }

    if (cmd.startsWith(CMD.ADD_MODIFIER)) {
      const modifierName = args[0];
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (hero) {
        hero.AddNewModifier(hero, undefined, modifierName, {});
      }
    }
    if (cmd.startsWith(CMD.REMOVE_MODIFIER)) {
      const modifierName = args[0];
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (hero) {
        hero.RemoveModifierByName(modifierName);
      }
    }

    if (cmd.startsWith(CMD.ADD_MODIFIER_All_100)) {
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
    if (cmd.startsWith(CMD.REMOVE_MODIFIER_ALL_100)) {
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
    if (cmd.startsWith(CMD.ADD_DATADRIVE_MODIFIER_All_100)) {
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

    if (cmd === CMD.RESET_ABILITY) {
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
    if (cmd === CMD.GET_SR) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      const sr = hero.GetStatusResistance();
      this.log(`status resistance: ${sr}`);
    }
    // 造成存粹伤害
    if (cmd === CMD.DAMAGE_PURE) {
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
