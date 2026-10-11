import React, { useEffect, useRef, useState } from 'react';

type Corner = 'damage' | 'participation' | 'gold' | 'push' | 'survival' | 'support';
type LabelSide = 'top' | 'bottom' | 'left' | 'right';

interface CanvasPanel extends Panel {
  ClearJS(color: string): void;
  DrawSoftLinePointsJS(
    count: number,
    points: number[],
    thickness: number,
    softness: number,
    color: string,
  ): void;
}

// 顺时针从左上角排：打人的两项在上，生存与辅助在下；左右两角标签贴着图边，只放短词
const AXES: { key: Corner; deg: number; side: LabelSide }[] = [
  { key: 'damage', deg: 240, side: 'top' },
  { key: 'participation', deg: 300, side: 'top' },
  { key: 'gold', deg: 0, side: 'right' },
  { key: 'survival', deg: 60, side: 'bottom' },
  { key: 'support', deg: 120, side: 'bottom' },
  { key: 'push', deg: 180, side: 'left' },
];

const WIDTH = 440;
const HEIGHT = 305;
const CENTER_X = 220;
const CENTER_Y = 152;
const RADIUS = 115;
const LABEL_WIDTH = 140;
// 落后的玩家也要画得出形状，百分位 0 落在中心底的边上而不是圆心
const FLOOR_RATIO = 0.2;
const GRID_RATIOS = [1 / 3, 2 / 3].map((part) => FLOOR_RATIO + (1 - FLOOR_RATIO) * part);

// 与网站的六边形同一套比例和配色
// 承伤与死亡各占一半：只看死亡，躲在后排不上前的人得分最高
const SURVIVAL_TANK_WEIGHT = 0.5;
// 治疗和助攻最能分出辅助；控制单人局也打得出来，单人玩家这一项不至于是 0
const SUPPORT_WEIGHTS = { healing: 0.4, assists: 0.4, stuns: 0.2 } as const;
const COLOR_PLATE = '#23292f';
const COLOR_FLOOR = '#a3a8b033';
const COLOR_OUTLINE = '#a3a8b04d';
const COLOR_FLOOR_OUTLINE = '#a3a8b059';
const COLOR_GRID = '#a3a8b040';
const COLOR_FILL = '#e8823a4d';
const COLOR_LINE = '#f59a46';

// 一局内结果不变，关掉主页再打开不再重新请求
let cachedResult: PlayerStatsRadarResultEventData | undefined;

function combineCorners(radar: PlayerStatsRadar): Record<Corner, number> {
  const survival = SURVIVAL_TANK_WEIGHT * radar.tank + (1 - SURVIVAL_TANK_WEIGHT) * radar.deaths;
  const support =
    SUPPORT_WEIGHTS.healing * radar.healing +
    SUPPORT_WEIGHTS.assists * radar.assists +
    SUPPORT_WEIGHTS.stuns * radar.stuns;
  return {
    damage: Math.round(radar.damage),
    participation: Math.round(radar.participation),
    gold: Math.round(radar.gold),
    push: Math.round(radar.push),
    survival: Math.round(survival),
    support: Math.round(support),
  };
}

function ratioOfPercentile(percentile: number): number {
  return FLOOR_RATIO + ((1 - FLOOR_RATIO) * Math.min(100, Math.max(0, percentile))) / 100;
}

function point(deg: number, ratio: number): [number, number] {
  const angle = (deg * Math.PI) / 180;
  return [CENTER_X + Math.cos(angle) * RADIUS * ratio, CENTER_Y + Math.sin(angle) * RADIUS * ratio];
}

function hexagon(ratioOf: (key: Corner) => number): [number, number][] {
  return AXES.map(({ key, deg }) => point(deg, ratioOf(key)));
}

// 多点折线一次画出来会错位，逐段画两点线
function strokePolygon(
  canvas: CanvasPanel,
  points: [number, number][],
  width: number,
  color: string,
) {
  points.forEach((start, index) => {
    const end = points[(index + 1) % points.length];
    canvas.DrawSoftLinePointsJS(2, [...start, ...end], width, 0, color);
  });
}

// 画布只能画线，填充用逐行横线铺满；线宽等于行距，相邻两行不重叠，半透明色不会叠深
function fillPolygon(canvas: CanvasPanel, points: [number, number][], color: string) {
  const ys = points.map(([, y]) => y);
  const top = Math.floor(Math.min(...ys));
  const bottom = Math.ceil(Math.max(...ys));
  for (let y = top; y < bottom; y++) {
    const scanY = y + 0.5;
    const xs: number[] = [];
    points.forEach(([x1, y1], index) => {
      const [x2, y2] = points[(index + 1) % points.length];
      if ((y1 <= scanY && scanY < y2) || (y2 <= scanY && scanY < y1)) {
        xs.push(x1 + ((scanY - y1) / (y2 - y1)) * (x2 - x1));
      }
    });
    if (xs.length < 2) continue;
    canvas.DrawSoftLinePointsJS(2, [Math.min(...xs), scanY, Math.max(...xs), scanY], 1, 0, color);
  }
}

function drawRadar(canvas: CanvasPanel, corners: Record<Corner, number> | undefined) {
  canvas.ClearJS('rgba(0, 0, 0, 0)');
  const plate = hexagon(() => 1);
  const floor = hexagon(() => FLOOR_RATIO);
  fillPolygon(canvas, plate, COLOR_PLATE);
  fillPolygon(canvas, floor, COLOR_FLOOR);
  strokePolygon(canvas, plate, 1, COLOR_OUTLINE);
  strokePolygon(canvas, floor, 1, COLOR_FLOOR_OUTLINE);
  GRID_RATIOS.forEach((ratio) =>
    strokePolygon(
      canvas,
      hexagon(() => ratio),
      1,
      COLOR_GRID,
    ),
  );
  AXES.forEach(({ deg }) => {
    canvas.DrawSoftLinePointsJS(
      2,
      [...point(deg, FLOOR_RATIO), ...point(deg, 1)],
      1,
      0,
      COLOR_GRID,
    );
  });
  if (!corners) return;

  const data = hexagon((key) => ratioOfPercentile(corners[key]));
  fillPolygon(canvas, data, COLOR_FILL);
  strokePolygon(canvas, data, 2, COLOR_LINE);
  data.forEach(([x, y]) => {
    fillPolygon(
      canvas,
      [0, 60, 120, 180, 240, 300].map((deg): [number, number] => {
        const angle = (deg * Math.PI) / 180;
        return [x + Math.cos(angle) * 4, y + Math.sin(angle) * 4];
      }),
      COLOR_LINE,
    );
  });
}

const LABEL_OFFSETS: Record<LabelSide, { left: number; top: number; align: string }> = {
  top: { left: -LABEL_WIDTH / 2, top: -48, align: 'center' },
  bottom: { left: -LABEL_WIDTH / 2, top: 8, align: 'center' },
  left: { left: -12 - LABEL_WIDTH, top: -21, align: 'right' },
  right: { left: 12, top: -21, align: 'left' },
};

function labelPosition(deg: number, side: LabelSide) {
  const [x, y] = point(deg, 1);
  const offset = LABEL_OFFSETS[side];
  return { left: x + offset.left, top: y + offset.top, align: offset.align };
}

/** 战绩页的近期表现六边形：与同难度玩家比较的六项百分位 */
export function RecentFormRadar() {
  const [result, setResult] = useState(cachedResult);
  const canvasRef = useRef<CanvasPanel | null>(null);

  useEffect(() => {
    if (cachedResult) return undefined;
    const listener = GameEvents.Subscribe('player_stats_radar_result', (data) => {
      cachedResult = data;
      setResult(data);
    });
    GameEvents.SendCustomGameEventToServer('player_stats_radar_request', {});
    return () => GameEvents.Unsubscribe(listener);
  }, []);

  const corners = result?.radar ? combineCorners(result.radar) : undefined;

  useEffect(() => {
    if (canvasRef.current)
      drawRadar(canvasRef.current, result?.radar && combineCorners(result.radar));
  }, [result]);

  let centerText = '';
  if (!result) {
    centerText = $.Localize('#profile_radar_loading');
  } else if (result.status === 'failed') {
    centerText = $.Localize('#profile_radar_failed');
  } else if (!corners) {
    centerText = $.Localize('#profile_radar_need_more').replace(
      '{n}',
      String(Math.max(1, result.minMatchCount - result.matchCount)),
    );
  }
  const matchesText = corners
    ? $.Localize('#profile_radar_matches').replace('{n}', String(result!.matchCount))
    : '';

  return (
    <Panel className="stats-radar-block" style={{ height: `${HEIGHT}px` }}>
      {/* 标题叠在图左上角的空白里，不单独占一行 */}
      <Panel className="stats-radar-header">
        <Label className="stats-radar-title" text={$.Localize('#profile_radar_title')} />
        <Label
          className="stats-radar-matches"
          text={matchesText}
          style={{ visibility: matchesText ? 'visible' : 'collapse' }}
        />
      </Panel>
      <Panel className="stats-radar" style={{ width: `${WIDTH}px`, height: `${HEIGHT}px` }}>
        <GenericPanel
          type="UICanvas"
          ref={(panel: Panel | null) => {
            canvasRef.current = panel as CanvasPanel | null;
          }}
          style={{ width: `${WIDTH}px`, height: `${HEIGHT}px` }}
        />
        {AXES.map(({ key, deg, side }) => {
          const { left, top, align } = labelPosition(deg, side);
          return (
            <Panel
              key={key}
              className="stats-radar-axis"
              style={{ width: `${LABEL_WIDTH}px`, marginLeft: `${left}px`, marginTop: `${top}px` }}
            >
              <Label
                className="stats-radar-axis-name"
                style={{ textAlign: align }}
                text={$.Localize(`#profile_radar_axis_${key}`)}
              />
              <Label
                className={`stats-radar-axis-value ${corners ? '' : 'stats-radar-axis-empty'}`}
                style={{ textAlign: align }}
                text={corners ? String(corners[key]) : '–'}
              />
            </Panel>
          );
        })}
        <Label
          className="stats-radar-center"
          text={centerText}
          style={{ visibility: centerText ? 'visible' : 'collapse' }}
        />
      </Panel>
    </Panel>
  );
}
