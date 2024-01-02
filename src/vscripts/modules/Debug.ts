import { reloadable } from "../utils/tstl-utils";

@reloadable
export class Debug {
  DebugEnabled = false;
  // 在线测试白名单
  OnlineDebugWhiteList = [
    136407523, // windy
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

    print(`[DEBUG] ${steamid} ${keys.playerid} ${keys.teamonly} ${keys.userid} ${keys.text}`);

    if (cmd === "-debug") {
      this.DebugEnabled = !this.DebugEnabled;
    }

    // 只在允许调试的时候才执行以下指令
    // commands that only work in debug mode below:
    if (!this.DebugEnabled) return;

    // 其他的测试指令写在下面
    if (cmd.startsWith("get_key_v3")) {
      const version = args[0];
      const key = GetDedicatedServerKeyV3(version);
      Say(HeroList.GetHero(0), `${version}: ${key}`, false);
    }

    if (cmd.startsWith("get_key_v2")) {
      const version = args[0];
      const key = GetDedicatedServerKeyV2(version);
      Say(HeroList.GetHero(0), `${version}: ${key}`, false);
    }
  }
}
