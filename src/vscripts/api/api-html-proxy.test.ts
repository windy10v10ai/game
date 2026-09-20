import { parseProxyError } from './api-html-proxy';

describe('parseProxyError', () => {
  it('extracts the error code from an ERR: prefixed response', () => {
    expect(parseProxyError('ERR:not_found')).toBe('not_found');
  });

  it('returns undefined for a normal JSON response', () => {
    expect(parseProxyError('{"id":"123"}')).toBeUndefined();
  });

  it('returns undefined for an empty object response', () => {
    expect(parseProxyError('{}')).toBeUndefined();
  });

  it('does not match ERR: appearing outside the prefix position', () => {
    expect(parseProxyError('{"message":"ERR:not_found"}')).toBeUndefined();
  });
});
