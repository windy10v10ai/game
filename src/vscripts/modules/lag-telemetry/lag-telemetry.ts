import { GameHost, GamePerfDto } from '../../api/analytics/dto/game-end-dto';
import { findAllUnits } from '../helper/unit-helper';
import { IsLauncherRoom } from '../launcher-room';
import { LagTracker, UnitCount, roundTo } from './lag-tracker';

// 线上常驻，只求暂停边界误差在秒级，不需要逐 tick 采样
const SAMPLE_INTERVAL = 1;

/** 线上卡顿统计：号角起在本机计时，结算时整理成一份随结算上报 */
export class LagTelemetry {
  private static tracker: LagTracker | undefined;

  static Start(): void {
    const tracker = new LagTracker(Plat_FloatTime());
    this.tracker = tracker;
    Timers.CreateTimer({
      endTime: SAMPLE_INTERVAL,
      // 按真实时间触发，暂停期间也要采样才能把暂停时长扣掉
      useGameTime: false,
      callback: () => {
        if (this.tracker !== tracker) return undefined;
        sample(tracker);
        return SAMPLE_INTERVAL;
      },
    });
  }

  /** 结束计时并取出整局统计，没有经过号角时返回空 */
  static Finish(): GamePerfDto | undefined {
    const tracker = this.tracker;
    if (!tracker) return undefined;
    this.tracker = undefined;
    sample(tracker);
    return {
      host: getHost(),
      realSec: roundTo(tracker.realSec, 1),
      ...countUnitsAndModifiers(),
      segments: tracker.segments,
    };
  }
}

function sample(tracker: LagTracker): void {
  tracker.tick(
    Plat_FloatTime(),
    GameRules.GetDOTATime(false, false),
    GameRules.IsGamePaused(),
    countUnitsAndModifiers,
  );
}

function countUnitsAndModifiers(): UnitCount {
  const units = findAllUnits(UnitTargetType.ALL);
  let modifiers = 0;
  for (const unit of units) modifiers += unit.GetModifierCount();
  return { units: units.length, modifiers };
}

function getHost(): GameHost {
  if (!IsDedicatedServer()) return 'local';
  return IsLauncherRoom() ? 'launcher' : 'dedicated';
}
