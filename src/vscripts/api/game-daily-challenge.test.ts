jest.mock('./api-client', () => ({
  ApiClient: { sendWithRetry: jest.fn() },
  HttpMethod: { GET: 'GET', POST: 'POST' },
}));

jest.mock('../modules/helper/player-helper', () => ({
  PlayerHelper: { ForEachPlayer: jest.fn() },
}));

jest.mock('./daily-challenge-snapshot', () => ({
  applyDailyChallengeMatchStart: jest.fn(),
  dailyChallengePlayerSnapshotStore: { get: jest.fn(), set: jest.fn(), seed: jest.fn() },
  initializeDailyChallengeMatchContext: jest.fn(),
}));

import { ApiClient } from './api-client';
import {
  applyDailyChallengeMatchStart,
  dailyChallengePlayerSnapshotStore,
} from './daily-challenge-snapshot';
import { Game, parseGameEndDailyChallengeRewardPoints } from './game';
import { PlayerHelper } from '../modules/helper/player-helper';

type GameDailyChallengeTestGlobals = {
  GameRules: { GetDOTATime: jest.Mock; Script_GetMatchID: jest.Mock };
  PlayerResource: { GetSteamAccountID: jest.Mock; GetPlayer: jest.Mock };
  CustomGameEventManager: { Send_ServerToPlayer: jest.Mock };
  CustomNetTables: { GetTableValue: jest.Mock; SetTableValue: jest.Mock };
  json: { decode: (value: string) => unknown };
  print: jest.Mock;
};

const testGlobals = globalThis as unknown as GameDailyChallengeTestGlobals;

describe('Game daily challenge match-start confirmation', () => {
  let gameTime = 0;

  beforeEach(() => {
    gameTime = 0;
    testGlobals.print = jest.fn();
    testGlobals.GameRules = {
      GetDOTATime: jest.fn(() => gameTime),
      Script_GetMatchID: jest.fn(() => 123),
    };
    testGlobals.PlayerResource = {
      GetSteamAccountID: jest.fn(() => 483215844),
      GetPlayer: jest.fn(),
    };
    testGlobals.json = {
      decode: (value: string) => JSON.parse(value),
    };
    (PlayerHelper.ForEachPlayer as jest.Mock).mockImplementation(
      (callback: (playerId: PlayerID) => void) => callback(0 as PlayerID),
    );
    (ApiClient.sendWithRetry as jest.Mock).mockClear();
    (applyDailyChallengeMatchStart as jest.Mock).mockClear();
  });

  it('keeps the GAME_IN_PROGRESS time captured before a delayed HTTP success callback', () => {
    Game.ConfirmDailyChallengeMatchStart();

    expect(ApiClient.sendWithRetry).toHaveBeenCalledTimes(1);
    const request = (ApiClient.sendWithRetry as jest.Mock).mock.calls[0][0];

    gameTime = 60;
    request.successFunc(
      JSON.stringify([
        {
          dayId: '2026-08-05',
          matchStartedAt: '2026-08-05T00:00:00.000Z',
          dailyChallenges: [],
        },
      ]),
    );

    expect(applyDailyChallengeMatchStart).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      0,
      expect.anything(),
    );
    expect(testGlobals.GameRules.GetDOTATime).toHaveBeenCalledTimes(1);
  });
});

describe('Game end daily challenge rewards', () => {
  beforeEach(() => {
    testGlobals.print = jest.fn();
    testGlobals.GameRules = {
      GetDOTATime: jest.fn(),
      Script_GetMatchID: jest.fn(() => 987654321),
    };
    testGlobals.PlayerResource = {
      GetSteamAccountID: jest.fn((playerId: number) => (playerId === 0 ? 483215844 : 765611980)),
      GetPlayer: jest.fn((playerId: number) => (playerId === 0 ? { playerId } : undefined)),
    };
    testGlobals.CustomGameEventManager = {
      Send_ServerToPlayer: jest.fn(),
    };
    testGlobals.CustomNetTables = {
      GetTableValue: jest.fn((_table: string, key: string) =>
        key === '0'
          ? {
              steamId: '483215844',
              points: 25,
              pointModifier: 0,
              conductPoint: 100,
            }
          : undefined,
      ),
      SetTableValue: jest.fn(),
    };
    testGlobals.json = {
      decode: (value: string) => JSON.parse(value),
    };
    (PlayerHelper.ForEachPlayer as jest.Mock).mockImplementation(
      (callback: (playerId: PlayerID) => void) => {
        callback(0 as PlayerID);
        callback(1 as PlayerID);
      },
    );
    (ApiClient.sendWithRetry as jest.Mock).mockClear();
    (dailyChallengePlayerSnapshotStore.set as jest.Mock).mockReset().mockReturnValue(true);
    (dailyChallengePlayerSnapshotStore.get as jest.Mock).mockReset();
  });

  it('parses and deduplicates newly granted personal rewards by assignment', () => {
    const points = parseGameEndDailyChallengeRewardPoints(
      JSON.stringify([
        {
          result: 'OK',
          dailyChallengeRewards: [
            {
              steamId: 483215844,
              source: 'personal',
              seasonPoint: 100,
              dayId: '2026-08-04',
              assignmentId: 'assignment-1',
            },
            {
              steamId: 483215844,
              source: 'personal',
              seasonPoint: 100,
              dayId: '2026-08-04',
              assignmentId: 'assignment-1',
            },
            {
              steamId: 483215844,
              source: 'global',
              seasonPoint: 999,
              dayId: '2026-08-04',
              assignmentId: 'global-1',
            },
          ],
        },
      ]),
    );

    expect(points.get(483215844)).toBe(100);
    expect(points.size).toBe(1);
  });

  it.each([JSON.stringify(['OK']), 'not-json', JSON.stringify([{ result: 'OK' }])])(
    'keeps old or malformed game-end responses harmless: %s',
    (response) => {
      expect(parseGameEndDailyChallengeRewardPoints(response).size).toBe(0);
    },
  );

  it('stores and privately publishes the latest post-game challenge snapshot', () => {
    const snapshot = {
      schemaVersion: 2,
      steamId: 483215844,
      dayId: '2026-08-04',
      updatedAt: '2026-08-04T03:00:00.000Z',
      currentRound: 2,
    };
    Game.EndGame({} as never);
    const request = (ApiClient.sendWithRetry as jest.Mock).mock.calls[0][0];

    request.successFunc(JSON.stringify([{ result: 'OK', dailyChallenges: [snapshot] }]));

    expect(dailyChallengePlayerSnapshotStore.set).toHaveBeenCalledWith('483215844', snapshot);
    expect(testGlobals.CustomGameEventManager.Send_ServerToPlayer).toHaveBeenCalledWith(
      { playerId: 0 },
      'daily_challenge_action_result',
      expect.objectContaining({
        action: 'snapshot',
        requestId: 'game-end-987654321-483215844',
        success: true,
        code: 'game_end_synced',
        snapshot,
      }),
    );
  });

  it('publishes the current cached snapshot instead of a stale rejected game-end snapshot', () => {
    const staleSnapshot = {
      schemaVersion: 2,
      steamId: 483215844,
      dayId: '2026-08-04',
      updatedAt: '2026-08-04T02:00:00.000Z',
      currentRound: 1,
    };
    const currentSnapshot = {
      ...staleSnapshot,
      updatedAt: '2026-08-04T03:00:00.000Z',
      currentRound: 2,
    };
    (dailyChallengePlayerSnapshotStore.set as jest.Mock).mockReturnValue(false);
    (dailyChallengePlayerSnapshotStore.get as jest.Mock).mockReturnValue(currentSnapshot);
    Game.EndGame({} as never);
    const request = (ApiClient.sendWithRetry as jest.Mock).mock.calls[0][0];

    request.successFunc(JSON.stringify([{ result: 'OK', dailyChallenges: [staleSnapshot] }]));

    expect(testGlobals.CustomGameEventManager.Send_ServerToPlayer).toHaveBeenCalledWith(
      { playerId: 0 },
      'daily_challenge_action_result',
      expect.objectContaining({ snapshot: currentSnapshot }),
    );
    expect(testGlobals.CustomGameEventManager.Send_ServerToPlayer).not.toHaveBeenCalledWith(
      expect.anything(),
      'daily_challenge_action_result',
      expect.objectContaining({ snapshot: staleSnapshot }),
    );
  });

  it('updates the existing player stats with challenge points and total season points', () => {
    Game.EndGame({} as never);
    const request = (ApiClient.sendWithRetry as jest.Mock).mock.calls[0][0];

    request.successFunc(
      JSON.stringify([
        {
          result: 'OK',
          dailyChallengeRewards: [
            {
              steamId: 483215844,
              source: 'personal',
              seasonPoint: 100,
              dayId: '2026-08-04',
              assignmentId: 'assignment-1',
            },
          ],
        },
      ]),
    );

    expect(testGlobals.CustomNetTables.SetTableValue).toHaveBeenCalledWith(
      'player_stats',
      '0',
      expect.objectContaining({
        points: 25,
        dailyChallengePoints: 100,
        totalSeasonPoints: 125,
      }),
    );
  });
});
