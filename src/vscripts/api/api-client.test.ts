import { ApiClient, HttpMethod, matchProxyPath } from './api-client';

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
