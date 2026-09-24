const THINK_NAME = 'perf_sampler';
// 小于一个 tick（1/30s），保证每个 tick 都进一次，才能量到相邻 tick 的真实间隔
const THINK_INTERVAL = 0.01;
const REPORT_INTERVAL = 10;
// 100ms 约等于连丢 3 个 tick，玩家能明显感觉到顿一下
const HITCH_THRESHOLD = 0.1;

/**
 * 后期卡顿排查用的采样器，按固定间隔把 tick 率、卡顿尖峰、自定义 AI 耗时与单位规模打到控制台，供日志汇总脚本读取。
 */
export class PerfSampler {
  static enabled = false;
  static aiThinkDisabled = false;
  static phase = 'manual';

  private static windowStartReal = 0;
  private static windowStartGame = 0;
  private static lastTickReal = 0;
  private static ticks = 0;
  private static maxGap = 0;
  private static hitches = 0;
  private static aiTime = 0;
  private static pausedInWindow = false;

  static start() {
    if (this.enabled) return;
    this.enabled = true;
    this.resetWindow();
    print(`[perf] start`);
    GameRules.GetGameModeEntity().SetContextThink(THINK_NAME, () => this.onTick(), 0);
  }

  static stop() {
    if (!this.enabled) return;
    this.enabled = false;
    GameRules.GetGameModeEntity().SetContextThink(THINK_NAME, undefined, 0);
    print(`[perf] stop`);
  }

  // 切换实验段时丢掉未满的窗口，避免一个窗口混进两种条件的数据
  static setPhase(name: string) {
    this.phase = name;
    this.resetWindow();
    print(`[perf] phase=${name}`);
  }

  static addAiTime(seconds: number) {
    this.aiTime += seconds;
  }

  private static resetWindow() {
    const now = Plat_FloatTime();
    this.windowStartReal = now;
    this.windowStartGame = GameRules.GetGameTime();
    this.lastTickReal = now;
    this.ticks = 0;
    this.maxGap = 0;
    this.hitches = 0;
    this.aiTime = 0;
    this.pausedInWindow = false;
  }

  private static onTick(): number | undefined {
    if (!this.enabled) return undefined;

    const now = Plat_FloatTime();
    const gap = now - this.lastTickReal;
    this.lastTickReal = now;
    this.ticks++;
    if (gap > this.maxGap) this.maxGap = gap;
    if (gap > HITCH_THRESHOLD) this.hitches++;
    if (GameRules.IsGamePaused()) this.pausedInWindow = true;

    const realDt = now - this.windowStartReal;
    if (realDt >= REPORT_INTERVAL) {
      // 暂停时游戏时间停住、真实时间照走，这一段的比值没有意义，直接丢弃
      if (!this.pausedInWindow) this.report(realDt);
      this.resetWindow();
    }
    return THINK_INTERVAL;
  }

  private static report(realDt: number) {
    const gameDt = GameRules.GetGameTime() - this.windowStartGame;
    const units = countUnits();
    const dotaTime = Math.floor(GameRules.GetDOTATime(false, false));
    const fields = [
      `phase=${this.phase}`,
      `t=${Math.floor(dotaTime / 60)}:${string.format('%02d', dotaTime % 60)}`,
      `tick=${string.format('%.1f', this.ticks / realDt)}`,
      `speed=${string.format('%.3f', gameDt / realDt)}`,
      `maxGap=${Math.floor(this.maxGap * 1000)}`,
      `hitch=${this.hitches}`,
      `ai=${string.format('%.2f', (this.aiTime * 1000) / realDt)}`,
      `units=${units.total}`,
      `heroes=${units.heroes}`,
      `illus=${units.illusions}`,
      `creeps=${units.creeps}`,
      `summons=${units.summons}`,
      `mods=${units.modifiers}`,
      `mem=${string.format('%.1f', collectgarbage('count') / 1024)}`,
    ];
    print(`[perf] ${fields.join(' ')}`);
  }
}

export function findAllUnits(unitType: UnitTargetType): CDOTA_BaseNPC[] {
  return FindUnitsInRadius(
    DotaTeam.GOODGUYS,
    Vector(0, 0, 0),
    undefined,
    FIND_UNITS_EVERYWHERE,
    UnitTargetTeam.BOTH,
    unitType,
    UnitTargetFlags.INVULNERABLE +
      UnitTargetFlags.MAGIC_IMMUNE_ENEMIES +
      UnitTargetFlags.OUT_OF_WORLD,
    FindOrder.ANY,
    false,
  );
}

function countUnits() {
  const all = findAllUnits(UnitTargetType.ALL);
  const result = {
    total: all.length,
    heroes: 0,
    illusions: 0,
    creeps: 0,
    summons: 0,
    modifiers: 0,
  };
  for (const unit of all) {
    result.modifiers += unit.GetModifierCount();
    if (unit.IsIllusion()) result.illusions++;
    else if (unit.IsRealHero()) result.heroes++;
    else if (unit.IsSummoned()) result.summons++;
    else if (unit.IsCreep() || unit.IsNeutralUnitType()) result.creeps++;
  }
  return result;
}
