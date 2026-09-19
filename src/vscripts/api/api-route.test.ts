import { ApiRoute } from './api-route';

describe('ApiRoute', () => {
  it.each([
    [true, 'US', true, 'direct'],
    [true, 'US', false, 'direct'],
    [true, 'CN', true, 'cn-proxy'],
    [true, 'CN', false, 'direct'],
  ])(
    'selects direct probe available=%s country=%s proxy available=%s as %s',
    (directProbeAvailable, country, proxyAvailable, expected) => {
      expect(ApiRoute.ChooseTarget(directProbeAvailable, country, proxyAvailable)).toBe(expected);
    },
  );

  it('uses direct when a successful direct probe has no country', () => {
    let country: string | undefined;

    expect(ApiRoute.ChooseTarget(true, country, true)).toBe('direct');
  });

  it('uses the proxy only when the direct probe fails', () => {
    let country: string | undefined;

    expect(ApiRoute.ChooseTarget(false, country, true)).toBe('cn-proxy');
  });

  it('uses direct when neither probe succeeds', () => {
    let country: string | undefined;

    expect(ApiRoute.ChooseTarget(false, country, false)).toBe('direct');
  });

  it('uses the selected target base URL', () => {
    ApiRoute.SetTarget('cn-proxy');

    expect(ApiRoute.GetBaseUrl()).toBe(
      'https://1491237865-455d5j25yx.ap-guangzhou.tencentscf.com/api',
    );
  });
});
