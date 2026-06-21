/* eslint-disable @typescript-eslint/no-explicit-any */
const mockIsHumanPlayer = jest.fn();
jest.mock('./player-helper', () => ({
  PlayerHelper: {
    IsHumanPlayer: (hero: any) => mockIsHumanPlayer(hero),
  },
}));

const mockGetAwakenedHeroes = jest.fn();
jest.mock('../../api/player', () => ({
  Player: {
    GetAwakenedHeroes: (steamId: number) => mockGetAwakenedHeroes(steamId),
  },
}));

const mockApplyAwakenByHero = jest.fn();
jest.mock('../awaken/awaken-replacer', () => ({
  applyAwakenByHero: (hero: any) => mockApplyAwakenByHero(hero),
}));

import { AwakenHelper } from './awaken-helper';

const mockHero = {
  GetUnitName: jest.fn(() => 'npc_dota_hero_axe'),
};
const steamAccountId = 12345;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AwakenHelper.ApplyUnlockedAwaken', () => {
  it('非真人玩家直接跳过', () => {
    mockIsHumanPlayer.mockReturnValue(false);

    AwakenHelper.ApplyUnlockedAwaken(mockHero as any, steamAccountId);

    expect(mockApplyAwakenByHero).not.toHaveBeenCalled();
  });

  it('未解锁当前英雄时跳过', () => {
    mockIsHumanPlayer.mockReturnValue(true);
    mockGetAwakenedHeroes.mockReturnValue([{ heroName: 'npc_dota_hero_pudge' }]);

    AwakenHelper.ApplyUnlockedAwaken(mockHero as any, steamAccountId);

    expect(mockApplyAwakenByHero).not.toHaveBeenCalled();
  });

  it('已解锁当前英雄时调用 applyAwakenByHero', () => {
    mockIsHumanPlayer.mockReturnValue(true);
    mockGetAwakenedHeroes.mockReturnValue([{ heroName: 'npc_dota_hero_axe' }]);

    AwakenHelper.ApplyUnlockedAwaken(mockHero as any, steamAccountId);

    expect(mockApplyAwakenByHero).toHaveBeenCalledTimes(1);
    expect(mockApplyAwakenByHero).toHaveBeenCalledWith(mockHero);
  });
});
