import { HeroItemUsageDto } from './analytics/dto/hero-item-usage-dto';
import { ApiHtmlProxy } from './api-html-proxy';
import { ApiRoute, ApiTarget } from './api-route';
import { PROXY_HERO_ITEM_USAGE_PATH, splitHeroItemUsage } from './hero-item-usage';
import { base64UrlEncode } from '../utils/base64url';

jest.mock('./api-client.local', () => ({ GetLocalHostAPIKEY: () => 'test-key' }));

describe('splitHeroItemUsage', () => {
  const usage: HeroItemUsageDto = {
    customMatchId: '999999999-999999999',
    version: 'v5.63',
    difficulty: 10,
    dotaTimeMsec: 7200000,
    playerCount: 10,
    playerId: 23,
    steamId: 0,
    heroName: 'npc_dota_hero_skywrath_mage',
    teamId: 3,
    isWin: false,
    items: Array.from({ length: 200 }, (_, index) => ({
      itemName: `item_${index}_${'x'.repeat(70)}`,
      durationSec: 999999,
      lateDurationSec: 999999,
    })),
  };

  beforeAll(() => {
    Object.assign(globalThis, { json: { encode: JSON.stringify } });
  });

  it('preserves all items and bot identity across requests within the full URL budget', () => {
    for (const target of ['local', 'direct', 'cn-proxy'] as ApiTarget[]) {
      const budget = ApiHtmlProxy.GetBodyBudget(target, PROXY_HERO_ITEM_USAGE_PATH);
      const requests = splitHeroItemUsage(usage, budget);
      expect(requests.length).toBeGreaterThan(1);
      expect(requests.flatMap((request) => request.items)).toEqual(usage.items);
      for (const request of requests) {
        const body = base64UrlEncode(JSON.stringify(request));
        const url = `${ApiRoute.GetBaseUrl(target)}${PROXY_HERO_ITEM_USAGE_PATH}?requestId=p_9999999999_999999999&body=${body}&apiKey=test-key&_=999999999`;
        expect(url.length).toBeLessThanOrEqual(7000);
        const { items: _items, ...metadata } = request;
        const { items: _originalItems, ...expected } = usage;
        expect(metadata).toEqual(expected);
      }
    }
  });

  it('sends an empty inventory once and rejects an item that cannot fit', () => {
    expect(splitHeroItemUsage({ ...usage, items: [] }, 1000)).toEqual([{ ...usage, items: [] }]);
    expect(() => splitHeroItemUsage(usage, 100)).toThrow('relay budget');
  });
});
