/**
 * 客户端代发的调度：每名代发玩家每条线路有若干就绪通道（网页控件），同一时刻在途请求不超过通道数，
 * 多出来的留在队列，有请求完成就补发。不碰引擎对象，方便单测。
 */
export interface RelayJob {
  requestId: string;
  line: string;
}

export interface RelayAssignment<T extends RelayJob> {
  job: T;
  playerId: PlayerID;
}

export class RelayScheduler<T extends RelayJob> {
  private capacity = new Map<string, number>();
  private activeCount = new Map<string, number>();
  private assigned = new Map<string, { playerId: PlayerID; line: string }>();
  private queue: T[] = [];
  private players: PlayerID[] = [];

  /** 登记玩家某条线路的就绪通道数，通道数只增不减由调用方保证 */
  public SetCapacity(playerId: PlayerID, line: string, channels: number): void {
    if (this.players.indexOf(playerId) < 0) {
      this.players.push(playerId);
      this.players.sort((a, b) => a - b);
    }
    this.capacity.set(this.key(playerId, line), channels);
  }

  public GetCapacity(playerId: PlayerID, line: string): number {
    return this.capacity.get(this.key(playerId, line)) ?? 0;
  }

  public HasCapacityPlayer(
    canRelay: (playerId: PlayerID, line: string) => boolean,
    line: string,
  ): boolean {
    return this.players.some(
      (playerId) => canRelay(playerId, line) && this.GetCapacity(playerId, line) > 0,
    );
  }

  public Enqueue(job: T): void {
    this.queue.push(job);
  }

  /** 按队列顺序给每条请求找第一个还有空闲通道的玩家，返回这次派出去的 */
  public Drain(canRelay: (playerId: PlayerID, line: string) => boolean): RelayAssignment<T>[] {
    const result: RelayAssignment<T>[] = [];
    const remaining: T[] = [];
    for (const job of this.queue) {
      const playerId = this.players.find(
        (p) => canRelay(p, job.line) && this.Active(p, job.line) < this.GetCapacity(p, job.line),
      );
      if (playerId === undefined) {
        remaining.push(job);
        continue;
      }
      this.activeCount.set(this.key(playerId, job.line), this.Active(playerId, job.line) + 1);
      this.assigned.set(job.requestId, { playerId, line: job.line });
      result.push({ job, playerId });
    }
    this.queue = remaining;
    return result;
  }

  /** 请求结束（成功、失败、超时、取消）时释放通道，同时移出队列 */
  public Release(requestId: string): void {
    this.queue = this.queue.filter((job) => job.requestId !== requestId);
    const slot = this.assigned.get(requestId);
    if (!slot) return;
    this.assigned.delete(requestId);
    const key = this.key(slot.playerId, slot.line);
    this.activeCount.set(key, Math.max(0, this.Active(slot.playerId, slot.line) - 1));
  }

  public GetAssignedPlayer(requestId: string): PlayerID | undefined {
    return this.assigned.get(requestId)?.playerId;
  }

  public Active(playerId: PlayerID, line: string): number {
    return this.activeCount.get(this.key(playerId, line)) ?? 0;
  }

  public QueuedCount(): number {
    return this.queue.length;
  }

  private key(playerId: PlayerID, line: string): string {
    return `${playerId}|${line}`;
  }
}
