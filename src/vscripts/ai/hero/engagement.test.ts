import { decideStance, EngagementInput, matchesStance } from './engagement';

const input = (overrides: Partial<EngagementInput>): EngagementInput => ({
  engaged: true,
  ourPower: 100,
  enemyPower: 1000,
  canEscape: true,
  survivalSeconds: 10,
  wasAvoiding: false,
  joining: false,
  holdGround: false,
  ...overrides,
});

describe('decideStance', () => {
  it('retreats from a hopeless fight elsewhere', () => {
    expect(decideStance(input({}))).toBe('retreat');
    expect(decideStance(input({ engaged: false }))).toBe('hold');
  });

  it('holds the base against a stronger enemy until about to die', () => {
    expect(decideStance(input({ holdGround: true }))).toBe('fight');
    expect(decideStance(input({ holdGround: true, engaged: false }))).toBe('fight');
    expect(decideStance(input({ holdGround: true, wasAvoiding: true }))).toBe('fight');
    expect(decideStance(input({ holdGround: true, survivalSeconds: 1 }))).toBe('retreat');
  });
});

describe('matchesStance', () => {
  it('uses engage skills only when fighting and escape skills only when leaving', () => {
    expect(matchesStance('fight', 'fight')).toBe(true);
    expect(matchesStance('fight', 'retreat')).toBe(false);
    expect(matchesStance('fight', 'hold')).toBe(false);
    expect(matchesStance('retreat', 'retreat')).toBe(true);
    expect(matchesStance('retreat', 'fight')).toBe(false);
    expect(matchesStance('retreat', 'task')).toBe(false);
  });

  it('allows both when cornered', () => {
    expect(matchesStance('fight', 'lastStand')).toBe(true);
    expect(matchesStance('retreat', 'lastStand')).toBe(true);
  });
});
