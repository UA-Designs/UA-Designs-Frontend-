import React from 'react';
import { Empty, Tooltip } from 'antd';

interface MatrixCell {
  probabilityLabel: string;
  impactLabel: string;
  count: number;
  riskIds: string[];
}

interface RiskMatrixData {
  projectId: string;
  matrix: MatrixCell[][];
  totalRisks: number;
  probabilityBands: string[];
  impactBands: string[];
}

interface RiskMatrixProps {
  data: RiskMatrixData;
}

const BAND_SCORE: Record<string, number> = {
  'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5,
};

const SHORT: Record<string, string> = {
  'Very Low': 'VL', 'Low': 'L', 'Medium': 'M', 'High': 'H', 'Very High': 'VH',
};

const getCellColor = (score: number): string => {
  if (score >= 17) return 'rgba(255, 77, 79, 0.85)';
  if (score >= 9)  return 'rgba(250, 173, 20, 0.80)';
  if (score >= 4)  return 'rgba(250, 219, 20, 0.70)';
  return 'rgba(82, 196, 26, 0.65)';
};

const getCellLabel = (score: number): string => {
  if (score >= 17) return 'Critical';
  if (score >= 9)  return 'High';
  if (score >= 4)  return 'Medium';
  return 'Low';
};

const LEGEND = [
  { color: 'rgba(82, 196, 26, 0.65)',   label: 'Low' },
  { color: 'rgba(250, 219, 20, 0.70)',  label: 'Medium' },
  { color: 'rgba(250, 173, 20, 0.80)',  label: 'High' },
  { color: 'rgba(255, 77, 79, 0.85)',   label: 'Critical' },
];

const RiskMatrix: React.FC<RiskMatrixProps> = ({ data }) => {
  if (!data || !data.matrix) {
    return <Empty description="No risk matrix data available" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  const flatMatrix = data.matrix.flat();
  const probRows   = [...(data.probabilityBands ?? [])].reverse(); // VH → VL top to bottom
  const impCols    = data.impactBands ?? [];
  const CELL       = 44; // px per cell

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#94a3b8', fontSize: 11 }}>Probability ↕ · Impact →</span>
        <span style={{ color: '#009944', fontSize: 12, fontWeight: 600 }}>
          {data.totalRisks ?? 0} risk{(data.totalRisks ?? 0) !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>

        {/* Y-axis labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: CELL + 3 + 4 }}>
          {probRows.map(p => (
            <div
              key={p}
              style={{
                height: CELL,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 6,
                color: '#94a3b8',
                fontSize: 10,
                fontWeight: 600,
                width: 22,
                flexShrink: 0,
              }}
            >
              {SHORT[p] ?? p}
            </div>
          ))}
        </div>

        {/* Matrix body */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* X-axis labels */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
            {impCols.map(imp => (
              <div
                key={imp}
                style={{
                  flex: 1,
                  minWidth: CELL,
                  height: CELL,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                {SHORT[imp] ?? imp}
              </div>
            ))}
          </div>

          {/* Rows */}
          {probRows.map(probLabel => (
            <div key={probLabel} style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
              {impCols.map(impLabel => {
                const score    = (BAND_SCORE[probLabel] ?? 1) * (BAND_SCORE[impLabel] ?? 1);
                const cell     = flatMatrix.find(c => c.probabilityLabel === probLabel && c.impactLabel === impLabel);
                const count    = cell?.count ?? 0;
                const bg       = getCellColor(score);
                const tip      = `${probLabel} probability · ${impLabel} impact\n${getCellLabel(score)}${count ? ` · ${count} risk${count > 1 ? 's' : ''}` : ''}`;

                return (
                  <Tooltip key={impLabel} title={tip}>
                    <div
                      style={{
                        flex: 1,
                        minWidth: CELL,
                        height: CELL,
                        borderRadius: 6,
                        background: bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: count > 0 ? 'pointer' : 'default',
                        border: count > 0 ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent',
                        transition: 'transform 0.15s',
                        position: 'relative',
                      }}
                      onMouseEnter={e => { if (count > 0) (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                    >
                      {count > 0 && (
                        <span
                          style={{
                            background: 'rgba(0,0,0,0.55)',
                            color: '#fff',
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {count}
                        </span>
                      )}
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 2 }}>
        {LEGEND.map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
            <span style={{ color: '#94a3b8', fontSize: 11 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RiskMatrix;
