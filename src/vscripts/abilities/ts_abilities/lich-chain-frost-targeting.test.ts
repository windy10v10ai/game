import {
  ChainFrostTargetCandidate,
  selectChainFrostNextTarget,
} from './lich-chain-frost-targeting';

function candidate(
  id: number,
  distance: number,
  kind: 'hero' | 'illusion' | 'spire' | 'ordinary',
  current = false,
  valid = true,
): ChainFrostTargetCandidate {
  return {
    id,
    distance,
    current,
    valid,
    realHero: kind === 'hero',
    illusion: kind === 'illusion',
    iceSpire: kind === 'spire',
    ordinary: kind === 'ordinary' || kind === 'illusion',
  };
}

describe('selectChainFrostNextTarget', () => {
  it('chooses another real hero instead of closer ordinary units when two heroes are reachable', () => {
    const result = selectChainFrostNextTarget([
      candidate(1, 0, 'hero', true),
      candidate(2, 500, 'hero'),
      candidate(3, 100, 'ordinary'),
      candidate(4, 200, 'ordinary'),
    ]);

    expect(result?.id).toBe(2);
  });

  it('keeps a two-hero chain bouncing back to the previous hero', () => {
    const result = selectChainFrostNextTarget([
      candidate(1, 400, 'hero'),
      candidate(2, 0, 'hero', true),
      candidate(3, 50, 'ordinary'),
    ]);

    expect(result?.id).toBe(1);
  });

  it('chooses Ice Spire over ordinary units when only one real hero is reachable', () => {
    const result = selectChainFrostNextTarget([
      candidate(1, 0, 'hero', true),
      candidate(2, 600, 'spire'),
      candidate(3, 50, 'ordinary'),
    ]);

    expect(result?.id).toBe(2);
  });

  it('returns from Ice Spire to the single real hero', () => {
    const result = selectChainFrostNextTarget([
      candidate(1, 450, 'hero'),
      candidate(2, 0, 'spire', true),
      candidate(3, 50, 'ordinary'),
    ]);

    expect(result?.id).toBe(1);
  });

  it('allows ordinary units after the only real hero when no Ice Spire exists', () => {
    const result = selectChainFrostNextTarget([
      candidate(1, 0, 'hero', true),
      candidate(2, 300, 'ordinary'),
      candidate(3, 100, 'ordinary'),
    ]);

    expect(result?.id).toBe(3);
  });

  it('returns from an ordinary unit to the single reachable real hero', () => {
    const result = selectChainFrostNextTarget([
      candidate(1, 300, 'hero'),
      candidate(2, 0, 'ordinary', true),
      candidate(3, 100, 'ordinary'),
    ]);

    expect(result?.id).toBe(1);
  });

  it('uses ordinary units when no real hero is reachable', () => {
    const result = selectChainFrostNextTarget([
      candidate(1, 0, 'ordinary', true),
      candidate(2, 300, 'ordinary'),
      candidate(3, 100, 'ordinary'),
      candidate(4, 50, 'spire'),
    ]);

    expect(result?.id).toBe(3);
  });

  it('ignores illusions for hero-count priority and never selects invalid/current candidates', () => {
    const result = selectChainFrostNextTarget([
      candidate(1, 0, 'hero', true),
      candidate(2, 25, 'hero', false, false),
      candidate(3, 50, 'illusion'),
      candidate(4, 100, 'ordinary'),
    ]);

    expect(result?.id).toBe(3);
  });
});
