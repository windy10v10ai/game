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

import { PlayerGamePresetApi } from './player-setting';

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
