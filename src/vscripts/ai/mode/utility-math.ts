export class UtilityMath {
  static Linear(val: number, min: number, max: number): number {
    if (max === min) return 0;
    return Math.max(0, Math.min(1, (val - min) / (max - min)));
  }

  static Quadratic(val: number, min: number, max: number): number {
    const linear = UtilityMath.Linear(val, min, max);
    return linear * linear;
  }

  static Logistic(val: number, midpoint: number, steepness: number): number {
    return 1 / (1 + Math.exp(-steepness * (val - midpoint)));
  }
}
