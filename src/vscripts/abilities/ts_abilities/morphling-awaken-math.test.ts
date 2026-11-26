import { calculateBorrowedAgility } from './morphling-awaken-math';

describe('calculateBorrowedAgility', () => {
  it('takes the percentage of all three attributes', () => {
    expect(calculateBorrowedAgility(100, 200, 100, 0, 15)).toBeCloseTo(60);
  });

  it('excludes agility the target only holds on loan', () => {
    expect(calculateBorrowedAgility(100, 200, 100, 50, 10)).toBeCloseTo(35);
  });
});
