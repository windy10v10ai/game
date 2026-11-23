import { RelayJob, RelayScheduler } from './relay-scheduler';

function job(id: string, line = 'direct'): RelayJob {
  return { requestId: id, line };
}

function enqueueMany(scheduler: RelayScheduler<RelayJob>, count: number, line = 'direct') {
  for (let i = 0; i < count; i++) scheduler.Enqueue(job(`r${i}`, line));
}

const always = () => true;

describe('RelayScheduler', () => {
  it('10 条请求只派出通道数那么多条，其余留在队列', () => {
    const scheduler = new RelayScheduler<RelayJob>();
    scheduler.SetCapacity(0 as PlayerID, 'direct', 3);
    enqueueMany(scheduler, 10);

    const assigned = scheduler.Drain(always);

    expect(assigned.map((a) => a.job.requestId)).toEqual(['r0', 'r1', 'r2']);
    expect(scheduler.QueuedCount()).toBe(7);
  });

  it('完成一条就能补发下一条，最终全部派完', () => {
    const scheduler = new RelayScheduler<RelayJob>();
    scheduler.SetCapacity(0 as PlayerID, 'direct', 3);
    enqueueMany(scheduler, 10);
    const dispatched: string[] = scheduler.Drain(always).map((a) => a.job.requestId);

    while (dispatched.length < 10) {
      scheduler.Release(dispatched[dispatched.length - 3]);
      const next = scheduler.Drain(always);
      expect(next).toHaveLength(1);
      dispatched.push(next[0].job.requestId);
      expect(scheduler.Active(0 as PlayerID, 'direct')).toBeLessThanOrEqual(3);
    }

    expect(dispatched).toEqual(['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9']);
    expect(scheduler.QueuedCount()).toBe(0);
  });

  it('通道数为 1 时一次只在途一条', () => {
    const scheduler = new RelayScheduler<RelayJob>();
    scheduler.SetCapacity(0 as PlayerID, 'direct', 1);
    enqueueMany(scheduler, 3);

    expect(scheduler.Drain(always)).toHaveLength(1);
    expect(scheduler.Drain(always)).toHaveLength(0);
    scheduler.Release('r0');
    expect(scheduler.Drain(always).map((a) => a.job.requestId)).toEqual(['r1']);
  });

  it('先占满一名玩家的通道，再用下一名玩家的', () => {
    const scheduler = new RelayScheduler<RelayJob>();
    scheduler.SetCapacity(0 as PlayerID, 'direct', 3);
    scheduler.SetCapacity(2 as PlayerID, 'direct', 3);
    enqueueMany(scheduler, 10);

    const assigned = scheduler.Drain(always);

    expect(assigned.map((a) => a.playerId)).toEqual([0, 0, 0, 2, 2, 2]);
  });

  it('代发玩家不可用时换人，释放前不占用别人的通道', () => {
    const scheduler = new RelayScheduler<RelayJob>();
    scheduler.SetCapacity(0 as PlayerID, 'direct', 3);
    scheduler.SetCapacity(1 as PlayerID, 'direct', 3);
    enqueueMany(scheduler, 2);

    const assigned = scheduler.Drain((playerId) => playerId !== 0);

    expect(assigned.map((a) => a.playerId)).toEqual([1, 1]);
  });

  it('两条线路的通道互不占用', () => {
    const scheduler = new RelayScheduler<RelayJob>();
    scheduler.SetCapacity(0 as PlayerID, 'direct', 1);
    scheduler.SetCapacity(0 as PlayerID, 'cn-proxy', 1);
    scheduler.Enqueue(job('a', 'direct'));
    scheduler.Enqueue(job('b', 'direct'));
    scheduler.Enqueue(job('c', 'cn-proxy'));

    expect(scheduler.Drain(always).map((x) => x.job.requestId)).toEqual(['a', 'c']);
  });

  it('某条线路上被拉黑的玩家不影响他在另一条线路上接活', () => {
    const scheduler = new RelayScheduler<RelayJob>();
    scheduler.SetCapacity(0 as PlayerID, 'direct', 1);
    scheduler.SetCapacity(0 as PlayerID, 'cn-proxy', 1);
    scheduler.Enqueue(job('a', 'direct'));
    scheduler.Enqueue(job('b', 'cn-proxy'));

    const assigned = scheduler.Drain((_playerId, line) => line !== 'direct');

    expect(assigned.map((x) => x.job.requestId)).toEqual(['b']);
    expect(scheduler.HasCapacityPlayer((_playerId, line) => line !== 'direct', 'direct')).toBe(
      false,
    );
    expect(scheduler.HasCapacityPlayer((_playerId, line) => line !== 'direct', 'cn-proxy')).toBe(
      true,
    );
  });

  it('线路没有就绪通道时一直排队，通道就绪后立即可派', () => {
    const scheduler = new RelayScheduler<RelayJob>();
    scheduler.SetCapacity(0 as PlayerID, 'direct', 0);
    scheduler.Enqueue(job('a'));

    expect(scheduler.Drain(always)).toHaveLength(0);
    scheduler.SetCapacity(0 as PlayerID, 'direct', 2);
    expect(scheduler.Drain(always)).toHaveLength(1);
  });

  it('释放排队中的请求会把它移出队列，重复释放不会让在途数变负', () => {
    const scheduler = new RelayScheduler<RelayJob>();
    scheduler.SetCapacity(0 as PlayerID, 'direct', 1);
    enqueueMany(scheduler, 2);
    scheduler.Drain(always);

    scheduler.Release('r1');
    scheduler.Release('r0');
    scheduler.Release('r0');

    expect(scheduler.QueuedCount()).toBe(0);
    expect(scheduler.Active(0 as PlayerID, 'direct')).toBe(0);
  });

  it('记录请求当前归属的玩家，释放后清除', () => {
    const scheduler = new RelayScheduler<RelayJob>();
    scheduler.SetCapacity(4 as PlayerID, 'direct', 1);
    scheduler.Enqueue(job('a'));
    scheduler.Drain(always);

    expect(scheduler.GetAssignedPlayer('a')).toBe(4);
    scheduler.Release('a');
    expect(scheduler.GetAssignedPlayer('a')).toBeUndefined();
  });
});
