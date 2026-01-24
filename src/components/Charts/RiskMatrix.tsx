import React from 'react';
import { Card, Row, Col, Typography, Tag, Empty, Table } from 'antd';

const { Title, Text } = Typography;

interface MatrixCell {
  probability: number;
  impact: number;
  count: number;
  risks: any[];
}

interface RiskMatrixData {
  projectId: string;
  matrix: MatrixCell[][];
  summary: {
    totalRisks: number;
    bySeverity: {
      LOW: number;
      MEDIUM: number;
      HIGH: number;
      CRITICAL: number;
    };
  };
}

interface RiskMatrixProps {
  data: RiskMatrixData;
}

const RiskMatrix: React.FC<RiskMatrixProps> = ({ data }) => {
  const getCellColor = (score: number) => {
    if (score >= 15) return '#ff4d4f'; // Critical - red
    if (score >= 9) return '#faad14'; // High - orange  
    if (score >= 4) return '#fadb14'; // Medium - yellow
    return '#52c41a'; // Low - green
  };

  const getCellText = (score: number) => {
    if (score >= 15) return 'Critical';
    if (score >= 9) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
  };

  if (!data || !data.matrix || !data.summary || data.summary.totalRisks === 0) {
    return (
      <Empty
        description="No risk matrix data available"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  // Create 5x5 matrix display
  const probabilityLabels = ['Very High', 'High', 'Medium', 'Low', 'Very Low'];
  const impactLabels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={5}>Risk Assessment Matrix (5×5)</Title>
        <Text type="secondary">
          Total Risks: {data.summary?.totalRisks ?? 0} | 
          Critical: {data.summary?.bySeverity?.CRITICAL ?? 0} | 
          High: {data.summary?.bySeverity?.HIGH ?? 0} | 
          Medium: {data.summary?.bySeverity?.MEDIUM ?? 0} | 
          Low: {data.summary?.bySeverity?.LOW ?? 0}
        </Text>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ 
                border: '1px solid #d9d9d9', 
                padding: '8px',
                backgroundColor: '#fafafa',
                textAlign: 'center'
              }}>
                <Text strong>Probability ↓ Impact →</Text>
              </th>
              {impactLabels.map((label, idx) => (
                <th key={idx} style={{ 
                  border: '1px solid #d9d9d9', 
                  padding: '8px',
                  backgroundColor: '#fafafa',
                  textAlign: 'center',
                  minWidth: '100px'
                }}>
                  <Text strong>{label}</Text>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {probabilityLabels.map((probLabel, probIdx) => (
              <tr key={probIdx}>
                <td style={{ 
                  border: '1px solid #d9d9d9', 
                  padding: '8px',
                  backgroundColor: '#fafafa',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}>
                  {probLabel}
                </td>
                {impactLabels.map((impLabel, impIdx) => {
                  const probability = 5 - probIdx; // Reverse for display (5 = Very High at top)
                  const impact = impIdx + 1; // 1 = Very Low at left
                  const score = probability * impact;
                  
                  // Find matching cell in data
                  const cell = data.matrix
                    .flat()
                    .find(c => c.probability === probability && c.impact === impact);
                  
                  return (
                    <td
                      key={impIdx}
                      style={{
                        border: '1px solid #d9d9d9',
                        padding: '12px',
                        textAlign: 'center',
                        backgroundColor: getCellColor(score),
                        color: score >= 9 ? '#fff' : '#000',
                        cursor: cell && cell.count > 0 ? 'pointer' : 'default',
                      }}
                      title={cell && cell.count > 0 ? `${cell.count} risk(s)` : 'No risks'}
                    >
                      <div>
                        <Text strong style={{ color: score >= 9 ? '#fff' : '#000' }}>
                          {getCellText(score)}
                        </Text>
                        <br />
                        <Text style={{ fontSize: '11px', color: score >= 9 ? '#fff' : '#666' }}>
                          Score: {score}
                        </Text>
                        {cell && cell.count > 0 && (
                          <>
                            <br />
                            <Tag color={score >= 15 ? 'red' : score >= 9 ? 'orange' : 'blue'} style={{ marginTop: 4 }}>
                              {cell.count} risk{cell.count > 1 ? 's' : ''}
                            </Tag>
                          </>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16 }}>
        <Text type="secondary">
          <strong>Legend:</strong> Risk Score = Probability × Impact
        </Text>
      </div>
    </div>
  );
};

export default RiskMatrix;
