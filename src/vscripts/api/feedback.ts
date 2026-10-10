import { GameConfig } from '../modules/GameConfig';
import { GameEnd } from '../modules/event/game-end/game-end';
import { PlayerHelper } from '../modules/helper/player-helper';
import { isAwakened } from '../modules/awaken/awaken-replacer';
import { ApiClient, HttpMethod } from './api-client';
import { GameEndGameOptionsDto } from './analytics/dto/game-end-dto';

export const FEEDBACK_PATH = '/feedback';

const MAX_TOPICS = 2;
// 「启动器」「网站」在游戏里无从反馈，界面不给选，这里一并挡掉
const GAME_TOPICS = [
  'hero',
  'ability',
  'awaken',
  'item',
  'bot',
  'balance',
  'ui',
  'member',
  'lag',
  'game',
];

interface FeedbackGameState {
  gameTimeMsec: number;
  playerCount: number;
  difficulty?: number;
  gameOptions?: GameEndGameOptionsDto;
  localHost: boolean;
  offline: boolean;
  heroName?: string;
  level?: number;
  awaken?: number;
  strength?: number;
  agility?: number;
  intellect?: number;
  items?: string[];
  neutralItem?: string;
  neutralPassiveItem?: string;
  abilities?: string[];
}

/** 收到玩家在反馈页点发送后，附上本局状态发给后端，并把结果回给该玩家 */
export class FeedbackApi {
  constructor() {
    CustomGameEventManager.RegisterListener<FeedbackSubmitEventData>(
      'feedback_submit',
      (_, event) => FeedbackApi.Submit(event),
    );
  }

  private static Submit(event: NetworkedData<FeedbackSubmitEventData & { PlayerID: PlayerID }>) {
    const playerId = event.PlayerID;
    const type = event.type === 'suggestion' ? 'suggestion' : 'problem';
    const description = (event.description ?? '').trim();
    if (type === 'suggestion' && description === '') {
      FeedbackApi.Reply(playerId, 'failed');
      return;
    }

    const body: { [key: string]: unknown } = {
      source: 'game',
      type,
      topics: FeedbackApi.ParseTopics(event.topics ?? ''),
      mapVersion: GameConfig.GAME_VERSION,
      gameState: FeedbackApi.BuildGameState(playerId),
    };
    if (description !== '') {
      body.description = description;
    }
    const steamId = PlayerResource.GetSteamAccountID(playerId);
    if (steamId > 0) {
      body.steamId = steamId;
    }

    ApiClient.sendWithRetry({
      method: HttpMethod.POST,
      path: FEEDBACK_PATH,
      body,
      // 每次发送都占限频额度，重试会让玩家点一次扣多次
      retryTimes: 1,
      successFunc: () => FeedbackApi.Reply(playerId, 'sent'),
      failureFunc: (data) => FeedbackApi.Reply(playerId, FeedbackApi.ClassifyFailure(data)),
    });
  }

  private static ParseTopics(topics: string): string[] {
    const result: string[] = [];
    for (const topic of topics.split(',')) {
      if (result.length >= MAX_TOPICS) break;
      if (GAME_TOPICS.includes(topic) && !result.includes(topic)) {
        result.push(topic);
      }
    }
    return result;
  }

  private static BuildGameState(playerId: PlayerID): FeedbackGameState {
    let playerCount = 0;
    PlayerHelper.ForEachPlayer((id) => {
      if (PlayerResource.GetSteamAccountID(id) > 0) playerCount++;
    });
    // 选人与准备阶段计时为负，后端只收非负
    const gameTime = Math.max(0, GameRules.GetDOTATime(false, false));
    const loadingStatus = CustomNetTables.GetTableValue('loading_status', 'loading_status');
    const state: FeedbackGameState = {
      gameTimeMsec: Math.round(gameTime * 1000),
      playerCount: Math.max(1, playerCount),
      difficulty: CustomNetTables.GetTableValue('game_difficulty', 'all')?.difficulty,
      gameOptions: GameEnd.BuildGameOptions(),
      localHost: ApiClient.IsLocalhost(),
      offline: loadingStatus?.status === 3,
    };

    const hero = PlayerResource.GetPlayer(playerId)?.GetAssignedHero();
    if (!hero) return state;
    state.heroName = PlayerResource.GetSelectedHeroName(playerId);
    state.level = hero.GetLevel();
    state.awaken = isAwakened(hero) ? 1 : 0;
    // 与结算一致取整，上报的才是界面上显示的数
    state.strength = Math.floor(hero.GetStrength());
    state.agility = Math.floor(hero.GetAgility());
    state.intellect = Math.floor(hero.GetIntellect(false));
    const loadout: Parameters<typeof GameEnd.FillLoadout>[0] = {
      steamId: PlayerResource.GetSteamAccountID(playerId),
    };
    GameEnd.FillLoadout(loadout, hero);
    state.items = loadout.items;
    state.neutralItem = loadout.neutralItem;
    state.neutralPassiveItem = loadout.neutralPassiveItem;
    state.abilities = loadout.abilities;
    return state;
  }

  private static ClassifyFailure(data: string): FeedbackResult {
    if (data.includes('daily_limit_reached')) return 'daily_limit_reached';
    if (data.includes('too_many_reports')) return 'too_many_reports';
    return 'failed';
  }

  private static Reply(playerId: PlayerID, result: FeedbackResult) {
    print(`[FeedbackApi] player ${playerId} result=${result}`);
    const player = PlayerResource.GetPlayer(playerId);
    if (!player) return;
    CustomGameEventManager.Send_ServerToPlayer(player, 'feedback_result', { result });
  }
}
