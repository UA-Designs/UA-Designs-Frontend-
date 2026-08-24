import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
import { ExperimentOutlined } from '@ant-design/icons';
import {
  forecastService,
  ForecastRequestError,
  ForecastScenarioType,
} from '../../../services/forecastService';
import { scheduleService, ScheduleTask } from '../../../services/scheduleService';
import { fmtDate, fmtIndex, fmtNumber, fmtPhp } from '../forecastFormat';

const { Text, Title } = Typography;

const cardStyle: React.CSSProperties = {
  background: '#1f1f1f',
  border: '1px solid rgba(0,153,68,0.2)',
  borderRadius: 12,
};

const SCENARIO_OPTIONS: { value: ForecastScenarioType; label: string }[] = [
  { value: 'ADD_WORKERS', label: 'Add workers' },
  { value: 'DELAY_TASK', label: 'Delay a task' },
  { value: 'MATERIAL_COST_INCREASE', label: 'Material cost increase' },
  { value: 'REDUCE_REMAINING_DURATION', label: 'Reduce remaining duration' },
];

function asRec(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function pickSide(raw: unknown, keys: string[]): Record<string, unknown> | null {
  const rec = asRec(raw);
  if (!rec) return null;
  for (const key of keys) {
    const found = asRec(rec[key]);
    if (found) return found;
  }
  return null;
}

function displayValue(key: string, value: unknown): string {
  if (value == null) return 'n/a';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 'n/a';
    if (/cost|budget|overrun|eac|etc|vac|amount|php/i.test(key)) return fmtPhp(value);
    if (/cpi|spi/i.test(key)) return fmtIndex(value);
    if (/progress|percent|utilisation|utilization/i.test(key)) return fmtNumber(value);
    if (/day/i.test(key)) return fmtNumber(value, 0);
    return fmtNumber(value);
  }
  if (typeof value === 'string') {
    if (/date|completion|finish/i.test(key)) return fmtDate(value);
    return value;
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return 'n/a';
}

function metricRows(side: Record<string, unknown> | null): Array<{ key: string; label: string; value: string }> {
  if (!side) return [];
  const preferred = [
    'budget',
    'actualCost',
    'forecastFinalCost',
    'expectedOverrun',
    'cpi',
    'plannedCompletion',
    'forecastCompletion',
    'expectedDelayDays',
    'spi',
    'currentProgress',
    'forecastProgress',
    'status',
  ];
  const used = new Set<string>();
  const rows: Array<{ key: string; label: string; value: string }> = [];

  for (const key of preferred) {
    if (side[key] == null) continue;
    used.add(key);
    rows.push({
      key,
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()),
      value: displayValue(key, side[key]),
    });
  }

  Object.entries(side).forEach(([key, value]) => {
    if (used.has(key)) return;
    if (value == null || typeof value === 'object') return;
    rows.push({
      key,
      label: key.replace(/([A-Z])/g, ' $1').replace(/[_-]+/g, ' ').replace(/^./, c => c.toUpperCase()),
      value: displayValue(key, value),
    });
  });

  return rows.slice(0, 12);
}

interface WhatIfPanelProps {
  projectId: string;
}

const WhatIfPanel: React.FC<WhatIfPanelProps> = ({ projectId }) => {
  const [form] = Form.useForm();
  const scenarioType = Form.useWatch('scenarioType', form) as ForecastScenarioType | undefined;
  const [tasks, setTasks] = useState<ScheduleTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    scheduleService
      .getProjectTasks(projectId)
      .then(list => {
        if (!cancelled) setTasks(list || []);
      })
      .catch(() => {
        if (!cancelled) setTasks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const run = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setError(null);
      const payload: Record<string, unknown> = { scenarioType: values.scenarioType };
      if (values.scenarioType === 'ADD_WORKERS') payload.workersToAdd = values.workersToAdd;
      if (values.scenarioType === 'DELAY_TASK') {
        payload.taskId = values.taskId;
        payload.delayDays = values.delayDays;
      }
      if (values.scenarioType === 'MATERIAL_COST_INCREASE') payload.percent = values.percent;
      if (values.scenarioType === 'REDUCE_REMAINING_DURATION') payload.percent = values.percent;
      const data = await forecastService.runForecastScenario(projectId, payload as any);
      setResult(data);
    } catch (err: any) {
      if (err?.errorFields) return;
      const status = err instanceof ForecastRequestError ? err.status : err?.status;
      if (status === 403) {
        setError('You do not have permission to run what-if scenarios.');
      } else {
        setError(err?.message || 'Failed to run scenario.');
      }
    } finally {
      setLoading(false);
    }
  };

  const baseline = pickSide(result, ['baseline', 'current', 'official', 'before']);
  const scenario = pickSide(result, ['scenario', 'whatIf', 'result', 'after', 'projected']);
  const baselineRows = metricRows(baseline);
  const scenarioRows = metricRows(scenario);
  const keys = Array.from(new Set([...baselineRows.map(r => r.key), ...scenarioRows.map(r => r.key)]));

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="SCENARIO / WHAT-IF"
        description="Results are hypothetical. Official project records and live forecast cards are not changed."
      />
      <Card style={cardStyle}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ scenarioType: 'ADD_WORKERS', workersToAdd: 3, delayDays: 10, percent: 15 }}
        >
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="scenarioType"
                label={<span style={{ color: '#bbb' }}>Scenario</span>}
                rules={[{ required: true }]}
              >
                <Select options={SCENARIO_OPTIONS} />
              </Form.Item>
            </Col>
            {scenarioType === 'ADD_WORKERS' && (
              <Col xs={24} md={8}>
                <Form.Item
                  name="workersToAdd"
                  label={<span style={{ color: '#bbb' }}>Workers to add</span>}
                  rules={[{ required: true }]}
                >
                  <InputNumber min={1} max={200} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            )}
            {scenarioType === 'DELAY_TASK' && (
              <>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="taskId"
                    label={<span style={{ color: '#bbb' }}>Task</span>}
                    rules={[{ required: true, message: 'Select a task' }]}
                  >
                    <Select
                      showSearch
                      placeholder="Select task"
                      optionFilterProp="label"
                      options={tasks.map(t => ({ value: t.id, label: t.name }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="delayDays"
                    label={<span style={{ color: '#bbb' }}>Delay (days)</span>}
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={1} max={365} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </>
            )}
            {(scenarioType === 'MATERIAL_COST_INCREASE' ||
              scenarioType === 'REDUCE_REMAINING_DURATION') && (
              <Col xs={24} md={8}>
                <Form.Item
                  name="percent"
                  label={<span style={{ color: '#bbb' }}>Percent</span>}
                  rules={[{ required: true }]}
                >
                  <InputNumber min={1} max={100} addonAfter="%" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            )}
            <Col xs={24} md={8} style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Form.Item>
                <Button
                  type="primary"
                  icon={<ExperimentOutlined />}
                  loading={loading}
                  onClick={run}
                  style={{ background: '#009944', borderColor: '#009944' }}
                >
                  Run scenario
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {error && <Alert type="error" showIcon message={error} />}

      {result != null && (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Baseline (official)" style={cardStyle}>
              {baselineRows.length === 0 && keys.length === 0 ? (
                <Text style={{ color: '#888' }}>No baseline figures returned.</Text>
              ) : (
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  {keys.map(key => {
                    const row = baselineRows.find(r => r.key === key);
                    return (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <Text style={{ color: '#888' }}>{row?.label || key}</Text>
                        <Text style={{ color: '#fff' }}>{row?.value ?? 'n/a'}</Text>
                      </div>
                    );
                  })}
                </Space>
              )}
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card
              title={
                <span>
                  Scenario / what-if <Text style={{ color: '#ffaa00', fontSize: 12 }}>hypothetical</Text>
                </span>
              }
              style={{ ...cardStyle, borderColor: 'rgba(255,170,0,0.35)' }}
            >
              {scenarioRows.length === 0 && keys.length === 0 ? (
                <Text style={{ color: '#888' }}>No scenario figures returned.</Text>
              ) : (
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  {keys.map(key => {
                    const row = scenarioRows.find(r => r.key === key);
                    return (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <Text style={{ color: '#888' }}>{row?.label || key}</Text>
                        <Text style={{ color: '#ffaa00' }}>{row?.value ?? 'n/a'}</Text>
                      </div>
                    );
                  })}
                </Space>
              )}
            </Card>
          </Col>
        </Row>
      )}
      {result != null && !baseline && !scenario && (
        <Card title="Scenario response" style={cardStyle}>
          <Title level={5} style={{ color: '#ffaa00', marginTop: 0 }}>
            SCENARIO / WHAT-IF
          </Title>
          <pre
            style={{
              color: '#bbb',
              fontSize: 12,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0,
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}
    </Space>
  );
};

export default WhatIfPanel;
