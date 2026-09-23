import {
  GameStartPayload,
  mergeGameStartResults,
  PerPlayerGameStartResult,
} from './game-start-proxy';
import { PlayerInfoDto, PointInfoDto } from './player';

function gameStart(
  overrides: Partial<GameStartPayload> & { player: Partial<PlayerInfoDto> },
): GameStartPayload {
  return {
    players: [overrides.player as PlayerInfoDto],
    pointInfo: overrides.pointInfo ?? [],
    dailyTasks: overrides.dailyTasks,
    ga4Config: overrides.ga4Config,
  };
}

describe('mergeGameStartResults', () => {
  it('merges game-start and player-info fields for a single player', () => {
    const results: PerPlayerGameStartResult[] = [
      {
        steamId: 111,
        gameStart: gameStart({ player: { id: '111', matchCount: 5, winCount: 2 } }),
        playerInfo: { properties: [{ name: 'strength', level: 2 }] },
      },
    ];

    const merged = mergeGameStartResults(results);

    expect(merged?.players).toEqual([
      { id: '111', matchCount: 5, winCount: 2, properties: [{ name: 'strength', level: 2 }] },
    ]);
  });

  it('treats an empty player-info object (player not found) as success without extra fields', () => {
    const results: PerPlayerGameStartResult[] = [
      {
        steamId: 222,
        gameStart: gameStart({ player: { id: '222', matchCount: 1 } }),
        playerInfo: {},
      },
    ];

    const merged = mergeGameStartResults(results);

    expect(merged?.players).toEqual([{ id: '222', matchCount: 1 }]);
  });

  it('drops a player whose game-start request failed while keeping the rest', () => {
    const results: PerPlayerGameStartResult[] = [
      { steamId: 111, gameStart: undefined, playerInfo: { id: '111' } },
      {
        steamId: 222,
        gameStart: gameStart({ player: { id: '222', matchCount: 3 } }),
        playerInfo: { id: '222' },
      },
    ];

    const merged = mergeGameStartResults(results);

    expect(merged?.players).toEqual([{ id: '222', matchCount: 3 }]);
  });

  it('drops a player whose player-info request failed while keeping the rest', () => {
    const results: PerPlayerGameStartResult[] = [
      {
        steamId: 111,
        gameStart: gameStart({ player: { id: '111', matchCount: 1 } }),
        playerInfo: undefined,
      },
      {
        steamId: 222,
        gameStart: gameStart({ player: { id: '222', matchCount: 3 } }),
        playerInfo: {},
      },
    ];

    const merged = mergeGameStartResults(results);

    expect(merged?.players).toEqual([{ id: '222', matchCount: 3 }]);
  });

  it('returns undefined when every player failed', () => {
    const results: PerPlayerGameStartResult[] = [
      { steamId: 111, gameStart: undefined, playerInfo: undefined },
      { steamId: 222, gameStart: gameStart({ player: { id: '222' } }), playerInfo: undefined },
    ];

    expect(mergeGameStartResults(results)).toBeUndefined();
  });

  it('concats pointInfo and dailyTasks across players and keeps the first ga4Config', () => {
    const pointInfoA: PointInfoDto[] = [{ steamId: 111, title: { cn: 'A', en: 'A' } }];
    const pointInfoB: PointInfoDto[] = [{ steamId: 222, title: { cn: 'B', en: 'B' } }];
    const results: PerPlayerGameStartResult[] = [
      {
        steamId: 111,
        gameStart: gameStart({
          player: { id: '111' },
          pointInfo: pointInfoA,
          dailyTasks: [{ steamId: 111 } as never],
          ga4Config: { measurementId: 'a', apiSecret: 's', serverType: 'WINDY' as never },
        }),
        playerInfo: {},
      },
      {
        steamId: 222,
        gameStart: gameStart({
          player: { id: '222' },
          pointInfo: pointInfoB,
          ga4Config: { measurementId: 'b', apiSecret: 's2', serverType: 'WINDY' as never },
        }),
        playerInfo: {},
      },
    ];

    const merged = mergeGameStartResults(results);

    expect(merged?.pointInfo).toEqual([...pointInfoA, ...pointInfoB]);
    expect(merged?.dailyTasks).toEqual([{ steamId: 111 }]);
    expect(merged?.ga4Config?.measurementId).toBe('a');
  });
});
