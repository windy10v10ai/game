import { FSA } from './FSA';
import { ModeEnum } from './mode-enum';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let global: any;
global.print = jest.fn(); // Dota Lua global not available in Jest

// Mock all mode classes so FSA can be instantiated without Dota globals
jest.mock('./mode-laning', () => ({
  ModeLaning: jest.fn().mockImplementation(() => ({
    mode: ModeEnum.LANING,
    hysteresisBonus: 0.1,
    GetDesire: jest.fn().mockReturnValue(0),
  })),
}));
jest.mock('./mode-attack', () => ({
  ModeAttack: jest.fn().mockImplementation(() => ({
    mode: ModeEnum.ATTACK,
    hysteresisBonus: 0.1,
    GetDesire: jest.fn().mockReturnValue(0),
  })),
}));
jest.mock('./mode-retreat', () => ({
  ModeRetreat: jest.fn().mockImplementation(() => ({
    mode: ModeEnum.RETREAT,
    hysteresisBonus: 0.1,
    GetDesire: jest.fn().mockReturnValue(0),
  })),
}));
jest.mock('./mode-push', () => ({
  ModePush: jest.fn().mockImplementation(() => ({
    mode: ModeEnum.PUSH,
    hysteresisBonus: 0.1,
    GetDesire: jest.fn().mockReturnValue(0),
  })),
}));

function makeHeroAI(currentMode: ModeEnum): any {
  return {
    mode: currentMode,
    GetHero: () => ({ GetUnitName: () => 'npc_dota_hero_test' }),
  };
}

function setDesires(fsa: FSA, desires: Partial<Record<ModeEnum, number>>): void {
  for (const mode of fsa.ModeList) {
    const desire = desires[mode.mode] ?? 0;
    (mode.GetDesire as jest.Mock).mockReturnValue(desire);
  }
}

describe('FSA.GetMode', () => {
  let fsa: FSA;

  beforeEach(() => {
    fsa = new FSA();
    // Neutralise the micro-jitter so desire comparisons are deterministic.
    // Math.random() = 0.5 → jitter = (0.5 - 0.5) * 0.06 = 0.
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('basic switching', () => {
    it('switches to mode with highest desire above threshold', () => {
      setDesires(fsa, { [ModeEnum.RETREAT]: 0.8 });
      expect(fsa.GetMode(makeHeroAI(ModeEnum.LANING))).toBe(ModeEnum.RETREAT);
    });

    it('stays in current mode when no mode reaches threshold', () => {
      setDesires(fsa, { [ModeEnum.ATTACK]: 0.3, [ModeEnum.PUSH]: 0.2 });
      expect(fsa.GetMode(makeHeroAI(ModeEnum.LANING))).toBe(ModeEnum.LANING);
    });

    it('stays in current mode when all desires are 0', () => {
      setDesires(fsa, {});
      expect(fsa.GetMode(makeHeroAI(ModeEnum.PUSH))).toBe(ModeEnum.PUSH);
    });
  });

  describe('hysteresis', () => {
    it('stays in current mode when hysteresis score beats a slightly higher competing raw desire', () => {
      // Current mode LANING: raw=0.45, score=0.55 (with hysteresis)
      // ATTACK: raw=0.50, score=0.50 (no hysteresis)
      // LANING wins score selection (0.55 > 0.50)
      // maxRawDesire for LANING = 0.45 < 0.5 threshold → returns currentMode (LANING)
      setDesires(fsa, { [ModeEnum.LANING]: 0.45, [ModeEnum.ATTACK]: 0.5 });
      expect(fsa.GetMode(makeHeroAI(ModeEnum.LANING))).toBe(ModeEnum.LANING);
    });

    it('keeps current mode when raw desire + hysteresis beats competing raw desire', () => {
      // Current mode RETREAT: raw=0.45, score=0.55
      // ATTACK: raw=0.50, score=0.50
      // RETREAT score(0.55) > ATTACK score(0.50) → RETREAT wins winner selection
      // But maxRawDesire=0.45 < 0.5 threshold → stays in currentMode (RETREAT)
      setDesires(fsa, { [ModeEnum.RETREAT]: 0.45, [ModeEnum.ATTACK]: 0.5 });
      // ATTACK score=0.50 > RETREAT score=0.55? No, 0.50 < 0.55, so RETREAT wins selection
      // maxRawDesire from RETREAT = 0.45 < 0.5, returns currentMode
      expect(fsa.GetMode(makeHeroAI(ModeEnum.RETREAT))).toBe(ModeEnum.RETREAT);
    });

    it('hysteresis prevents flip-flopping at the boundary', () => {
      // Without hysteresis, 0.51 vs 0.52 would switch every frame
      // With hysteresis: current mode ATTACK raw=0.51 (score=0.61), RETREAT raw=0.52 (score=0.52)
      // ATTACK score wins → stays ATTACK, even though RETREAT has higher raw desire
      setDesires(fsa, { [ModeEnum.ATTACK]: 0.51, [ModeEnum.RETREAT]: 0.52 });
      expect(fsa.GetMode(makeHeroAI(ModeEnum.ATTACK))).toBe(ModeEnum.ATTACK);
    });

    it('does switch when competing mode clearly overcomes hysteresis', () => {
      // ATTACK current: raw=0.4, score=0.5. RETREAT: raw=0.7, score=0.7 → RETREAT wins
      setDesires(fsa, { [ModeEnum.ATTACK]: 0.4, [ModeEnum.RETREAT]: 0.7 });
      expect(fsa.GetMode(makeHeroAI(ModeEnum.ATTACK))).toBe(ModeEnum.RETREAT);
    });
  });

  describe('threshold uses raw desire, not hysteresis-inflated score', () => {
    it('does not activate a mode whose raw desire is below 0.5 even if score is above', () => {
      // Current mode LANING: raw=0.45 → score=0.55, wins selection
      // But maxRawDesire=0.45 < 0.5 → stays in currentMode
      setDesires(fsa, { [ModeEnum.LANING]: 0.45 });
      expect(fsa.GetMode(makeHeroAI(ModeEnum.LANING))).toBe(ModeEnum.LANING);
    });

    it('activates when raw desire is exactly at threshold', () => {
      setDesires(fsa, { [ModeEnum.PUSH]: 0.5 });
      expect(fsa.GetMode(makeHeroAI(ModeEnum.LANING))).toBe(ModeEnum.PUSH);
    });
  });
});
