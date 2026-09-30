/** 全队一件事做太久又没进展就歇一会，换别的事做，不钻死胡同。 */

export type Activity = 'fight' | 'push' | 'farm';

const ACTIVITIES: Activity[] = ['fight', 'push', 'farm'];

/** 半队以上连续做这件事这么久没进展就歇；发育本身是填空，不看进展。 */
export const ACTIVITY_LIMIT: Record<Activity, number> = { fight: 60, push: 120, farm: 90 };
export const ACTIVITY_REST = 60;
// 被临时叫去做别的事这么短的时间不算换过，回来接着计时
const SWITCH_GRACE = 10;

export class ActivityTracker {
  private readonly since = new Map<Activity, number>();
  private readonly lastMain = new Map<Activity, number>();
  private readonly restUntil = new Map<Activity, number>();

  /** 每轮按上一轮的分派更新；返回这一轮刚开始歇的事。 */
  Update(
    counts: Map<Activity, number>,
    active: number,
    progress: Set<Activity>,
    now: number,
  ): Activity[] {
    const tired: Activity[] = [];
    for (const activity of ACTIVITIES) {
      if (now < (this.restUntil.get(activity) ?? -Infinity)) {
        this.since.delete(activity);
        continue;
      }
      const main = active > 0 && (counts.get(activity) ?? 0) * 2 >= active;
      if (main) {
        this.lastMain.set(activity, now);
        if (!this.since.has(activity)) {
          this.since.set(activity, now);
        }
      } else if (now - (this.lastMain.get(activity) ?? -Infinity) > SWITCH_GRACE) {
        this.since.delete(activity);
      }
      const since = this.since.get(activity);
      if (since === undefined) {
        continue;
      }
      if (progress.has(activity)) {
        this.since.set(activity, now);
      } else if (now - since >= ACTIVITY_LIMIT[activity]) {
        this.restUntil.set(activity, now + ACTIVITY_REST);
        this.since.delete(activity);
        tired.push(activity);
      }
    }
    return tired;
  }

  Resting(now: number): Set<Activity> {
    return new Set(
      ACTIVITIES.filter((activity) => now < (this.restUntil.get(activity) ?? -Infinity)),
    );
  }
}
