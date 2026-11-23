import { ApiClient, HttpMethod, matchProxyPath } from './api-client';
import { ApiRoute } from './api-route';

describe('matchProxyPath', () => {
  it('matches a literal pattern without path params', () => {
    expect(matchProxyPath('/game/start', '/game/start')).toEqual({});
  });

  it('takes the value of a `:` segment', () => {
    expect(matchProxyPath('/player/:steamId/info', '/player/123/info')).toEqual({
      steamId: '123',
    });
  });

  it('does not match when a literal segment differs', () => {
    expect(matchProxyPath('/player/:steamId/info', '/player/123/setting')).toBeUndefined();
  });

  it('does not match when the segment count differs', () => {
    expect(matchProxyPath('/player/:steamId/info', '/player/123')).toBeUndefined();
    expect(matchProxyPath('/player/:steamId/info', '/player/123/info/extra')).toBeUndefined();
  });
});

describe('ApiClient.sendWithRetry', () => {
  let callbackCallCount = 0;

  beforeEach(() => {
    (globalThis as Record<string, unknown>).print = jest.fn();
    callbackCallCount = 0;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockSendWithBodies = (...bodies: string[]) =>
    jest.spyOn(ApiClient, 'send').mockImplementation((_apiParameter, callbackFunc) => {
      const body = bodies[Math.min(callbackCallCount++, bodies.length - 1)];
      callbackFunc({ StatusCode: 200, Body: body } as CScriptHTTPResponse);
    });

  it('retries an empty 200 body and calls failureFunc after the default three attempts', () => {
    const sendSpy = mockSendWithBodies('');
    const successFunc = jest.fn();
    const failureFunc = jest.fn();

    ApiClient.sendWithRetry({
      method: HttpMethod.POST,
      path: '/game/end',
      successFunc,
      failureFunc,
      validateResponse: (body) => body === 'OK',
    });

    expect(sendSpy).toHaveBeenCalledTimes(3);
    expect(successFunc).not.toHaveBeenCalled();
    expect(failureFunc).toHaveBeenCalledTimes(1);
    expect(failureFunc).toHaveBeenCalledWith('');
  });

  it('succeeds when a later attempt returns OK', () => {
    const sendSpy = mockSendWithBodies('', 'OK');
    const successFunc = jest.fn();
    const failureFunc = jest.fn();

    ApiClient.sendWithRetry({
      method: HttpMethod.POST,
      path: '/game/end',
      successFunc,
      failureFunc,
      validateResponse: (body) => body === 'OK',
    });

    expect(sendSpy).toHaveBeenCalledTimes(2);
    expect(successFunc).toHaveBeenCalledTimes(1);
    expect(successFunc).toHaveBeenCalledWith('OK');
    expect(failureFunc).not.toHaveBeenCalled();
  });

  it('accepts an empty 200 body when validateResponse is not provided', () => {
    const sendSpy = mockSendWithBodies('');
    const successFunc = jest.fn();

    ApiClient.sendWithRetry({
      method: HttpMethod.POST,
      path: '/player/setting',
      successFunc,
    });

    expect(sendSpy).toHaveBeenCalledTimes(1);
    expect(successFunc).toHaveBeenCalledTimes(1);
    expect(successFunc).toHaveBeenCalledWith('');
  });
});

describe('ApiClient.sendWithRetry route switching', () => {
  const results: number[] = [];
  let targets: string[] = [];

  beforeEach(() => {
    (globalThis as Record<string, unknown>).print = jest.fn();
    ApiRoute.SetTarget('direct');
    targets = [];
    jest
      .spyOn(ApiClient, 'send')
      .mockImplementation((_apiParameter, callbackFunc, target = ApiRoute.GetTarget()) => {
        targets.push(target);
        const status = results[Math.min(targets.length - 1, results.length - 1)];
        callbackFunc({
          StatusCode: status,
          Body: status === 200 ? 'OK' : '',
        } as CScriptHTTPResponse);
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const run = (retryTimes?: number) => {
    const successFunc = jest.fn();
    const failureFunc = jest.fn();
    ApiClient.sendWithRetry({
      method: HttpMethod.GET,
      path: '/x',
      successFunc,
      failureFunc,
      retryTimes,
    });
    return { successFunc, failureFunc };
  };

  const setResults = (...statuses: number[]) => {
    results.length = 0;
    results.push(...statuses);
  };

  it('retries on the other line and keeps it when only the backup entry is reachable', () => {
    setResults(0, 200);
    const { successFunc } = run();

    expect(targets).toEqual(['direct', 'cn-proxy']);
    expect(successFunc).toHaveBeenCalledTimes(1);
    expect(ApiRoute.GetTarget()).toBe('cn-proxy');
  });

  it('retries on the main entry when the backup entry was selected and broke', () => {
    ApiRoute.SetTarget('cn-proxy');
    setResults(500, 200);
    run();

    expect(targets).toEqual(['cn-proxy', 'direct']);
    expect(ApiRoute.GetTarget()).toBe('direct');
  });

  it('keeps the selected line when it answers', () => {
    setResults(200);
    run();

    expect(targets).toEqual(['direct']);
    expect(ApiRoute.GetTarget()).toBe('direct');
  });

  it('uses the same number of attempts and fails normally when both lines are down', () => {
    setResults(0);
    const { successFunc, failureFunc } = run();

    expect(targets).toEqual(['direct', 'cn-proxy', 'direct']);
    expect(successFunc).not.toHaveBeenCalled();
    expect(failureFunc).toHaveBeenCalledTimes(1);
  });

  it('does not switch when the request must not be retried', () => {
    setResults(0);
    run(1);

    expect(targets).toEqual(['direct']);
  });

  it('does not switch on a status that retrying cannot fix', () => {
    setResults(404);
    const { failureFunc } = run();

    expect(targets).toEqual(['direct']);
    expect(failureFunc).toHaveBeenCalledTimes(1);
  });
});
