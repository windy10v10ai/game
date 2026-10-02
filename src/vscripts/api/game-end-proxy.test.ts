import { GameEndDto, GameEndPlayerDto } from './analytics/dto/game-end-dto';
import { canRetryGameEnd, splitGameEndByPlayer } from './game-end-proxy';

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
