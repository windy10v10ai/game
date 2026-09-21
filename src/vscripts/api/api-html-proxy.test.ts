import { maskApiKey, parseProxyError } from './api-html-proxy';

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

describe('maskApiKey', () => {
  it('遮住位于网址中间的 apiKey，保留其后的参数', () => {
    expect(maskApiKey('https://a.com/api/proxy/x?requestId=p_1&apiKey=deadbeef&_=42')).toBe(
      'https://a.com/api/proxy/x?requestId=p_1&apiKey=***&_=42',
    );
  });

  it('遮住位于末尾的 apiKey', () => {
    expect(maskApiKey('https://a.com/api/proxy/x?requestId=p_1&apiKey=deadbeef')).toBe(
      'https://a.com/api/proxy/x?requestId=p_1&apiKey=***',
    );
  });

  it('没有 apiKey 时原样返回', () => {
    const url = 'https://a.com/api/proxy/x?requestId=p_1&_=42';
    expect(maskApiKey(url)).toBe(url);
  });

  it('空值的 apiKey 也不会漏出后面的参数', () => {
    expect(maskApiKey('https://a.com/x?apiKey=&_=42')).toBe('https://a.com/x?apiKey=***&_=42');
  });
});
