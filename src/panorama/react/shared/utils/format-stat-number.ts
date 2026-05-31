/** 大数缩写：英文 K/M、中文 万/亿，保留约 3 位有效数字并去尾零。负数/非有限数按 0。 */
export function formatStatNumber(value: number | string, isChinese: boolean): string {
  const formatted = formatStatNumberParts(value, isChinese);
  return formatted.value + formatted.unit;
}

export interface FormattedStatNumber {
  value: string;
  unit: string;
}

export function formatStatNumberParts(
  value: number | string,
  isChinese: boolean,
): FormattedStatNumber {
  const numericValue = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return { value: '0', unit: '' };
  }
  if (numericValue < 10000) {
    return { value: addThousandsSeparators(String(numericValue)), unit: '' };
  }

  const unit = isChinese
    ? numericValue >= 1e8
      ? { divisor: 1e8, suffix: '亿' }
      : { divisor: 1e4, suffix: '万' }
    : numericValue >= 1e6
      ? { divisor: 1e6, suffix: 'M' }
      : { divisor: 1e3, suffix: 'K' };

  const scaled = numericValue / unit.divisor;
  return { value: addThousandsSeparators(trimToThreeSignificant(scaled)), unit: unit.suffix };
}

/** 缩放后的数保留约 3 位有效数字（整数部分位数决定小数位），并去掉无意义尾零。 */
function trimToThreeSignificant(n: number): string {
  const intDigits = Math.floor(n).toString().length;
  const decimals = Math.max(0, 3 - intDigits);
  // parseFloat 去尾零且不误伤整数尾零：10.0 → 10、1.20 → 1.2、123 → 123
  return parseFloat(n.toFixed(decimals)).toString();
}

function addThousandsSeparators(text: string): string {
  const [integer, decimal] = text.split('.');
  if (integer.length <= 4) {
    return text;
  }
  const separated = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimal != null ? `${separated}.${decimal}` : separated;
}
