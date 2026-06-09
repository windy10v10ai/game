import { reloadable } from '../../../utils/tstl-utils';
import { GA4 } from './ga4';

/**
 * 玩家语言统计：监听客户端 player_language 事件，收到即发 GA4。
 * 同时缓存 steamId→language 供 mid-only-mode 等按 steamId 查询语言。
 */
@reloadable
export class GA4PlayerLanguageTracker {
  private static readonly languageBySteamId = new Map<number, string>();

  constructor() {
    CustomGameEventManager.RegisterListener('player_language', (_userId, event) => {
      GA4PlayerLanguageTracker.OnPlayerLanguage(event);
    });
  }

  public static GetLanguage(steamId: number): string | undefined {
    return this.languageBySteamId.get(steamId);
  }

  private static OnPlayerLanguage(event: PlayerLanguageEventData & CustomGameEventDataBase): void {
    const playerId = event.PlayerID;
    const language = event.language;
    const steamId = PlayerResource.GetSteamAccountID(playerId);

    this.languageBySteamId.set(steamId, language);

    const ga4Event = GA4.BuildEvent('player_language', steamId, {
      steam_id: steamId,
      language,
    });
    GA4.SendEvent(steamId, ga4Event, { language: { value: language } });
  }
}
