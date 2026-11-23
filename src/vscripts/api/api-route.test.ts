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

    expect(ApiRoute.GetBaseUrl()).toBe('https://43.135.77.42/api');
  });
});

describe('ApiRoute retry target', () => {
  beforeEach(() => ApiRoute.SetTarget('direct'));

  it('switches to the other remote line for a retry', () => {
    expect(ApiRoute.GetRetryTarget('direct')).toBe('cn-proxy');
    expect(ApiRoute.GetRetryTarget('cn-proxy')).toBe('direct');
  });

  it('never switches away from the local target', () => {
    expect(ApiRoute.GetRetryTarget('local')).toBe('local');
    ApiRoute.AdoptTarget('local');
    expect(ApiRoute.GetTarget()).toBe('direct');
  });

  it('makes the answering line the current one', () => {
    ApiRoute.AdoptTarget('cn-proxy');
    expect(ApiRoute.GetTarget()).toBe('cn-proxy');
  });

  it('keeps a locked target fixed', () => {
    ApiRoute.LockTarget('direct');
    expect(ApiRoute.GetRetryTarget('direct')).toBe('direct');
    ApiRoute.AdoptTarget('cn-proxy');
    expect(ApiRoute.GetTarget()).toBe('direct');
  });
});
