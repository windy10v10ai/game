import qrcode from 'qrcode-generator';
import React, { useMemo } from 'react';

interface QrCodeViewProps {
  value: string;
  cellSize?: number;
}

export function QrCodeView({ value, cellSize = 6 }: QrCodeViewProps) {
  const matrix = useMemo<boolean[][]>(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    const rows: boolean[][] = [];
    for (let r = 0; r < n; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < n; c++) {
        row.push(qr.isDark(r, c));
      }
      rows.push(row);
    }
    return rows;
  }, [value]);

  const n = matrix.length;
  const px = `${cellSize}px`;
  // 与 .qr-code-grid 的 padding 对齐（4px × 2 = 8）
  const totalPx = `${n * cellSize + 8}px`;
  const cellStyle = { width: px, height: px };

  return (
    <Panel className="qr-code-grid" style={{ width: totalPx, height: totalPx }}>
      {matrix.map((row, r) => (
        <Panel key={r} className="qr-code-row" style={{ height: px }}>
          {row.map((dark, c) => (
            <Panel
              key={c}
              className={
                dark ? 'qr-code-cell qr-code-cell-dark' : 'qr-code-cell qr-code-cell-light'
              }
              style={cellStyle}
            />
          ))}
        </Panel>
      ))}
    </Panel>
  );
}
