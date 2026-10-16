import { ItemUsageDto } from './dto/hero-item-usage-dto';

/** Accumulates sampled item time, weighted by the number carried. */
export class ItemUsageCounter {
  private durations = new Map<string, { total: number; late: number }>();

  public Add(itemNames: string[], elapsedSec: number, lateSec: number): void {
    if (elapsedSec <= 0) return;
    for (const itemName of itemNames) {
      if (itemName.includes('recipe')) continue;
      const duration = this.durations.get(itemName);
      if (duration) {
        duration.total += elapsedSec;
        duration.late += lateSec;
      } else {
        this.durations.set(itemName, { total: elapsedSec, late: lateSec });
      }
    }
  }

  public GetItems(): ItemUsageDto[] {
    const items: ItemUsageDto[] = [];
    this.durations.forEach((duration, itemName) => {
      items.push({
        itemName,
        durationSec: Math.round(duration.total),
        lateDurationSec: Math.round(duration.late),
      });
    });
    return items;
  }
}
