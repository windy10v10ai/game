/** @noSelfInFile */
/** 实机检查脚本的断言辅助：每项输出一行 `[check] PASS/FAIL`，由 `npm run dota:check` 汇总判定。 */

function format(value: unknown): string {
  return typeof value === 'number' ? `${math.floor(value * 100 + 0.5) / 100}` : `${value}`;
}

/** 比较实际值与预期值，数值可带容差。 */
export function expect(name: string, actual: unknown, expected: unknown, tolerance = 0): boolean {
  const pass =
    typeof actual === 'number' && typeof expected === 'number'
      ? math.abs(actual - expected) <= tolerance
      : actual === expected;
  const suffix = tolerance > 0 ? ` tolerance=${format(tolerance)}` : '';
  print(
    `[check] ${pass ? 'PASS' : 'FAIL'} ${name} actual=${format(actual)} expected=${format(expected)}${suffix}`,
  );
  return pass;
}

/** 所有检查项输出完毕；命令看不到这一行就判失败。 */
export function done(): void {
  print('[check] DONE');
}
