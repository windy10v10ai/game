"""性能报告的修改前后对比图（SVG）：python -I perf-chart.py <spec.json> <输出.svg>，spec 格式见 references/perf-bench.md「报告格式」。"""
import json
import math
import sys
from xml.sax.saxutils import escape

FONT = "Microsoft YaHei, PingFang SC, Noto Sans CJK SC, sans-serif"
INK, SUB, GRID, AXIS = '#0b0b0b', '#52514e', '#e1e0d9', '#898781'
COLORS = {'before': '#eb6834', 'after': '#2a78d6', 'ref': '#b4b2a9'}
W, PAD, BAR_H, BAR_GAP, PANEL_H = 1400, 40, 34, 22, 360


def text(x, y, s, size, fill, bold=False, anchor='start'):
    weight = 700 if bold else 400
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" font-weight="{weight}" '
            f'fill="{fill}" text-anchor="{anchor}">{escape(s)}</text>')


def fmt(v):
    return ('+' if v > 0 else '−' if v < 0 else '') + f'{abs(v):.2f}'


def axis(values):
    lo = min(0, min(values)) - 0.2
    hi = max(0, max(values)) + 0.4
    step = next(s for s in (0.1, 0.2, 0.5, 1, 2, 5, 10) if (hi - lo) / s <= 10)
    return math.floor(lo / step) * step, math.ceil(hi / step) * step, step


def main(spec_path, out_path):
    spec = json.load(open(spec_path, encoding='utf8'))
    panels = spec['panels']
    height = 110 + PANEL_H * len(panels) + 50
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {height}" width="{W}" height="{height}" '
           f'font-family="{FONT}">',
           f'<rect width="{W}" height="{height}" fill="#fcfcfb"/>',
           text(PAD, 52, spec['title'], 30, INK, True),
           text(PAD, 86, spec['note'], 18, SUB)]
    x0, x1 = PAD + 330, W - PAD - 30
    lo, hi, step = axis([r['value'] for panel in panels for r in panel['rows']])
    px = lambda v: x0 + (v - lo) / (hi - lo) * (x1 - x0)
    for i, panel in enumerate(panels):
        y0 = 110 + i * PANEL_H
        rows = panel['rows']
        out.append(text(PAD, y0 + 26, panel['title'], 24, INK, True))
        out.append(text(PAD, y0 + 62, panel['verdict'], 20, COLORS['after'] if panel.get('good') else SUB, True))
        top = y0 + 84
        bottom = top + len(rows) * (BAR_H + BAR_GAP)
        t = math.ceil(lo / step) * step
        while t <= hi + 1e-9:
            out.append(f'<line x1="{px(t):.1f}" y1="{top - 8}" x2="{px(t):.1f}" y2="{bottom}" stroke="{GRID}"/>')
            label = ('+' if t > 1e-9 else '−' if t < -1e-9 else '') + f'{abs(t):.1f}'
            out.append(text(px(t), bottom + 24, label, 15, SUB, anchor='middle'))
            t += step
        out.append(f'<line x1="{px(0):.1f}" y1="{top - 8}" x2="{px(0):.1f}" y2="{bottom}" stroke="{AXIS}" stroke-width="2"/>')
        for j, row in enumerate(rows):
            y = top + j * (BAR_H + BAR_GAP)
            v = row['value']
            mid = y + BAR_H / 2 + 6
            out.append(text(x0 - 14, mid, row['name'], 17, INK, row['kind'] != 'ref', 'end'))
            xa, xb = sorted((px(0), px(v)))
            xb = max(xb, xa + 3)
            out.append(f'<rect x="{xa:.1f}" y="{y}" width="{xb - xa:.1f}" height="{BAR_H}" rx="4" fill="{COLORS[row["kind"]]}"/>')
            if v >= 0:
                out.append(text(xb + 8, mid + 1, fmt(v), 18, INK, True))
            else:
                out.append(text(xa - 8, mid + 1, fmt(v), 18, INK, True, 'end'))
    out.append(text(PAD, height - 22, spec['footer'], 15, SUB))
    out.append('</svg>')
    open(out_path, 'w', encoding='utf8', newline='\n').write('\n'.join(out))


main(sys.argv[1], sys.argv[2])
