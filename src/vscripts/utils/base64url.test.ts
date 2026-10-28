import { base64UrlDecode, base64UrlEncode } from './base64url';

// Lua 字符串是字节序列，非 ASCII 用 UTF-8 字节的转义写法表示
const ENCODE_CASES: [string, string, string][] = [
  ['empty string', '', ''],
  ['1 byte remainder', 'a', 'YQ'],
  ['2 byte remainder', 'ab', 'YWI'],
  ['exact multiple of 3', 'abc', 'YWJj'],
  ['longer text', 'hello world!', 'aGVsbG8gd29ybGQh'],
  ['non-ASCII 3-byte char', '\xe4\xb8\xad', '5Lit'],
  ['non-ASCII mixed with ASCII', '\xe4\xb8\xad\xe2\x9c\x93 a', '5Lit4pyTIGE'],
];

describe('base64UrlEncode', () => {
  it.each(ENCODE_CASES)('%s', (_, input, expected) => {
    expect(base64UrlEncode(input)).toBe(expected);
  });

  it('uses url-safe alphabet without padding', () => {
    // 标准 base64 分别是 "+//+" 与 "/w=="
    expect(base64UrlEncode('\xfb\xff\xfe')).toBe('-__-');
    expect(base64UrlEncode('\xff')).toBe('_w');
  });
});

describe('base64UrlDecode', () => {
  it.each(ENCODE_CASES)('round trips: %s', (_, input) => {
    expect(base64UrlDecode(base64UrlEncode(input))).toBe(input);
  });

  it.each([
    ['YQ', 'a'],
    ['YWI', 'ab'],
    ['YWJj', 'abc'],
    ['-__-', 'ûÿþ'],
    ['', ''],
  ])('decodes %j', (input, expected) => {
    expect(base64UrlDecode(input)).toBe(expected);
  });

  it.each([
    ['padding', 'YQ=='],
    ['standard alphabet chars', 'a+b/'],
    ['length remainder 1', 'Y'],
  ])('returns undefined for %s', (_, input) => {
    expect(base64UrlDecode(input)).toBeUndefined();
  });
});
