import type { GameEndPlayerRequest } from './game-end-proxy';
import { SETTLE_LOG_CHUNK_SIZE, buildSettleLogLines, printSettleLog } from './launcher-settle-log';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let global: any;

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

interface ParsedLine {
  matchKey: string;
  steamId: string;
  seq: number;
  total: number;
  chunk: string;
}

// 与启动器的解析方式一致：按空格切成固定的六段
function parseLine(line: string): ParsedLine {
  const parts = line.split(' ');
  expect(parts.length).toBe(6);
  expect(parts[0] + ' ' + parts[1]).toBe('[WSettle] v1');
  const seqParts = parts[4].split('/');
  return {
    matchKey: parts[2],
    steamId: parts[3],
    seq: Number(seqParts[0]),
    total: Number(seqParts[1]),
    chunk: parts[5],
  };
}

// 汇总行固定五段，与逐人行的六段不冲突
function parseDone(line: string): { matchKey: string; expected: number } {
  const parts = line.split(' ');
  expect(parts.length).toBe(5);
  expect(parts.slice(0, 3).join(' ')).toBe('[WSettle] done v1');
  return { matchKey: parts[3], expected: Number(parts[4]) };
}

// 测试数据都是 ASCII，一个字节就是一个字符
function base64UrlDecode(encoded: string): string {
  let bits = 0;
  let bitCount = 0;
  let result = '';
  for (let i = 0; i < encoded.length; i++) {
    bits = bits * 64 + ALPHABET.indexOf(encoded.charAt(i));
    bitCount += 6;
    if (bitCount >= 8) {
      bitCount -= 8;
      const divisor = Math.pow(2, bitCount);
      result += String.fromCharCode(Math.floor(bits / divisor));
      bits = bits % divisor;
    }
  }
  return result;
}

function decode(lines: string[]): string {
  return base64UrlDecode(lines.map((line) => parseLine(line).chunk).join(''));
}

describe('buildSettleLogLines', () => {
  it('writes a single line for a small request', () => {
    const lines = buildSettleLogLines('111-222', 12345, '{"a":1}');
    expect(lines).toHaveLength(1);
    const parsed = parseLine(lines[0]);
    expect([parsed.matchKey, parsed.steamId, parsed.seq, parsed.total]).toEqual([
      '111-222',
      '12345',
      1,
      1,
    ]);
    expect(decode(lines)).toBe('{"a":1}');
  });

  it('splits a long request into ordered chunks that join back to the original', () => {
    const body = JSON.stringify({ items: 'x'.repeat(SETTLE_LOG_CHUNK_SIZE * 2) });
    const lines = buildSettleLogLines('m', 7, body);
    expect(lines.length).toBeGreaterThan(2);
    lines.forEach((line, index) => {
      const parsed = parseLine(line);
      expect(parsed.seq).toBe(index + 1);
      expect(parsed.total).toBe(lines.length);
      expect(parsed.chunk.length).toBeLessThanOrEqual(SETTLE_LOG_CHUNK_SIZE);
    });
    expect(decode(lines)).toBe(body);
  });
});

describe('printSettleLog', () => {
  const printed: string[] = [];

  beforeEach(() => {
    printed.length = 0;
    global.print = (line: string) => printed.push(line);
    global.json = { encode: (value: unknown) => JSON.stringify(value) };
  });

  function request(steamId: number, customMatchId?: string): GameEndPlayerRequest {
    return {
      matchId: 'm1',
      customMatchId,
      players: [{ steamId, heroName: 'npc_dota_hero_axe' }],
    } as unknown as GameEndPlayerRequest;
  }

  it('prints each failed player once and ends with the summary', () => {
    expect(printSettleLog([request(111, '123-456'), request(222, '123-456')])).toBe(2);
    const playerLines = printed.slice(0, -1);
    expect(playerLines.map((line) => parseLine(line).steamId)).toEqual(['111', '222']);
    expect(playerLines.every((line) => parseLine(line).matchKey === '123-456')).toBe(true);
    expect(JSON.parse(decode([playerLines[0]])).players[0].steamId).toBe(111);
    expect(parseDone(printed[printed.length - 1])).toEqual({ matchKey: '123-456', expected: 2 });
  });

  it('falls back to the engine match id', () => {
    expect(printSettleLog([request(111)])).toBe(1);
    expect(parseDone(printed[1])).toEqual({ matchKey: 'm1', expected: 1 });
  });

  it('prints nothing when no player failed', () => {
    expect(printSettleLog([])).toBe(0);
    expect(printed).toEqual([]);
  });
});
