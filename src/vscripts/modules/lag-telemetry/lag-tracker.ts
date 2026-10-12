import { GamePerfSegmentDto } from '../../api/analytics/dto/game-end-dto';

export const SEGMENT_DOTA_SEC = 300;
// 覆盖绝大多数局长，封顶防止代发网址超长
export const MAX_SEGMENTS = 24;

export interface UnitCount {
  units: number;
  modifiers: number;
}

/** 累计扣除暂停后的真实时长，并按固定游戏时长切段记录卡顿比值 */
export class LagTracker {
  realSec = 0;
  readonly segments: GamePerfSegmentDto[] = [];

  private lastReal: number;
  private segmentStartReal = 0;
  private segmentStartDota = 0;

  constructor(startReal: number) {
    this.lastReal = startReal;
  }

  tick(nowReal: number, dotaSec: number, paused: boolean, countUnits: () => UnitCount): void {
    // 只看采样时刻是否暂停，暂停边界两侧的误差各不超过一个采样间隔，且方向相反
    if (!paused) this.realSec += nowReal - this.lastReal;
    this.lastReal = nowReal;

    if (this.segments.length >= MAX_SEGMENTS) return;
    if (dotaSec < (this.segments.length + 1) * SEGMENT_DOTA_SEC) return;
    // 分母用实际走过的游戏时间而不是段长，采样落在整点之后也不会把比值算偏
    const ratio = (this.realSec - this.segmentStartReal) / (dotaSec - this.segmentStartDota);
    this.segments.push({ ratio: roundTo(ratio, 3), ...countUnits() });
    this.segmentStartReal = this.realSec;
    this.segmentStartDota = dotaSec;
  }
}

export function roundTo(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}
