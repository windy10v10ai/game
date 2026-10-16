import { HeroItemUsageDto } from './analytics/dto/hero-item-usage-dto';
import { ApiClient, HttpMethod } from './api-client';
import { ApiHtmlProxy } from './api-html-proxy';
import { ApiRoute } from './api-route';
import { base64UrlEncode } from '../utils/base64url';

export const HERO_ITEM_USAGE_PATH = '/game/hero-item-usage';
export const PROXY_HERO_ITEM_USAGE_PATH = '/proxy/game-hero-item-usage-post';

/** Splits item history into independent requests that fit the relay budget. */
export function splitHeroItemUsage(
  usage: HeroItemUsageDto,
  maxBodyLength: number,
): HeroItemUsageDto[] {
  const requests: HeroItemUsageDto[] = [];
  let request: HeroItemUsageDto = { ...usage, items: [] };
  for (const item of usage.items) {
    const candidate = { ...request, items: [...request.items, item] };
    if (base64UrlEncode(json.encode(candidate)).length <= maxBodyLength) {
      request = candidate;
      continue;
    }
    if (request.items.length === 0) throw new Error('Item usage exceeds relay budget');
    requests.push(request);
    request = { ...usage, items: [item] };
    if (base64UrlEncode(json.encode(request)).length > maxBodyLength) {
      throw new Error('Item usage exceeds relay budget');
    }
  }
  if (base64UrlEncode(json.encode(request)).length > maxBodyLength) {
    throw new Error('Item usage exceeds relay budget');
  }
  requests.push(request);
  return requests;
}

export class HeroItemUsageApi {
  public static Register(): void {
    ApiClient.RegisterProxyHandler(HERO_ITEM_USAGE_PATH, (target, parameter, _, callback) => {
      ApiHtmlProxy.Send(
        target,
        PROXY_HERO_ITEM_USAGE_PATH,
        { body: base64UrlEncode(json.encode(parameter.body)) },
        (data) => callback({ StatusCode: 200, Body: data } as CScriptHTTPResponse),
        (reason) => callback({ StatusCode: 0, Body: reason } as CScriptHTTPResponse),
      );
    });
  }

  public static Send(usage: HeroItemUsageDto): void {
    const budget = ApiHtmlProxy.GetBodyBudget(ApiRoute.GetTarget(), PROXY_HERO_ITEM_USAGE_PATH);
    for (const request of splitHeroItemUsage(usage, budget)) {
      ApiClient.sendWithRetry({
        method: HttpMethod.POST,
        path: HERO_ITEM_USAGE_PATH,
        body: request,
        retryTimes: 1,
        successFunc: () => undefined,
        failureFunc: (data) => print(`[HeroItemUsage] upload failed: ${data}`),
      });
    }
  }
}
