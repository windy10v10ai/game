import { arcSlots, FormationMember, lineSlots } from './formation';
import { distance, Point } from './lane-geometry';

const member = (id: number, x: number, y: number, melee: boolean): FormationMember => ({
  id,
  pos: { x, y },
  melee,
});

const minGap = (slots: Map<number, Point>) => {
  const points = [...slots.values()];
  let gap = Infinity;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      gap = Math.min(gap, distance(points[i], points[j]));
    }
  }
  return gap;
};

describe('formation', () => {
  const members = [
    member(1, 0, 0, true),
    member(2, 0, 0, false),
    member(3, 0, 0, true),
    member(4, 0, 0, false),
    member(5, 0, 0, false),
  ];

  it('lines up across the enemy direction with melee in front and spacing kept', () => {
    const slots = lineSlots({ x: 0, y: 0 }, { x: 1, y: 0 }, members, 350);
    expect(slots.size).toBe(5);
    expect(minGap(slots)).toBeGreaterThanOrEqual(349);
    // 敌人在 +x 方向，近战那一排比远程更靠前
    expect(slots.get(1)!.x).toBeGreaterThan(slots.get(2)!.x);
    expect(slots.get(3)!.x).toBeGreaterThan(slots.get(4)!.x);
  });

  it('keeps each bot on the side it is already standing', () => {
    const spread = [member(1, 0, 1000, false), member(2, 0, -1000, false)];
    const slots = lineSlots({ x: 0, y: 0 }, { x: 1, y: 0 }, spread, 350);
    expect(slots.get(1)!.y).toBeGreaterThan(slots.get(2)!.y);
  });

  it('spreads fighters on an arc on our side with ranged on the wings', () => {
    const slots = arcSlots({ x: 0, y: 0 }, { x: -1, y: 0 }, members, 600, 350);
    expect(minGap(slots)).toBeGreaterThanOrEqual(349);
    for (const slot of slots.values()) {
      expect(slot.x).toBeLessThan(1);
    }
    // 近战在正面，离正面方向的角度比远程小
    const wing = (id: number) => Math.abs(slots.get(id)!.y);
    expect(Math.max(wing(1), wing(3))).toBeLessThan(Math.max(wing(2), wing(4), wing(5)));
  });
});
