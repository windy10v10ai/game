import { TeamCommander } from './team-commander';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let global: any;

const RADIANT = 2;
const DIRE = 3;

function resetSingleton(): void {
  (TeamCommander as any).instance = undefined;
}

function makeHeroAI(teamNumber: number): any {
  return {
    GetHero: () => ({
      GetTeamNumber: () => teamNumber,
    }),
  };
}

function setupGlobals(
  players: { id: number; team: number; alive: boolean; visible: boolean }[],
  currentTime = 0,
): void {
  global.GameRules = {
    GetDOTATime: jest.fn().mockReturnValue(currentTime),
  };

  global.PlayerResource = {
    IsValidPlayerID: (id: number) => players.some((p) => p.id === id),
    GetTeam: (id: number) => players.find((p) => p.id === id)?.team ?? -1,
    GetSelectedHeroEntity: (id: number) => {
      const p = players.find((player) => player.id === id);
      if (!p) return undefined;
      return { IsAlive: () => p.alive, GetAbsOrigin: () => ({}) };
    },
  };

  global.IsLocationVisible = jest.fn((team: number, _pos: object) => {
    // Return visibility based on player data for a given team
    // The mock is called per-hero, so we need context. Instead we rely on per-test setup.
    return false;
  });
}

beforeEach(() => {
  resetSingleton();
});

describe('TeamCommander (per-team state)', () => {
  describe('GetEnemyMissingCount', () => {
    it('returns 0 before any update', () => {
      const tc = TeamCommander.getInstance();
      expect(tc.GetEnemyMissingCount(DIRE)).toBe(0);
      expect(tc.GetEnemyMissingCount(RADIANT)).toBe(0);
    });
  });

  describe('UpdateGameState', () => {
    it('does nothing with an empty hero list', () => {
      global.GameRules = { GetDOTATime: jest.fn().mockReturnValue(0) };
      const tc = TeamCommander.getInstance();
      tc.UpdateGameState([]);
      expect(tc.GetEnemyMissingCount(DIRE)).toBe(0);
    });

    it('counts enemies not visible to the calling team', () => {
      const players = [
        { id: 0, team: DIRE, alive: true, visible: true },   // bot — skip (same team)
        { id: 1, team: RADIANT, alive: true, visible: false }, // enemy, NOT visible → missing
        { id: 2, team: RADIANT, alive: true, visible: true },  // enemy, visible → not missing
        { id: 3, team: RADIANT, alive: false, visible: false }, // enemy, dead → skip
      ];
      setupGlobals(players, 0);
      global.IsLocationVisible = jest.fn((_team: number, _pos: object) => {
        // First call: player 1 (not visible), second call: player 2 (visible)
        // We track calls manually
        const callCount = (global.IsLocationVisible as jest.Mock).mock.calls.length;
        return callCount === 2; // 2nd call (player 2) returns true
      });

      const tc = TeamCommander.getInstance();
      tc.UpdateGameState([makeHeroAI(DIRE)]);

      expect(tc.GetEnemyMissingCount(DIRE)).toBe(1);
    });

    it('counts all alive enemies as missing when fully blind', () => {
      const players = [
        { id: 0, team: DIRE, alive: true, visible: true },
        { id: 1, team: RADIANT, alive: true, visible: false },
        { id: 2, team: RADIANT, alive: true, visible: false },
        { id: 3, team: RADIANT, alive: true, visible: false },
      ];
      setupGlobals(players, 0);
      global.IsLocationVisible = jest.fn().mockReturnValue(false);

      const tc = TeamCommander.getInstance();
      tc.UpdateGameState([makeHeroAI(DIRE)]);

      expect(tc.GetEnemyMissingCount(DIRE)).toBe(3);
    });

    it('counts 0 when all enemies are visible', () => {
      const players = [
        { id: 0, team: DIRE, alive: true, visible: true },
        { id: 1, team: RADIANT, alive: true, visible: true },
        { id: 2, team: RADIANT, alive: true, visible: true },
      ];
      setupGlobals(players, 0);
      global.IsLocationVisible = jest.fn().mockReturnValue(true);

      const tc = TeamCommander.getInstance();
      tc.UpdateGameState([makeHeroAI(DIRE)]);

      expect(tc.GetEnemyMissingCount(DIRE)).toBe(0);
    });

    it('respects the 1-second cooldown per team', () => {
      const players = [
        { id: 0, team: DIRE, alive: true, visible: true },
        { id: 1, team: RADIANT, alive: true, visible: false },
      ];
      setupGlobals(players, 0);
      global.IsLocationVisible = jest.fn().mockReturnValue(false);

      const tc = TeamCommander.getInstance();
      tc.UpdateGameState([makeHeroAI(DIRE)]);
      expect(tc.GetEnemyMissingCount(DIRE)).toBe(1);

      // Enemy becomes visible, but cooldown hasn't elapsed
      global.IsLocationVisible = jest.fn().mockReturnValue(true);
      global.GameRules.GetDOTATime = jest.fn().mockReturnValue(0.5);
      tc.UpdateGameState([makeHeroAI(DIRE)]);
      expect(tc.GetEnemyMissingCount(DIRE)).toBe(1); // still stale

      // After cooldown elapses, it updates
      global.GameRules.GetDOTATime = jest.fn().mockReturnValue(1.1);
      tc.UpdateGameState([makeHeroAI(DIRE)]);
      expect(tc.GetEnemyMissingCount(DIRE)).toBe(0);
    });

    it('maintains independent state for each team', () => {
      const players = [
        { id: 0, team: DIRE, alive: true, visible: true },
        { id: 1, team: RADIANT, alive: true, visible: true },
        { id: 2, team: RADIANT, alive: true, visible: false }, // missing from DIRE's view
        { id: 3, team: DIRE, alive: true, visible: false },    // missing from RADIANT's view
      ];
      setupGlobals(players, 0);

      const tc = TeamCommander.getInstance();

      // DIRE team update: checks RADIANT heroes. Player 2 not visible, Player 3 is DIRE (skip)
      global.IsLocationVisible = jest.fn((team: number) => {
        // For DIRE team checking RADIANT heroes: player 1 visible, player 2 not
        const callCount = (global.IsLocationVisible as jest.Mock).mock.calls.length;
        return callCount === 1; // 1st call (player 1) visible, 2nd call (player 2) not
      });
      tc.UpdateGameState([makeHeroAI(DIRE)]);
      expect(tc.GetEnemyMissingCount(DIRE)).toBe(1);

      // RADIANT team update at same time: has its own cooldown
      global.IsLocationVisible = jest.fn().mockReturnValue(false); // all enemies missing from RADIANT's view
      tc.UpdateGameState([makeHeroAI(RADIANT)]);
      expect(tc.GetEnemyMissingCount(RADIANT)).toBe(2); // DIRE heroes: player 0 and player 3

      // Each team has independent count
      expect(tc.GetEnemyMissingCount(DIRE)).toBe(1);
      expect(tc.GetEnemyMissingCount(RADIANT)).toBe(2);
    });

    it('DIRE cooldown does not block RADIANT update', () => {
      setupGlobals([
        { id: 0, team: DIRE, alive: true, visible: true },
        { id: 1, team: RADIANT, alive: true, visible: true },
        { id: 2, team: RADIANT, alive: true, visible: false },
        { id: 3, team: DIRE, alive: true, visible: false },
      ], 0);
      global.IsLocationVisible = jest.fn().mockReturnValue(false);

      const tc = TeamCommander.getInstance();

      // DIRE updates at t=0
      tc.UpdateGameState([makeHeroAI(DIRE)]);
      expect(tc.GetEnemyMissingCount(DIRE)).toBe(2);

      // RADIANT updates at t=0.1 — different team, different cooldown, should go through
      global.GameRules.GetDOTATime = jest.fn().mockReturnValue(0.1);
      global.IsLocationVisible = jest.fn().mockReturnValue(false);
      tc.UpdateGameState([makeHeroAI(RADIANT)]);
      expect(tc.GetEnemyMissingCount(RADIANT)).toBe(2);
    });
  });
});
