/** 物品栏整理：备用栏物品补进主物品栏空位，主物品栏按施放档位排序。 */

// Lua 数组不能存 nil，空格用一个比所有档位都大的数表示
export const EMPTY_SLOT = 99;

/**
 * 按档位把主物品栏排好序需要的交换步骤，档位相同的保持原顺序。
 * 空格传 EMPTY_SLOT，排在最后。
 */
export function planSlotSwaps(priorities: number[]): [number, number][] {
  const order = [...priorities];
  const swaps: [number, number][] = [];
  for (let slot = 0; slot < order.length - 1; slot++) {
    let best = slot;
    for (let other = slot + 1; other < order.length; other++) {
      if (order[other] < order[best]) {
        best = other;
      }
    }
    if (best === slot) {
      continue;
    }
    // 挪到前面的物品插入到 slot，中间的依次后移一格，保持同档位原有顺序
    for (let from = best; from > slot; from--) {
      swaps.push([from, from - 1]);
      [order[from], order[from - 1]] = [order[from - 1], order[from]];
    }
  }
  return swaps;
}
