import { GameEndDto, GameEndPlayerDto, GamePerfDto } from './analytics/dto/game-end-dto';
import { canRetryGameEnd, splitGameEndByPlayer } from './game-end-proxy';
import { MAX_SEGMENTS } from '../modules/lag-telemetry/lag-tracker';
import { base64UrlEncode } from '../utils/base64url';

function player(steamId: number): GameEndPlayerDto {
  return { steamId, playerId: 3, heroName: 'npc_dota_hero_axe' } as GameEndPlayerDto;
}

describe('splitGameEndByPlayer', () => {
  const gameEnd = {
    matchId: 'm1',
    winnerTeamId: 2,
    players: [player(111), player(0), player(222), player(-1)],
  } as unknown as GameEndDto;

  it('drops bot rows and emits one request per human', () => {
    const requests = splitGameEndByPlayer(gameEnd);
    expect(requests.map((r) => r.players.map((p) => p.steamId))).toEqual([[111], [222]]);
  });

  it('keeps match-level fields and strips playerId', () => {
    const [request] = splitGameEndByPlayer(gameEnd);
    expect(request.matchId).toBe('m1');
    expect(request.winnerTeamId).toBe(2);
    expect(request.players[0]).not.toHaveProperty('playerId');
    expect(request.players[0].heroName).toBe('npc_dota_hero_axe');
  });

  it('sends one single-player request per human in a 10 player game with the same playerCount', () => {
    const players = [1, 2, 3, 4, 5, 6, 7, 8].map(player).concat([player(0), player(0)]);
    const tenPlayers = { matchId: 'm2', playerCount: 8, players } as unknown as GameEndDto;
    const requests = splitGameEndByPlayer(tenPlayers);
    expect(requests).toHaveLength(8);
    expect(requests.every((r) => r.players.length === 1)).toBe(true);
    expect(requests.every((r) => r.playerCount === 8)).toBe(true);
  });

  it('returns nothing when only bots played', () => {
    const botsOnly = { ...gameEnd, players: [player(0)] } as GameEndDto;
    expect(splitGameEndByPlayer(botsOnly)).toEqual([]);
  });
});

describe('splitGameEndByPlayer perf', () => {
  const perf = { host: 'local', realSec: 1, units: 1, modifiers: 1, segments: [] } as GamePerfDto;

  it('attaches perf to the first human request only', () => {
    const gameEnd = {
      perf,
      players: [player(0), player(111), player(222)],
    } as unknown as GameEndDto;
    const requests = splitGameEndByPlayer(gameEnd);
    expect(requests.map((r) => r.perf)).toEqual([perf, undefined]);
  });

  // 代发网址预算见 api/README.md；按最长的名字、写满的分段拼一条最坏情况
  it('keeps the longest single-player request within the relay url budget', () => {
    const name = 'x'.repeat(40);
    const fullPlayer = {
      heroName: 'npc_dota_hero_skywrath_mage',
      steamId: 1234567890,
      teamId: 2,
      isDisconnected: false,
      level: 50,
      totalGoldEarned: 999999,
      kills: 999,
      deaths: 999,
      assists: 999,
      score: 99999,
      battlePoints: 99999,
      heroDamage: 99999999,
      damageTaken: 99999999,
      lastHits: 9999,
      healing: 9999999,
      towerKills: 99,
      stuns: 9999.99,
      roshanKills: 99,
      awaken: 1,
      strength: 9999,
      agility: 9999,
      intellect: 9999,
      items: Array(6).fill(name),
      neutralItem: name,
      neutralPassiveItem: name,
      abilities: Array(3).fill(name),
      dailyTask: { dayId: '20261012', taskId: name, star: 3, seasonPoint: 9999 },
    } as unknown as GameEndPlayerDto;
    const gameEnd = {
      isWin: true,
      matchId: '8123456789012',
      version: 'v4.99',
      difficulty: 6,
      steamId: 0,
      gameOptions: {
        multiplierRadiant: 2.5,
        multiplierDire: 12.5,
        playerNumberRadiant: 10,
        playerNumberDire: 10,
        towerPowerPct: 500,
        respawnTimePct: 100,
      },
      winnerTeamId: 2,
      gameTimeMsec: 7200000,
      dotaTimeMsec: 7200000,
      countryCode: 'CN',
      playerCount: 10,
      players: [fullPlayer],
      perf: {
        host: 'launcher',
        realSec: 8888.8,
        units: 9999,
        modifiers: 99999,
        segments: Array(MAX_SEGMENTS).fill({ ratio: 1.234, units: 9999, modifiers: 99999 }),
      },
    } as GameEndDto;
    // 线路地址、路径、requestId、apiKey 与破缓存参数
    const urlOverhead = 300;
    const [request] = splitGameEndByPlayer(gameEnd);
    const bodyLength = base64UrlEncode(JSON.stringify(request)).length;
    expect(bodyLength + urlOverhead).toBeLessThan(7000);
  });
});

describe('canRetryGameEnd', () => {
  it('retries transport failures until the attempt limit', () => {
    expect(canRetryGameEnd('timeout', 1)).toBe(true);
    expect(canRetryGameEnd('client_timeout', 2)).toBe(true);
    expect(canRetryGameEnd('internal', 2)).toBe(true);
    expect(canRetryGameEnd('timeout', 3)).toBe(false);
  });

  it('does not retry requests the backend rejected', () => {
    expect(canRetryGameEnd('bad_request', 1)).toBe(false);
    expect(canRetryGameEnd('unauthorized', 1)).toBe(false);
    expect(canRetryGameEnd('not_found', 1)).toBe(false);
    expect(canRetryGameEnd('too_long', 1)).toBe(false);
  });
});
