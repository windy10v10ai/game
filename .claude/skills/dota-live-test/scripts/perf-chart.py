"""性能报告的修改前后对比图：python -I perf-chart.py <spec.json> <输出.png>，spec 格式见 references/perf-bench.md「报告格式」。"""
import json
import math
import sys

from PIL import Image, ImageDraw, ImageFont

FONT = 'C:/Windows/Fonts/msyh.ttc'
BOLD = 'C:/Windows/Fonts/msyhbd.ttc'
INK, SUB, GRID, AXIS = (11, 11, 11), (82, 81, 78), (225, 224, 217), (137, 135, 129)
COLORS = {'before': (235, 104, 52), 'after': (42, 120, 214), 'ref': (180, 178, 169)}
W, PAD, BAR_H, BAR_GAP, PANEL_H = 1400, 40, 34, 22, 360


def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else FONT, size)


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
    img = Image.new('RGB', (W, height), (252, 252, 251))
    d = ImageDraw.Draw(img)
    d.text((PAD, 22), spec['title'], font=font(30, True), fill=INK)
    d.text((PAD, 66), spec['note'], font=font(18), fill=SUB)
    x0, x1 = PAD + 330, W - PAD - 30
    for i, panel in enumerate(panels):
        y0 = 110 + i * PANEL_H
        rows = panel['rows']
        lo, hi, step = axis([r['value'] for r in rows])
        px = lambda v: x0 + (v - lo) / (hi - lo) * (x1 - x0)
        d.text((PAD, y0), panel['title'], font=font(24, True), fill=INK)
        d.text((PAD, y0 + 36), panel['verdict'], font=font(20, True),
               fill=COLORS['after'] if panel.get('good') else SUB)
        top = y0 + 84
        bottom = top + len(rows) * (BAR_H + BAR_GAP)
        t = math.ceil(lo / step) * step
        while t <= hi + 1e-9:
            d.line([(px(t), top - 8), (px(t), bottom)], fill=GRID, width=1)
            label = ('+' if t > 1e-9 else '−' if t < -1e-9 else '') + f'{abs(t):.1f}'
            d.text((px(t), bottom + 6), label, font=font(15), fill=SUB, anchor='ma')
            t += step
        d.line([(px(0), top - 8), (px(0), bottom)], fill=AXIS, width=2)
        for j, row in enumerate(rows):
            y = top + j * (BAR_H + BAR_GAP)
            v = row['value']
            d.text((x0 - 14, y + BAR_H / 2), row['name'], font=font(17, row['kind'] != 'ref'),
                   fill=INK, anchor='rm')
            xa, xb = sorted((px(0), px(v)))
            d.rounded_rectangle([xa, y, max(xb, xa + 3), y + BAR_H], radius=4, fill=COLORS[row['kind']])
            if v >= 0:
                d.text((max(xb, xa + 3) + 8, y + BAR_H / 2), fmt(v), font=font(18, True), fill=INK, anchor='lm')
            else:
                d.text((xa - 8, y + BAR_H / 2), fmt(v), font=font(18, True), fill=INK, anchor='rm')
    d.text((PAD, height - 40), spec['footer'], font=font(15), fill=SUB)
    img.save(out_path)


main(sys.argv[1], sys.argv[2])
