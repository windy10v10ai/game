export interface RazorStaticLinkTransfer {
  selfGain: number;
  targetReduction: number;
}

export function resolveRazorStaticLinkAwakenLevel(
  linkedLevel: number,
  awakenedMaxLevel: number,
): number | undefined {
  if (linkedLevel <= 0) return undefined;
  return Math.min(linkedLevel, awakenedMaxLevel);
}

export type RazorStaticLinkTargetId = string | number;

interface TimedValueRecord {
  amount: number;
  expiresAt: number;
}

function positiveValue(value: number): number {
  return value > 0 ? value : 0;
}

function cappedPositiveValue(value: number, cap: number): number {
  const positive = positiveValue(value);
  return cap > 0 ? Math.min(positive, cap) : positive;
}

/**
 * Calculates one damage event. Razor's gain follows the real damage only while
 * the target still has positive attack damage. The same per-event value is used
 * for target reduction, which remains active up to the per-target total cap.
 */
export function calculateRazorStaticLinkTransfer(
  actualDamage: number,
  selfGainCap: number,
  targetReductionTotalCap: number,
  currentTargetReduction = 0,
  targetCurrentAttackDamage = Number.POSITIVE_INFINITY,
  targetReductionPerInstance = selfGainCap,
): RazorStaticLinkTransfer {
  if (actualDamage <= 0) {
    return { selfGain: 0, targetReduction: 0 };
  }

  const remainingTargetCap =
    targetReductionTotalCap > 0
      ? Math.max(0, targetReductionTotalCap - positiveValue(currentTargetReduction))
      : Number.POSITIVE_INFINITY;

  return {
    selfGain: targetCurrentAttackDamage > 0 ? cappedPositiveValue(actualDamage, selfGainCap) : 0,
    targetReduction: Math.min(positiveValue(targetReductionPerInstance), remainingTargetCap),
  };
}

class ExpiringValueLedger {
  private records: TimedValueRecord[] = [];
  private firstActiveIndex = 0;
  private total = 0;

  add(amount: number, expiresAt: number): void {
    if (amount <= 0) return;
    this.records.push({ amount, expiresAt });
    this.total += amount;
  }

  expire(now: number): void {
    while (
      this.firstActiveIndex < this.records.length &&
      this.records[this.firstActiveIndex].expiresAt <= now
    ) {
      this.total -= this.records[this.firstActiveIndex].amount;
      this.firstActiveIndex += 1;
    }

    if (this.total < 0) this.total = 0;
    this.compactExpiredPrefix();
  }

  getTotal(): number {
    return this.total;
  }

  isEmpty(): boolean {
    return this.firstActiveIndex >= this.records.length;
  }

  clear(): void {
    this.records = [];
    this.firstActiveIndex = 0;
    this.total = 0;
  }

  private compactExpiredPrefix(): void {
    if (this.firstActiveIndex < 64 || this.firstActiveIndex * 2 < this.records.length) {
      return;
    }

    this.records = this.records.slice(this.firstActiveIndex);
    this.firstActiveIndex = 0;
  }
}

export class RazorStaticLinkAwakenLedger<TTargetId extends RazorStaticLinkTargetId> {
  private readonly selfLedger = new ExpiringValueLedger();
  private readonly targetLedgers = new Map<TTargetId, ExpiringValueLedger>();

  recordDamage(
    targetId: TTargetId,
    actualDamage: number,
    now: number,
    duration: number,
    selfGainCap: number,
    targetReductionTotalCap: number,
    targetCurrentAttackDamage = Number.POSITIVE_INFINITY,
    targetReductionPerInstance = selfGainCap,
  ): RazorStaticLinkTransfer {
    this.expire(now);

    const transfer = calculateRazorStaticLinkTransfer(
      actualDamage,
      selfGainCap,
      targetReductionTotalCap,
      this.getTargetTotal(targetId),
      targetCurrentAttackDamage,
      targetReductionPerInstance,
    );
    if (duration <= 0) return { selfGain: 0, targetReduction: 0 };

    const expiresAt = now + duration;
    this.selfLedger.add(transfer.selfGain, expiresAt);

    if (transfer.targetReduction > 0) {
      let targetLedger = this.targetLedgers.get(targetId);
      if (!targetLedger) {
        targetLedger = new ExpiringValueLedger();
        this.targetLedgers.set(targetId, targetLedger);
      }
      targetLedger.add(transfer.targetReduction, expiresAt);
    }

    return transfer;
  }

  expire(now: number): void {
    this.selfLedger.expire(now);

    for (const [targetId, ledger] of this.targetLedgers) {
      ledger.expire(now);
      if (ledger.isEmpty()) {
        this.targetLedgers.delete(targetId);
      }
    }
  }

  removeTarget(targetId: TTargetId): void {
    const ledger = this.targetLedgers.get(targetId);
    if (ledger) ledger.clear();
    this.targetLedgers.delete(targetId);
  }

  getSelfTotal(): number {
    return this.selfLedger.getTotal();
  }

  getTargetTotal(targetId: TTargetId): number {
    return this.targetLedgers.get(targetId)?.getTotal() ?? 0;
  }

  getActiveTargetIds(): TTargetId[] {
    const targetIds: TTargetId[] = [];
    for (const targetId of this.targetLedgers.keys()) {
      targetIds.push(targetId);
    }
    return targetIds;
  }

  hasRecords(): boolean {
    return !this.selfLedger.isEmpty() || this.targetLedgers.size > 0;
  }

  clear(): void {
    this.selfLedger.clear();
    for (const ledger of this.targetLedgers.values()) {
      ledger.clear();
    }
    this.targetLedgers.clear();
  }
}
