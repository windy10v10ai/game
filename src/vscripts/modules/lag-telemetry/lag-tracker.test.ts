import { LagTracker, MAX_SEGMENTS, SEGMENT_DOTA_SEC } from './lag-tracker';

const counts = () => ({ units: 100, modifiers: 900 });

// 每秒推进一次：真实时间 realStep 秒、DOTA 时间 dotaStep 秒
function run(
  tracker: LagTracker,
  clock: { real: number; dota: number },
  seconds: number,
  realStep: number,
  dotaStep: number,
  paused = false,
) {
  for (let i = 0; i < seconds; i++) {
    clock.real += realStep;
    clock.dota += dotaStep;
    tracker.tick(clock.real, clock.dota, paused, counts);
  }
}

describe('LagTracker', () => {
  it('accumulates real time and emits one segment per full segment of dota time', () => {
    const clock = { real: 1000, dota: 0 };
    const tracker = new LagTracker(clock.real);
    run(tracker, clock, SEGMENT_DOTA_SEC * 2 + 30, 1.1, 1);

    expect(tracker.realSec).toBeCloseTo((SEGMENT_DOTA_SEC * 2 + 30) * 1.1);
    expect(tracker.segments).toEqual([
      { ratio: 1.1, units: 100, modifiers: 900 },
      { ratio: 1.1, units: 100, modifiers: 900 },
    ]);
  });

  it('reports about 0.5 when the game runs at double speed', () => {
    const clock = { real: 0, dota: 0 };
    const tracker = new LagTracker(clock.real);
    run(tracker, clock, SEGMENT_DOTA_SEC / 2, 1, 2);

    expect(tracker.segments.map((s) => s.ratio)).toEqual([0.5]);
  });

  it('leaves out real time spent paused', () => {
    const clock = { real: 0, dota: 0 };
    const tracker = new LagTracker(clock.real);
    run(tracker, clock, 100, 1, 1);
    run(tracker, clock, 600, 1, 0, true);
    run(tracker, clock, SEGMENT_DOTA_SEC - 100, 1, 1);

    expect(tracker.realSec).toBeCloseTo(SEGMENT_DOTA_SEC);
    expect(tracker.segments.map((s) => s.ratio)).toEqual([1]);
  });

  it('divides by the dota time actually covered when a tick overshoots the boundary', () => {
    const clock = { real: 0, dota: 0 };
    const tracker = new LagTracker(clock.real);
    run(tracker, clock, 99, 4, 3);
    run(tracker, clock, 2, 4, 3);

    expect(tracker.segments.map((s) => s.ratio)).toEqual([1.333]);
  });

  it('stops adding segments at the cap but keeps counting real time', () => {
    const clock = { real: 0, dota: 0 };
    const tracker = new LagTracker(clock.real);
    run(tracker, clock, SEGMENT_DOTA_SEC * (MAX_SEGMENTS + 2), 1, 1);

    expect(tracker.segments).toHaveLength(MAX_SEGMENTS);
    expect(tracker.realSec).toBeCloseTo(SEGMENT_DOTA_SEC * (MAX_SEGMENTS + 2));
  });

  it('counts units only when a segment closes', () => {
    const clock = { real: 0, dota: 0 };
    const tracker = new LagTracker(clock.real);
    const spy = jest.fn(counts);
    for (let i = 0; i < SEGMENT_DOTA_SEC + 10; i++) {
      clock.real += 1;
      clock.dota += 1;
      tracker.tick(clock.real, clock.dota, false, spy);
    }

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
