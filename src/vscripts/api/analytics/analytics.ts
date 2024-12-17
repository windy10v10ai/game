import { reloadable } from '../../utils/tstl-utils';
import { ApiClient, ApiParameter, HttpMethod } from '../api-client';
import { GameEndDto } from './dto/game-end-dto';
import { PickDto } from './dto/pick-ability-dto';

@reloadable
export class Analytic {
  public static readonly POST_ANALYTICS_PICK_ABILITY_URL = '/analytics/lottery/pick/ability';
  public static readonly POST_ANALYTICS_PICK_ITEM_URL = '/analytics/lottery/pick/item';
  public static readonly POST_ANALYTICS_GAME_END_URL = '/analytics/game/end';

  public static async SendPickAbilityEvent(pickDto: PickDto) {
    const apiParameter: ApiParameter = {
      method: HttpMethod.POST,
      path: this.POST_ANALYTICS_PICK_ABILITY_URL,
      body: pickDto,
      successFunc: () => {
        print(`[Analytic] sendPickAbilityEvent success`);
      },
    };

    ApiClient.sendWithRetry(apiParameter);
  }

  public static async SendPickItemEvent(pickDto: PickDto) {
    const apiParameter: ApiParameter = {
      method: HttpMethod.POST,
      path: this.POST_ANALYTICS_PICK_ITEM_URL,
      body: pickDto,
      successFunc: () => {
        print(`[Analytic] sendPickItemEvent success`);
      },
    };

    ApiClient.sendWithRetry(apiParameter);
  }

  public static async SendGameEndEvent(gameEndDto: GameEndDto) {
    const apiParameter: ApiParameter = {
      method: HttpMethod.POST,
      path: this.POST_ANALYTICS_GAME_END_URL,
      body: gameEndDto,
      successFunc: () => {
        print(`[Analytic] sendGameEndEvent success`);
      },
    };

    ApiClient.sendWithRetry(apiParameter);
  }
}
