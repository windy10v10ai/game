const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * 按字节做 base64url 编码，去掉尾部 `=` 填充。
 * Lua 的字符串本来就是字节序列，所以入参里的一个字符就是一个字节，不做 UTF-8 转换。
 * 不用位运算：LuaJIT 的 bit 库在 jest 里不存在，用算术保证两边行为一致。
 */
export function base64UrlEncode(input: string): string {
  const parts: string[] = [];
  for (let i = 0; i < input.length; i += 3) {
    const hasSecond = i + 1 < input.length;
    const hasThird = i + 2 < input.length;
    const n =
      input.charCodeAt(i) * 65536 +
      (hasSecond ? input.charCodeAt(i + 1) : 0) * 256 +
      (hasThird ? input.charCodeAt(i + 2) : 0);

    parts.push(ALPHABET.charAt(Math.floor(n / 262144)));
    parts.push(ALPHABET.charAt(Math.floor(n / 4096) % 64));
    if (hasSecond) parts.push(ALPHABET.charAt(Math.floor(n / 64) % 64));
    if (hasThird) parts.push(ALPHABET.charAt(n % 64));
  }
  return parts.join('');
}

/**
 * base64UrlEncode 的逆运算，返回字节串；含字母表外字符（包括 `=` 填充）或长度非法时返回 undefined。
 */
export function base64UrlDecode(input: string): string | undefined {
  if (input.length % 4 === 1) return undefined;

  const values: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const value = ALPHABET.indexOf(input.charAt(i));
    if (value < 0) return undefined;
    values.push(value);
  }

  const parts: string[] = [];
  for (let i = 0; i < values.length; i += 4) {
    const count = Math.min(4, values.length - i);
    const n =
      values[i] * 262144 +
      (count > 1 ? values[i + 1] : 0) * 4096 +
      (count > 2 ? values[i + 2] : 0) * 64 +
      (count > 3 ? values[i + 3] : 0);

    parts.push(String.fromCharCode(Math.floor(n / 65536)));
    if (count > 2) parts.push(String.fromCharCode(Math.floor(n / 256) % 256));
    if (count > 3) parts.push(String.fromCharCode(n % 256));
  }
  return parts.join('');
}
