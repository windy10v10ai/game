// Test helper stubs for Dota global bindings used at module init.
// These are not part of the production implementation.
/* eslint-disable @typescript-eslint/no-explicit-any */
const globalAny = globalThis as any;
if (typeof globalAny.IsInToolsMode === 'undefined') {
  globalAny.IsInToolsMode = () => true;
}
if (typeof globalAny.CustomGameEventManager === 'undefined') {
  globalAny.CustomGameEventManager = {
    RegisterListener: () => 0,
  };
}
if (typeof globalAny.ListenToGameEvent === 'undefined') {
  globalAny.ListenToGameEvent = () => 0;
}
if (typeof globalAny.PlayerResource === 'undefined') {
  globalAny.PlayerResource = {
    GetSteamAccountID: () => 123456,
  };
}

import { ApiClient, HttpMethod } from './api-client';
import { PlayerGamePresetApi, PlayerSettingApi } from './player-setting';

describe('PlayerGamePresetApi', () => {
  describe('RoundPresetNumber', () => {
    it('rounds to one decimal place for non-integers', () => {
      const api = new PlayerGamePresetApi();
      // @ts-expect-error access private for test
      expect(api.RoundPresetNumber(1.2000000476837)).toBe(1.2);
      // @ts-expect-error access private for test
      expect(api.RoundPresetNumber(1.2499999)).toBe(1.2);
      // @ts-expect-error access private for test
      expect(api.RoundPresetNumber(1.25)).toBe(1.3);
    });

    it('preserves integers', () => {
      const api = new PlayerGamePresetApi();
      // @ts-expect-error access private for test
      expect(api.RoundPresetNumber(1)).toBe(1);
      // @ts-expect-error access private for test
      expect(api.RoundPresetNumber(2.0)).toBe(2);
    });
  });
});

describe('PlayerSettingApi', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends inventory slot hotkeys and quick-cast settings', () => {
    const sendSpy = jest.spyOn(ApiClient, 'sendWithRetry').mockImplementation(() => undefined);
    const api = new PlayerSettingApi();

    // @ts-expect-error access private for request contract verification
    api.SendBindAbilityKey({
      PlayerID: 0,
      isRememberAbilityKey: 1,
      activeAbilityKey: 'Q',
      passiveAbilityKey: 'W',
      passiveAbilityKey2: 'E',
      activeAbilityQuickCast: 0,
      passiveAbilityQuickCast: 1,
      passiveAbilityQuickCast2: 0,
      wardObserverKey: 'F',
      wardObserverQuickCast: 1,
      wardSentryKey: 'G',
      wardSentryQuickCast: 0,
      inventorySlot7Key: '7',
      inventorySlot7QuickCast: 1,
      inventorySlot8Key: '8',
      inventorySlot8QuickCast: 0,
      inventorySlot9Key: '9',
      inventorySlot9QuickCast: 1,
    });

    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: HttpMethod.PUT,
        path: '/player/123456/setting',
        body: expect.objectContaining({
          isRememberAbilityKey: true,
          inventorySlot7Key: '7',
          inventorySlot7QuickCast: true,
          inventorySlot8Key: '8',
          inventorySlot8QuickCast: false,
          inventorySlot9Key: '9',
          inventorySlot9QuickCast: true,
        }),
      }),
    );
  });
});
