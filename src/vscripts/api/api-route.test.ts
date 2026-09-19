import { ApiRoute } from './api-route';

describe('ApiRoute', () => {
  it.each([
    ['US', true, 'direct'],
    ['US', false, 'direct'],
    ['CN', true, 'cn-proxy'],
    ['CN', false, 'direct'],
    [undefined, true, 'cn-proxy'],
    [undefined, false, 'direct'],
  ])('selects %s with proxy available %s as %s', (country, proxyAvailable, expected) => {
    expect(ApiRoute.ChooseTarget(country, proxyAvailable)).toBe(expected);
  });

  it('uses the selected target base URL', () => {
    ApiRoute.SetTarget('cn-proxy');

    expect(ApiRoute.GetBaseUrl()).toBe(
      'https://1491237865-455d5j25yx.ap-guangzhou.tencentscf.com/api',
    );
  });
});