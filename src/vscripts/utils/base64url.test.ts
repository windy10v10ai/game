import { base64UrlDecode, base64UrlEncode } from './base64url';

// Lua 字符串是字节序列，非 ASCII 用 UTF-8 字节的转义写法表示
describe('base64UrlEncode', () => {
  it.each([
    ['empty string', '', ''],
    ['1 byte remainder', 'a', 'YQ'],
    ['2 byte remainder', 'ab', 'YWI'],
    ['exact multiple of 3', 'abc', 'YWJj'],
    ['longer text', 'hello world!', 'aGVsbG8gd29ybGQh'],
    ['non-ASCII 3-byte char', '\xe4\xb8\xad', '5Lit'],
    ['non-ASCII mixed with ASCII', '\xe4\xb8\xad\xe2\x9c\x93 a', '5Lit4pyTIGE'],
  ])('%s', (_, input, expected) => {
    expect(base64UrlEncode(input)).toBe(expected);
  });

  it('uses url-safe alphabet without padding', () => {
    // 标准 base64 分别是 "+//+" 与 "/w=="
    expect(base64UrlEncode('\xfb\xff\xfe')).toBe('-__-');
    expect(base64UrlEncode('\xff')).toBe('_w');
  });
});

describe('base64UrlDecode', () => {
  it.each([
    ['empty string', '', ''],
    ['1 byte remainder', 'a', 'YQ'],
    ['2 byte remainder', 'ab', 'YWI'],
    ['exact multiple of 3', 'abc', 'YWJj'],
    ['longer text', 'hello world!', 'aGVsbG8gd29ybGQh'],
    ['non-ASCII 3-byte char', '\xe4\xb8\xad', '5Lit'],
    ['non-ASCII mixed with ASCII', '\xe4\xb8\xad\xe2\x9c\x93 a', '5Lit4pyTIGE'],
    ['url-safe alphabet', '\xfb\xff\xfe', '-__-'],
    ['url-safe single byte', '\xff', '_w'],
  ])('round-trips %s', (_, input, encoded) => {
    expect(base64UrlDecode(base64UrlEncode(input))).toBe(input);
    expect(base64UrlDecode(encoded)).toBe(input);
  });

  it.each([
    ['1 byte remainder', 'YQ', 'a'],
    ['2 byte remainder', 'YWI', 'ab'],
    ['exact multiple of 3', 'YWJj', 'abc'],
    ['url-safe alphabet', '-__-', '\xfb\xff\xfe'],
    ['empty string', '', ''],
  ])('decodes %s', (_, input, expected) => {
    expect(base64UrlDecode(input)).toBe(expected);
  });

  it.each([
    ['padding', 'YQ=='],
    ['standard base64 alphabet', 'a+b/'],
    ['length remainder of 1', 'Y'],
  ])('rejects %s', (_, input) => {
    expect(base64UrlDecode(input)).toBeUndefined();
  });
});
