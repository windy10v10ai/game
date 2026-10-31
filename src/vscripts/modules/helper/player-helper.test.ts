const mockGetStuns = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).PlayerResource = { GetStuns: mockGetStuns };

import { PlayerHelper } from './player-helper';

describe('PlayerHelper.GetStuns', () => {
  it('does not decrease when the engine value drops', () => {
    const playerId = 0 as PlayerID;
    mockGetStuns.mockReturnValueOnce(10).mockReturnValueOnce(6).mockReturnValueOnce(12);

    expect(PlayerHelper.GetStuns(playerId)).toBe(10);
    expect(PlayerHelper.GetStuns(playerId)).toBe(10);
    expect(PlayerHelper.GetStuns(playerId)).toBe(12);
  });

  it('tracks each player separately', () => {
    mockGetStuns.mockReturnValueOnce(20).mockReturnValueOnce(3);

    expect(PlayerHelper.GetStuns(1 as PlayerID)).toBe(20);
    expect(PlayerHelper.GetStuns(2 as PlayerID)).toBe(3);
  });
});
