// 加权候选池抽取工具：供 bot 物品构建的随机化与 tome 场景复用
export type CandidatePoolEntry = string | { item: string; weight?: number };

export function ResolveCandidateEntry(entry: CandidatePoolEntry): { item: string; weight: number } {
  if (typeof entry === 'string') {
    return { item: entry, weight: 1 };
  }
  return { item: entry.item, weight: entry.weight ?? 1 };
}

export function PickWeightedOne(weights: Record<string, number>): string | undefined {
  const keys = Object.keys(weights);
  if (keys.length === 0) return undefined;

  const totalWeight = keys.reduce((sum, key) => sum + weights[key], 0);
  let random = RandomFloat(0, totalWeight);

  for (const key of keys) {
    random -= weights[key];
    if (random <= 0) {
      return key;
    }
  }

  return keys[0];
}

export function SampleWeightedWithoutReplacement(
  pool: CandidatePoolEntry[],
  count: number,
): string[] {
  const remaining = pool.map(ResolveCandidateEntry);
  const result: string[] = [];

  while (result.length < count && remaining.length > 0) {
    const weights: Record<string, number> = {};
    remaining.forEach((entry, index) => {
      weights[index.toString()] = entry.weight;
    });

    const pickedIndexKey = PickWeightedOne(weights);
    if (pickedIndexKey === undefined) break;

    const pickedIndex = Number(pickedIndexKey);
    result.push(remaining[pickedIndex].item);
    remaining.splice(pickedIndex, 1);
  }

  return result;
}
