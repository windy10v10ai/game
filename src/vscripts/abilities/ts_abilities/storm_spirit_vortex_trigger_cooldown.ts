export class StormSpiritVortexTriggerCooldowns {
  private readonly cooldownEndTimes = new Map<number, number>();

  tryAcquire(targetIndex: number, currentTime: number, cooldownSeconds: number): boolean {
    const cooldownEndTime = this.cooldownEndTimes.get(targetIndex);
    if (cooldownEndTime !== undefined && currentTime < cooldownEndTime) {
      return false;
    }

    this.cooldownEndTimes.set(targetIndex, currentTime + cooldownSeconds);
    return true;
  }

  clear(): void {
    this.cooldownEndTimes.clear();
  }
}
