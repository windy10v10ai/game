import { reloadable } from '../../utils/tstl-utils';
import { ApiClient, ApiParameter, HttpMethod } from '../api-client';
import { PickDto } from './dto/pick-ability-dto';

@reloadable
export class Analytic {
  public static readonly POST_LOTTERY_PICK_ABILITY_URL = '/analytics/lottery/pick/ability';
  public static readonly POST_LOTTERY_PICK_ITEM_URL = '/analytics/lottery/pick/item';
  public static readonly POST_GAME_END_PICK_ABILITY_URL = '/analytics/game-end/pick/ability';
  public static readonly POST_GAME_END_PICK_ITEM_URL = '/analytics/game-end/pick/item';

  public static async SendPickAbilityEvent(pickDto: PickDto) {
    const apiParameter: ApiParameter = {
      method: HttpMethod.POST,
      path: this.POST_LOTTERY_PICK_ABILITY_URL,
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
      path: this.POST_LOTTERY_PICK_ITEM_URL,
      body: pickDto,
      successFunc: () => {
        print(`[Analytic] sendPickItemEvent success`);
      },
    };

    ApiClient.sendWithRetry(apiParameter);
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

  public static async SendGameEndPickItemEvent(pickDto: PickDto) {
    const apiParameter: ApiParameter = {
      method: HttpMethod.POST,
      path: this.POST_GAME_END_PICK_ITEM_URL,
      body: pickDto,
      successFunc: () => {
        print(`[Analytic] SendGameEndPickItemEvent success`);
      },
    };

    ApiClient.sendWithRetry(apiParameter);
  }
}
