/** 大数缩写：英文 K/M、中文 万/亿，保留约 3 位有效数字并去尾零。负数/非有限数按 0。 */
export function formatStatNumber(value: number, isChinese: boolean): string {
  if (!Number.isFinite(value) || value < 0) {
    return '0';
  }
  if (value < 10000) {
    return String(value);
  }

  const unit = isChinese
    ? value >= 1e8
      ? { divisor: 1e8, suffix: '亿' }
      : { divisor: 1e4, suffix: '万' }
    : value >= 1e6
      ? { divisor: 1e6, suffix: 'M' }
      : { divisor: 1e4, suffix: 'K' };

  const scaled = value / unit.divisor;
  return trimToThreeSignificant(scaled) + unit.suffix;
}

/** 缩放后的数保留约 3 位有效数字（整数部分位数决定小数位），并去掉无意义尾零。 */
function trimToThreeSignificant(n: number): string {
  const intDigits = Math.floor(n).toString().length;
  const decimals = Math.max(0, 3 - intDigits);
  const fixed = n.toFixed(decimals);
  // 去尾零与多余小数点：12.0 → 12，1.20 → 1.2
  return fixed.replace(/\.?0+$/, '');
}
