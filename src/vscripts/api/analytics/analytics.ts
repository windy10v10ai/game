import { GameConfig } from '../../modules/GameConfig';
import { reloadable } from '../../utils/tstl-utils';
import { ApiClient, ApiParameter, HttpMethod } from '../api-client';
import { PickDto } from './dto/pick-ability-dto';
import { PlayerLanguageListDto } from './dto/player-language-dto';

@reloadable
export class Analytic {
  public static readonly POST_GAME_END_PICK_ABILITY_URL = '/analytics/game-end/pick/ability';
  public static readonly POST_PLAYER_LANGUAGE_URL = '/analytics/player/language';
  private static PLAYER_LANGUAGES: PlayerLanguageListDto = {
    players: [],
    matchId: '',
    version: '',
  };

  constructor() {
    print('[Analytic] constructor');
    // 统计玩家语言
    CustomGameEventManager.RegisterListener('player_language', (userId, event) => {
      Analytic.ListenToPlayerLanguageEvent(userId, event);
    });
    // 当game_rules_state_change选择英雄时，发送玩家语言信息
    ListenToGameEvent(
      'game_rules_state_change',
      () => {
        if (GameRules.State_Get() === GameState.HERO_SELECTION) {
          Analytic.SendUserLanguageStatistics();
        }
      },
      this,
    );
  }

  public static async SendGameEndPickAbilityEvent(pickDto: PickDto) {
    const apiParameter: ApiParameter = {
      method: HttpMethod.POST,
      path: this.POST_GAME_END_PICK_ABILITY_URL,
      body: pickDto,
      successFunc: () => {
        print(`[Analytic] SendGameEndPickAbilityEvent success`);
      },
    };

    ApiClient.sendWithRetry(apiParameter);
  }

  /**
   * 收集玩家的语言信息
   */
  public static ListenToPlayerLanguageEvent(
    _userId: number,
    event: PlayerLanguageEventData & CustomGameEventDataBase,
  ) {
    const playerId = event.PlayerID;
    const language = event.language;
    const steamId = PlayerResource.GetSteamAccountID(playerId);

    print(`[Analytic] ListenToPlayerLanguageEvent playerId ${playerId} language ${language}`);
    this.PLAYER_LANGUAGES.players.push({
      steamId,
      language,
    });
  }

  /**
   * 发送所有玩家的语言信息
   */
  public static async SendUserLanguageStatistics() {
    Analytic.PLAYER_LANGUAGES.matchId = GameRules.Script_GetMatchID().toString();
    Analytic.PLAYER_LANGUAGES.version = GameConfig.GAME_VERSION;
    const apiParameter: ApiParameter = {
      method: HttpMethod.POST,
      path: this.POST_PLAYER_LANGUAGE_URL,
      body: Analytic.PLAYER_LANGUAGES,
      successFunc: () => {
        print(
          `[Analytic] SendUserLanguageStatistics success for ${Analytic.PLAYER_LANGUAGES.players.length} players`,
        );
      },
    };

    ApiClient.sendWithRetry(apiParameter);
  }
}
