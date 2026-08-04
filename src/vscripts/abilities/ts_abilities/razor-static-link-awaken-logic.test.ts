import {
  calculateRazorStaticLinkTransfer,
  RazorStaticLinkAwakenLedger,
  resolveRazorStaticLinkAwakenLevel,
} from './razor-static-link-awaken-logic';

describe('resolveRazorStaticLinkAwakenLevel', () => {
  it('does not activate before Static Link is learned', () => {
    expect(resolveRazorStaticLinkAwakenLevel(0, 5)).toBeUndefined();
  });

  it('follows Static Link level up to the awakened ability maximum', () => {
    expect(resolveRazorStaticLinkAwakenLevel(3, 5)).toBe(3);
    expect(resolveRazorStaticLinkAwakenLevel(6, 5)).toBe(5);
  });
});

describe('calculateRazorStaticLinkTransfer', () => {
  it('uses the same per-damage value for Razor gain cap and target reduction', () => {
    expect(calculateRazorStaticLinkTransfer(2000, 20, 1200)).toEqual({
      selfGain: 20,
      targetReduction: 20,
    });
  });

  it('uses the dedicated target-reduction value exposed by the Static Link tooltip', () => {
    expect(calculateRazorStaticLinkTransfer(2000, 12, 1200, 0, 100, 24)).toEqual({
      selfGain: 12,
      targetReduction: 24,
    });
  });
  it('uses the configured per-instance ladder and total caps', () => {
    const ladder = [
      { perInstance: 12, cap: 200 },
      { perInstance: 24, cap: 400 },
      { perInstance: 36, cap: 800 },
      { perInstance: 48, cap: 1200 },
      { perInstance: 60, cap: 1200 },
    ];

    for (const { perInstance, cap } of ladder) {
      const ledger = new RazorStaticLinkAwakenLedger<number>();
      const hitCount = Math.ceil(cap / perInstance);

      for (let hit = 0; hit < hitCount; hit++) {
        ledger.recordDamage(1, 2000, 0, 15, perInstance, cap);
      }

      expect(ledger.getTargetTotal(1)).toBe(cap);
      expect(ledger.recordDamage(1, 2000, 0, 15, perInstance, cap).targetReduction).toBe(0);
    }
  });

  it('uses the full actual damage for Razor gain when it is below the cap', () => {
    expect(calculateRazorStaticLinkTransfer(12, 20, 200)).toEqual({
      selfGain: 12,
      targetReduction: 20,
    });
  });

  it('keeps the fixed reduction uncapped when the target cap is zero', () => {
    expect(calculateRazorStaticLinkTransfer(5000, 60, 0).targetReduction).toBe(60);
  });

  it('limits a new reduction record to the remaining target cap', () => {
    expect(calculateRazorStaticLinkTransfer(5000, 60, 200, 170).targetReduction).toBe(30);
    expect(calculateRazorStaticLinkTransfer(5000, 60, 200, 200).targetReduction).toBe(0);
  });

  it('stops Razor gain at non-positive target attack damage without stopping target reduction', () => {
    expect(calculateRazorStaticLinkTransfer(5000, 60, 200, 0, 0)).toEqual({
      selfGain: 0,
      targetReduction: 60,
    });
    expect(calculateRazorStaticLinkTransfer(5000, 60, 200, 0, -10)).toEqual({
      selfGain: 0,
      targetReduction: 60,
    });
  });

  it('ignores non-positive actual damage', () => {
    expect(calculateRazorStaticLinkTransfer(0, 20, 200)).toEqual({
      selfGain: 0,
      targetReduction: 0,
    });
    expect(calculateRazorStaticLinkTransfer(-10, 20, 200)).toEqual({
      selfGain: 0,
      targetReduction: 0,
    });
  });
});

describe('RazorStaticLinkAwakenLedger', () => {
  it('adds 200 total self attack damage from ten separate damage instances', () => {
    const ledger = new RazorStaticLinkAwakenLedger<number>();

    for (let targetId = 1; targetId <= 10; targetId++) {
      ledger.recordDamage(targetId, 200, 0, 15, 20, 200);
    }

    expect(ledger.getSelfTotal()).toBe(200);
    for (let targetId = 1; targetId <= 10; targetId++) {
      expect(ledger.getTargetTotal(targetId)).toBe(20);
    }
  });

  it('does not add Razor gain after a target reaches non-positive attack while continuing reduction', () => {
    const ledger = new RazorStaticLinkAwakenLedger<number>();

    ledger.recordDamage(7, 100, 0, 15, 60, 1200, 10);
    ledger.recordDamage(7, 100, 1, 15, 60, 1200, 0);
    ledger.recordDamage(7, 100, 2, 15, 60, 1200, -5);

    expect(ledger.getSelfTotal()).toBe(60);
    expect(ledger.getTargetTotal(7)).toBe(180);
  });

  it('expires each damage record on its own timeline without refreshing older records', () => {
    const ledger = new RazorStaticLinkAwakenLedger<number>();
    ledger.recordDamage(7, 100, 0, 15, 60, 1200);
    ledger.recordDamage(7, 50, 5, 15, 60, 1200);

    ledger.expire(15);
    expect(ledger.getSelfTotal()).toBe(50);
    expect(ledger.getTargetTotal(7)).toBe(60);

    ledger.expire(20);
    expect(ledger.getSelfTotal()).toBe(0);
    expect(ledger.getTargetTotal(7)).toBe(0);
    expect(ledger.hasRecords()).toBe(false);
  });

  it('allows a one-second scan to remove records on the first scan after expiry', () => {
    const ledger = new RazorStaticLinkAwakenLedger<number>();
    ledger.recordDamage(1, 100, 0.25, 15, 60, 1200);

    expect(ledger.getSelfTotal()).toBe(60);
    ledger.expire(16);
    expect(ledger.getSelfTotal()).toBe(0);
    expect(ledger.getTargetTotal(1)).toBe(0);
  });

  it('keeps multiple targets independent', () => {
    const ledger = new RazorStaticLinkAwakenLedger<number>();
    ledger.recordDamage(1, 100, 0, 15, 24, 200);
    ledger.recordDamage(2, 300, 5, 15, 48, 800);

    ledger.expire(14);
    expect(ledger.getTargetTotal(1)).toBe(24);
    expect(ledger.getTargetTotal(2)).toBe(48);
    expect(ledger.getSelfTotal()).toBe(72);
  });

  it('keeps different Razor sources independent for the same target', () => {
    const firstRazor = new RazorStaticLinkAwakenLedger<number>();
    const secondRazor = new RazorStaticLinkAwakenLedger<number>();

    firstRazor.recordDamage(9, 100, 0, 15, 24, 200);
    secondRazor.recordDamage(9, 300, 0, 15, 60, 1200);

    expect(firstRazor.getTargetTotal(9)).toBe(24);
    expect(secondRazor.getTargetTotal(9)).toBe(60);
    expect(firstRazor.getSelfTotal()).toBe(24);
    expect(secondRazor.getSelfTotal()).toBe(60);
  });

  it('stops adding target reduction at the configured total cap while keeping self records', () => {
    const ledger = new RazorStaticLinkAwakenLedger<number>();

    ledger.recordDamage(1, 100, 0, 15, 60, 120);
    ledger.recordDamage(1, 100, 1, 15, 60, 120);

    expect(ledger.getTargetTotal(1)).toBe(120);
    expect(ledger.getSelfTotal()).toBe(120);
  });

  it('removes an invalid target ledger without removing Razor self records', () => {
    const ledger = new RazorStaticLinkAwakenLedger<number>();
    ledger.recordDamage(3, 100, 0, 15, 24, 200);
    ledger.recordDamage(4, 200, 0, 15, 48, 800);

    ledger.removeTarget(3);

    expect(ledger.getTargetTotal(3)).toBe(0);
    expect(ledger.getTargetTotal(4)).toBe(48);
    expect(ledger.getSelfTotal()).toBe(72);
    expect(ledger.getActiveTargetIds()).toEqual([4]);
  });

  it('clears all records when the controller is destroyed', () => {
    const ledger = new RazorStaticLinkAwakenLedger<number>();
    ledger.recordDamage(1, 100, 0, 15, 24, 200);

    ledger.clear();

    expect(ledger.getSelfTotal()).toBe(0);
    expect(ledger.getActiveTargetIds()).toEqual([]);
    expect(ledger.hasRecords()).toBe(false);
  });
});
