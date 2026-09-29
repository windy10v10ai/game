import { decideStance, EngagementInput } from './engagement';

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
