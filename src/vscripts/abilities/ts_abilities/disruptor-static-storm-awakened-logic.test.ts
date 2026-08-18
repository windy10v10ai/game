import {
  calculateGravitySpeed,
  calculateStormDps,
  calculateTickDamage,
  selectNearestSource,
  DISRUPTOR_STATIC_STORM_AWAKENED_ABILITY_VALUES,
} from './disruptor-static-storm-awakened-logic';

describe('disruptor static storm awakened pure logic', () => {
  test('exports the authoritative runtime KV key contract', () => {
    expect(DISRUPTOR_STATIC_STORM_AWAKENED_ABILITY_VALUES).toEqual([
      'duration',
      'radius',
      'damage_interval',
      'base_damage_start_pct',
      'damage_max',
      'max_health_damage_start_pct',
      'max_health_damage_end_pct',
      'gravity_radius_multiplier',
      'gravity_dead_zone',
      'gravity_start_speed',
      'gravity_end_speed',
      'gravity_max_speed',
    ]);
  });
  test('interpolates storm dps and tick damage', () => {
    const input = {
      progress: 0,
      baseMaxDps: 300,
      baseStartPct: 25,
      maxHealth: 5000,
      healthPctStart: 0.4,
      healthPctEnd: 1,
    };
    expect(calculateStormDps(input)).toBeCloseTo(95);
    expect(calculateStormDps({ ...input, progress: 1 })).toBeCloseTo(350);
    expect(calculateTickDamage(input, 0.1)).toBeCloseTo(9.5);
  });
  test('gravity dead zone, scaling and cap', () => {
    expect(
      calculateGravitySpeed({
        distance: 96,
        radius: 500,
        progress: 0,
        deadZone: 96,
        startSpeed: 100,
        endSpeed: 200,
        maxSpeed: 300,
      }),
    ).toBe(0);
    expect(
      calculateGravitySpeed({
        distance: 296,
        radius: 500,
        progress: 0,
        deadZone: 96,
        startSpeed: 100,
        endSpeed: 200,
        maxSpeed: 300,
      }),
    ).toBeCloseTo(49.505);
    expect(
      calculateGravitySpeed({
        distance: 500,
        radius: 500,
        progress: 1,
        deadZone: 96,
        startSpeed: 500,
        endSpeed: 500,
        maxSpeed: 300,
      }),
    ).toBe(300);
  });
  test('nearest source stable id tie break', () => {
    expect(
      selectNearestSource({ x: 0, y: 0 }, [
        { id: 'zeta', position: { x: 10, y: 0 } },
        { id: 'alpha', position: { x: -10, y: 0 } },
      ])?.id,
    ).toBe('alpha');
  });
});
