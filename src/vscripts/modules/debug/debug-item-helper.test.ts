const mockForEachPlayer = jest.fn();

jest.mock('../helper/player-helper', () => ({
  PlayerHelper: {
    ForEachPlayer: (...args: unknown[]) => mockForEachPlayer(...args),
  },
}));

import { CMD } from './debug-cmd';
import { handleGlobalItemDebugCommand } from './debug-item-helper';

describe('phase axe debug command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the dedicated -phaseaxeall command', () => {
    expect(CMD.ADD_PHASE_AXE_ALL).toBe('-phaseaxeall');
  });

  it('gives item_manta_2 to every selected player hero', () => {
    const firstHero = { AddItemByName: jest.fn() };
    const secondHero = { AddItemByName: jest.fn() };
    const getSelectedHero = jest
      .fn()
      .mockReturnValueOnce(firstHero)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(secondHero);
    (
      globalThis as unknown as { PlayerResource: { GetSelectedHeroEntity: jest.Mock } }
    ).PlayerResource = {
      GetSelectedHeroEntity: getSelectedHero,
    };
    mockForEachPlayer.mockImplementation((callback: (playerId: PlayerID) => void) => {
      callback(0 as PlayerID);
      callback(1 as PlayerID);
      callback(2 as PlayerID);
    });

    handleGlobalItemDebugCommand(CMD.ADD_PHASE_AXE_ALL);

    expect(firstHero.AddItemByName).toHaveBeenCalledWith('item_manta_2');
    expect(secondHero.AddItemByName).toHaveBeenCalledWith('item_manta_2');
    expect(getSelectedHero).toHaveBeenCalledTimes(3);
  });
});
