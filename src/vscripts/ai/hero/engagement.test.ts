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
  teamBacked: false,
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
  it('keeps a fight the team still backs until about to die while the local odds are not hopeless', () => {
    expect(decideStance(input({ teamBacked: true, enemyPower: 500 }))).toBe('fight');
    expect(decideStance(input({ teamBacked: true }))).toBe('retreat');
    expect(decideStance(input({ teamBacked: true, enemyPower: 500, wasAvoiding: true }))).toBe(
      'fight',
    );
    expect(decideStance(input({ teamBacked: true, enemyPower: 500, survivalSeconds: 1 }))).toBe(
      'retreat',
    );
    expect(
      decideStance(
        input({ teamBacked: true, enemyPower: 500, survivalSeconds: 1, canEscape: false }),
      ),
    ).toBe('lastStand');
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
