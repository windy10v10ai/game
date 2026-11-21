import { base64UrlEncode } from '../utils/base64url';
import { resolveRelayResponses } from './launcher-relay';

type Result = { StatusCode: number; Body: string };

function pendingOf(ids: number[], results: Map<number, Result>) {
  const pending = new Map<
    number,
    { callback: (result: CScriptHTTPResponse) => void; deadline: number }
  >();
  for (const id of ids) {
    pending.set(id, {
      callback: (result) => results.set(id, result as unknown as Result),
      deadline: 0,
    });
  }
  return pending;
}

describe('resolveRelayResponses', () => {
  it('delivers decoded bodies and leaves unanswered requests pending', () => {
    const results = new Map<number, Result>();
    const pending = pendingOf([1, 2], results);
    resolveRelayResponses(
      { '1': { status: 200, body: base64UrlEncode('{"players":[]}') } },
      pending,
    );
    expect(results.get(1)).toEqual({ StatusCode: 200, Body: '{"players":[]}' });
    expect(results.has(2)).toBe(false);
    expect([...pending.keys()]).toEqual([2]);
  });

  it('accepts numeric-looking values the engine may convert', () => {
    const results = new Map<number, Result>();
    resolveRelayResponses({ '3': { status: '404', body: '' } }, pendingOf([3], results));
    expect(results.get(3)).toEqual({ StatusCode: 404, Body: '' });
  });

  it('reports a malformed body as a network failure', () => {
    const results = new Map<number, Result>();
    resolveRelayResponses({ '4': { status: 200, body: 'a b' } }, pendingOf([4], results));
    expect(results.get(4)).toEqual({ StatusCode: 0, Body: '' });
  });
});
