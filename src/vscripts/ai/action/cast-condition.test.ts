import { CastCoindition, DeepMerge } from './cast-condition';

describe('DeepMerge', () => {
  it('should return the target if source is undefined', () => {
    const target: CastCoindition = { debug: true };
    const result = DeepMerge(target);
    expect(result).toEqual(target);
  });

  it('should merge source into target', () => {
    const target: CastCoindition = { debug: true };
    const source: Partial<CastCoindition> = { debug: false };
    const result = DeepMerge(target, source);
    expect(result).toEqual({ debug: false });
  });

  it('should deeply merge nested objects', () => {
    const target: CastCoindition = {
      target: {
        count: { gte: 1, lte: 5 },
      },
    };
    const source: Partial<CastCoindition> = {
      target: {
        count: { gte: 2 },
      },
    };
    const result = DeepMerge(target, source);
    expect(result).toEqual({
      target: {
        count: { gte: 2, lte: 5 },
      },
    });
  });

  it('should override non-object properties', () => {
    const target: CastCoindition = {
      ability: {
        charges: { gte: 3, lte: 3 },
      },
    };
    const source: Partial<CastCoindition> = {
      ability: {
        charges: { gte: 5 },
      },
    };
    const result = DeepMerge(target, source);
    expect(result).toEqual({
      ability: {
        charges: { gte: 5, lte: 3 },
      },
    });
  });

  it('should keep the rest of the object', () => {
    const target: CastCoindition = {
      ability: {
        charges: { gte: 5 },
      },
    };
    const source: Partial<CastCoindition> = {
      ability: {
        level: {
          gte: 1,
          lte: 3,
        },
      },
    };
    const result = DeepMerge(target, source);
    expect(result).toEqual({
      ability: {
        charges: { gte: 5 },
        level: {
          gte: 1,
          lte: 3,
        },
      },
    });
  });

  it('should handle undefined properties in source', () => {
    const target: CastCoindition = {
      debug: true,
    };
    const source: Partial<CastCoindition> = {
      debug: undefined,
    };
    const result = DeepMerge(target, source);
    expect(result).toEqual({
      debug: true,
    });
  });
});
