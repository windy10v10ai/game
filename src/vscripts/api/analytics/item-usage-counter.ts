import { ItemUsageDto } from './dto/hero-item-usage-dto';

/** Accumulates sampled item time, weighted by the number carried. */
export class ItemUsageCounter {
  private durations = new Map<string, number>();

  public Add(itemNames: string[], elapsedSec: number): void {
    if (elapsedSec <= 0) return;
    for (const itemName of itemNames) {
      if (itemName.includes('recipe')) continue;
      this.durations.set(itemName, (this.durations.get(itemName) ?? 0) + elapsedSec);
    }
  }

  public GetItems(): ItemUsageDto[] {
    const items: ItemUsageDto[] = [];
    this.durations.forEach((durationSec, itemName) => {
      items.push({ itemName, durationSec: Math.round(durationSec) });
    });
    return items;
  }
}
