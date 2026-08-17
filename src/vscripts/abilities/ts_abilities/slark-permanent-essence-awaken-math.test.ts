import {
  calculateSlarkPermanentAttributeLoss,
  PERMANENT_ATTRIBUTE_LOSS_SCALE,
} from './slark-permanent-essence-awaken-math';

describe('calculateSlarkPermanentAttributeLoss', () => {
  it('converts 50 stolen attributes into 7.5 permanent loss at level 50', () => {
    const loss = calculateSlarkPermanentAttributeLoss(50, 10, 5);

    expect(loss / PERMANENT_ATTRIBUTE_LOSS_SCALE).toBe(7.5);
  });

  it('adds the hero-level-scaled extra loss ratio to the base ratio', () => {
    const levelOneLoss = calculateSlarkPermanentAttributeLoss(20, 10, 0.1);
    const levelHundredLoss = calculateSlarkPermanentAttributeLoss(20, 10, 10);

    expect(levelOneLoss / PERMANENT_ATTRIBUTE_LOSS_SCALE).toBe(2.02);
    expect(levelHundredLoss / PERMANENT_ATTRIBUTE_LOSS_SCALE).toBe(4);
  });

  it('keeps fractional losses without accumulating floating-point drift', () => {
    expect(calculateSlarkPermanentAttributeLoss(1, 10, 0.1)).toBe(101);
  });

  it('never returns a negative permanent loss', () => {
    expect(calculateSlarkPermanentAttributeLoss(-50, 10, 5)).toBe(0);
    expect(calculateSlarkPermanentAttributeLoss(50, -20, 0)).toBe(0);
  });
});
