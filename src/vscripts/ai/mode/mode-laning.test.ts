import { ModeLaning } from './mode-laning';
import { ModeEnum } from './mode-enum';

function makeHeroAI(opts: {
  level?: number;
  pushLevel?: number;
  enemyHeroes?: Array<{ GetHealthPercent: () => number }>;
}): any {
  const { level = 5, pushLevel = 10, enemyHeroes = [] } = opts;
  return {
    mode: ModeEnum.LANING,
    PushLevel: pushLevel,
    aroundEnemyHeroes: enemyHeroes,
    GetHero: () => ({ GetLevel: () => level }),
  };
}

describe('ModeLaning.GetDesire', () => {
  let laning: ModeLaning;

  beforeEach(() => {
    laning = new ModeLaning();
  });

  describe('base desire', () => {
    it('returns 0.55 when hero is below push level', () => {
      expect(laning.GetDesire(makeHeroAI({ level: 9, pushLevel: 10 }))).toBeCloseTo(0.55);
    });

    it('returns 0 when hero has reached push level', () => {
      expect(laning.GetDesire(makeHeroAI({ level: 10, pushLevel: 10 }))).toBeCloseTo(0);
    });

    it('returns 0 when hero is well above push level', () => {
      expect(laning.GetDesire(makeHeroAI({ level: 25, pushLevel: 10 }))).toBeCloseTo(0);
    });

    it('is capped at 0.7', () => {
      // Base is already 0.55, well within cap
      expect(laning.GetDesire(makeHeroAI({ level: 1, pushLevel: 10 }))).toBeLessThanOrEqual(0.7);
    });
  });

  describe('laning is a fallback mode — intentionally below attack/retreat thresholds', () => {
    it('stays below FSA threshold (0.5) when hero is at or above push level', () => {
      expect(laning.GetDesire(makeHeroAI({ level: 10, pushLevel: 10 }))).toBeLessThan(0.5);
    });

    it('stays above FSA threshold (0.5) when hero is below push level', () => {
      expect(laning.GetDesire(makeHeroAI({ level: 5, pushLevel: 10 }))).toBeGreaterThan(0.5);
    });
  });
});
