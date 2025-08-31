import React from 'react';
import { Card, Row, Col, Typography, Tag, Empty } from 'antd';
import { Risk, RiskProbability, RiskImpact } from '../../types';

const { Title, Text } = Typography;

const RiskMatrix: React.FC = () => {
  // Mock data for demonstration
  const risks: Risk[] = [
    {
      id: '1',
      title: 'Weather Delays',
      description: 'Adverse weather conditions affecting construction',
      category: 'EXTERNAL' as any,
      probability: RiskProbability.MEDIUM,
      impact: RiskImpact.HIGH,
      priority: 'HIGH' as any,
      status: 'IDENTIFIED' as any,
      mitigationStrategy: 'Monitor weather forecasts and adjust schedules',
      contingencyPlan: 'Indoor work during bad weather',
      ownerId: '1',
      projectId: '1',
      identifiedDate: '2024-01-15',
      targetDate: '2024-02-15',
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
    },
    {
      id: '2',
      title: 'Material Shortage',
      description: 'Shortage of construction materials',
      category: 'RESOURCE' as any,
      probability: RiskProbability.LOW,
      impact: RiskImpact.MEDIUM,
      priority: 'MEDIUM' as any,
      status: 'ANALYZED' as any,
      mitigationStrategy: 'Secure multiple suppliers',
      contingencyPlan: 'Alternative material sources',
      ownerId: '1',
      projectId: '1',
      identifiedDate: '2024-01-10',
      targetDate: '2024-01-25',
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2024-01-10T00:00:00Z',
    },
  ];

  const getProbabilityValue = (probability: RiskProbability) => {
    switch (probability) {
      case RiskProbability.VERY_LOW:
        return 1;
      case RiskProbability.LOW:
        return 2;
      case RiskProbability.MEDIUM:
        return 3;
      case RiskProbability.HIGH:
        return 4;
      case RiskProbability.VERY_HIGH:
        return 5;
      default:
        return 0;
    }
  };

  const getImpactValue = (impact: RiskImpact) => {
    switch (impact) {
      case RiskImpact.VERY_LOW:
        return 1;
      case RiskImpact.LOW:
        return 2;
      case RiskImpact.MEDIUM:
        return 3;
      case RiskImpact.HIGH:
        return 4;
      case RiskImpact.VERY_HIGH:
        return 5;
      default:
        return 0;
    }
  };

  const getRiskColor = (probability: RiskProbability, impact: RiskImpact) => {
    const probValue = getProbabilityValue(probability);
    const impactValue = getImpactValue(impact);
    const riskScore = probValue * impactValue;

    if (riskScore >= 16) return '#ff4d4f'; // High risk - red
    if (riskScore >= 9) return '#faad14'; // Medium risk - orange
    return '#52c41a'; // Low risk - green
  };

  const getRiskLevel = (probability: RiskProbability, impact: RiskImpact) => {
    const probValue = getProbabilityValue(probability);
    const impactValue = getImpactValue(impact);
    const riskScore = probValue * impactValue;

    if (riskScore >= 16) return 'High';
    if (riskScore >= 9) return 'Medium';
    return 'Low';
  };

  if (risks.length === 0) {
    return (
      <Empty
        description="No risks identified"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={5}>Risk Assessment Matrix</Title>
        <Text type="secondary">Probability × Impact = Risk Level</Text>
      </div>

      <Row gutter={[8, 8]}>
        {risks.map(risk => (
          <Col span={24} key={risk.id}>
            <Card
              size="small"
              style={{
                borderLeft: `4px solid ${getRiskColor(risk.probability, risk.impact)}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1 }}>
                  <Text strong>{risk.title}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {risk.description}
                  </Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Tag color={getRiskColor(risk.probability, risk.impact)}>
                    {getRiskLevel(risk.probability, risk.impact)}
                  </Tag>
                  <br />
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    P: {risk.probability.replace('_', ' ')} | I:{' '}
                    {risk.impact.replace('_', ' ')}
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default RiskMatrix;
