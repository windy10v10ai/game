import { reloadable } from '../utils/tstl-utils';
import { ApiClient, ApiParameter, HttpMethod } from './api-client';

class EventBaseDto {
  steamId: number;
  matchId: string;
}

class PickDto extends EventBaseDto {
  name: string;
  level: number;
  difficulty: number;
  version: string;
}

@reloadable
export class Analytic {
  public static readonly POST_ANALYTICS_PICK_ABILITY_URL = '/analytics/lottery/pick/ability';
  public static readonly POST_ANALYTICS_PICK_ITEM_URL = '/analytics/lottery/pick/item';

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
}