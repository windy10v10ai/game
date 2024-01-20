import { AI } from "../../ai/AI";
import { reloadable } from "../../utils/tstl-utils";
import { CMD } from "./debug-cmd";

@reloadable
export class Debug {
  DebugEnabled = false;
  // 在线测试白名单
  OnlineDebugWhiteList = [
    136407523, // windy
    916506173, // windy
  ];

  constructor() {
    // 工具模式下开启调试
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
      GameRules.AI = new AI();
      for (let i = -1; i < 24; i++) {
        const hero = PlayerResource.GetSelectedHeroEntity(i as PlayerID);
        if (hero && hero.GetTeamNumber() === DotaTeam.BADGUYS) {
          GameRules.AI.EnableAI(hero);
        }
      }
    }

    // 其他的测试指令写在下面
    if (cmd.startsWith("get_key_v3")) {
      const version = args[0];
      const key = GetDedicatedServerKeyV3(version);
      this.log(`${version}: ${key}`);
    }

    if (cmd.startsWith("get_key_v2")) {
      const version = args[0];
      const key = GetDedicatedServerKeyV2(version);
      this.log(`${version}: ${key}`);
    }
  }

  log(message: string) {
    print(`[Debug] ${message}`);
    Say(HeroList.GetHero(0), message, false);
  }
}
