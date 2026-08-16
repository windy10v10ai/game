import {
  finishRecastWindow,
  getRadialDestination,
  isTerrainCollision,
  registerCollision,
  shouldRestoreDelayedCooldown,
  startRecastWindow,
} from './magnataur-reverse-reverse-polarity-logic';

describe('magnataur reverse reverse polarity helpers', () => {
  it('将目标沿猛犸到目标的方向推至最大距离', () => {
    expect(getRadialDestination({ x: 100, y: 200 }, { x: 400, y: 600 }, 700)).toEqual({
      x: 520,
      y: 760,
    });
  });

  it('目标与猛犸重合时使用猛犸朝向作为径向方向', () => {
    expect(
      getRadialDestination({ x: 100, y: 200 }, { x: 100, y: 200 }, 700, { x: 0, y: 1 }),
    ).toEqual({ x: 100, y: 900 });
  });

  it('一段开启二段窗口时暂不进入冷却', () => {
    expect(startRecastWindow()).toEqual({ phase: 'recast', cooldownStarted: false });
  });

  it.each(['cast', 'expired', 'death'] as const)('%s 结束二段窗口并启动冷却', (reason) => {
    expect(finishRecastWindow(startRecastWindow(), reason)).toEqual({
      phase: 'cooldown',
      cooldownStarted: true,
      reason,
    });
  });

  it('二段窗口内未刷新时，在窗口结束后补回完整冷却', () => {
    expect(shouldRestoreDelayedCooldown(99)).toBe(true);
  });

  it('二段窗口内已刷新时，在窗口结束后保持一段可用', () => {
    expect(shouldRestoreDelayedCooldown(0)).toBe(false);
  });

  it('同一目标只接受一次碰撞二次结算', () => {
    const first = registerCollision(false);
    const second = registerCollision(first.collided);

    expect(first).toEqual({ collided: true, shouldSettle: true });
    expect(second).toEqual({ collided: true, shouldSettle: false });
  });

  it.each([
    [false, false, false, 0],
    [true, true, false, 0],
    [true, false, true, 0],
    [true, false, false, 48],
  ])('不可通行、阻挡、树木或明显高差都属于地形碰撞', (traversable, blocked, tree, dz) => {
    expect(isTerrainCollision(traversable, blocked, tree, dz, 32)).toBe(true);
  });

  it('平坦且可通行的位置不属于地形碰撞', () => {
    expect(isTerrainCollision(true, false, false, 12, 32)).toBe(false);
  });
});
