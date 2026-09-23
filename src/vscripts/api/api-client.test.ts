import { matchProxyPath } from './api-client';

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
