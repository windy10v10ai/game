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
  public static readonly POST_ANALYTICS_PICK_ABILITY_URL = '/analytics/pick/ability';

  public static async SendPickAbilityEvent(pickDto: PickDto) {
    const apiParameter: ApiParameter = {
      method: HttpMethod.POST,
      path: this.POST_ANALYTICS_PICK_ABILITY_URL,
      body: pickDto,
      successFunc: () => {
        print(`[Analytic] sendPickEvent success`);
      },
    };

    ApiClient.sendWithRetry(apiParameter);
  }
}
