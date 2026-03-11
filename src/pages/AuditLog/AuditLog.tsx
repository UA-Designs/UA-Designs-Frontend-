import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Typography, Space, Tag, Select, Button, Drawer,
  Row, Col, Spin, Alert, Tooltip, DatePicker, Descriptions, Badge,
  Empty, Divider, Input, Grid,
} from 'antd';
import {
  AuditOutlined, ReloadOutlined, FilterOutlined, CloseOutlined,
  UserOutlined, CodeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { ColumnsType } from 'antd/es/table';
import { auditService } from '../../services/auditService';
import { authService } from '../../services/authService';
import type {
  AuditLogEntry, AuditLogFilters, AuditAction, AuditEntity, User,
} from '../../types';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

// ── Dark theme constants ─────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: '#1f1f1f',
  border: '1px solid rgba(0,153,68,0.2)',
  borderRadius: 12,
};
const cardBody = { padding: '20px 24px' };

// ── Action badge colors ──────────────────────────────────────────────────────
const ACTION_COLOR: Record<AuditAction, string> = {
  CREATE:          '#52c41a',
  UPDATE:          '#1890ff',
  DELETE:          '#ff4d4f',
  STATUS_CHANGE:   '#722ed1',
  LOGIN:           '#8c8c8c',
  LOGOUT:          '#595959',
  REGISTER:        '#13c2c2',
  PASSWORD_CHANGE: '#faad14',
  APPROVE:         '#00b96b',
  REJECT:          '#fa8c16',
  ESCALATE:        '#eb2f96',
};

const ACTION_LABEL: Record<AuditAction, string> = {
  CREATE:          'Create',
  UPDATE:          'Update',
  DELETE:          'Delete',
  STATUS_CHANGE:   'Status Change',
  LOGIN:           'Login',
  LOGOUT:          'Logout',
  REGISTER:        'Register',
  PASSWORD_CHANGE: 'Password',
  APPROVE:         'Approve',
  REJECT:          'Reject',
  ESCALATE:        'Escalate',
};

// ── Method badge colors ──────────────────────────────────────────────────────
const METHOD_COLOR: Record<string, string> = {
  POST:   '#52c41a',
  PUT:    '#1890ff',
  PATCH:  '#faad14',
  DELETE: '#ff4d4f',
};

// ── Filter option lists ──────────────────────────────────────────────────────
const ACTION_OPTIONS: AuditAction[] = [
  'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE',
  'LOGIN', 'LOGOUT', 'REGISTER', 'PASSWORD_CHANGE',
  'APPROVE', 'REJECT', 'ESCALATE',
];

const ENTITY_OPTIONS: AuditEntity[] = [
  'PROJECT', 'TASK', 'BUDGET', 'EXPENSE', 'COST',
  'RISK', 'MITIGATION', 'STAKEHOLDER', 'COMMUNICATION',
  'USER', 'MATERIAL', 'LABOR', 'EQUIPMENT',
  'TEAM_MEMBER', 'ALLOCATION', 'DEPENDENCY',
];

// ── Helper: format entity label ──────────────────────────────────────────────
const fmtEntity = (e: string) =>
  e.charAt(0) + e.slice(1).toLowerCase().replace(/_/g, ' ');

// ── Helper: HTTP status code color ───────────────────────────────────────────
const statusColor = (code: number) => {
  if (code < 300) return '#52c41a';
  if (code < 400) return '#1890ff';
  if (code < 500) return '#faad14';
  return '#ff4d4f';
};

// ────────────────────────────────────────────────────────────────────────────
const AuditLog: React.FC = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  // ── State ──────────────────────────────────────────────────────────────────
  const [entries, setEntries]       = useState<AuditLogEntry[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 25,
    sortOrder: 'DESC',
  });

  // user dropdown
  const [users, setUsers]           = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // detail drawer
  const [drawerOpen, setDrawerOpen]         = useState(false);
  const [selectedEntry, setSelectedEntry]   = useState<AuditLogEntry | null>(null);
  const [detailLoading, setDetailLoading]   = useState(false);

  // ── Load users for filter dropdown ────────────────────────────────────────
  useEffect(() => {
    authService.getUsers()
      .then(setUsers)
      .catch(() => {});
  }, []);

  // ── Load audit logs ────────────────────────────────────────────────────────
  const loadLogs = useCallback(async (f: AuditLogFilters) => {
    setLoading(true);
    setError(null);
    try {
      const res = await auditService.getLogs(f);
      setEntries(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs(filters);
  }, [filters, loadLogs]);

  // ── Filter helpers ─────────────────────────────────────────────────────────
  const updateFilter = (patch: Partial<AuditLogFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...patch,
      // reset to page 1 unless page itself is being updated
      ...(!('page' in patch) ? { page: 1 } : {}),
    }));
  };

  const clearFilters = () =>
    setFilters({ page: 1, limit: 25, sortOrder: 'DESC' });

  const hasActiveFilters =
    !!(filters.action || filters.entity || filters.userId ||
       filters.startDate || filters.endDate);

  // ── Open detail drawer ─────────────────────────────────────────────────────
  const openDetail = async (entry: AuditLogEntry) => {
    setSelectedEntry(entry);
    setDrawerOpen(true);
    // Re-fetch for full details if needed
    if (!entry.details) {
      setDetailLoading(true);
      try {
        const res = await auditService.getLogById(entry.id);
        setSelectedEntry(res.data);
      } catch {
        // use what we already have
      } finally {
        setDetailLoading(false);
      }
    }
  };

  // ── Filtered user list ─────────────────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    return (
      !q ||
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns: ColumnsType<AuditLogEntry> = [
    {
      title: 'Timestamp',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (val: string) => (
        <Tooltip title={dayjs(val).format('YYYY-MM-DD HH:mm:ss')}>
          <Text style={{ color: '#aaa', fontSize: 12 }}>
            {dayjs(val).fromNow()}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'User',
      key: 'user',
      width: 160,
      render: (_: unknown, row: AuditLogEntry) =>
        row.user ? (
          <Space size={4}>
            <UserOutlined style={{ color: '#009944', fontSize: 12 }} />
            <Text style={{ color: '#fff', fontSize: 13 }}>
              {row.user.firstName} {row.user.lastName}
            </Text>
          </Space>
        ) : (
          <Text style={{ color: '#595959', fontSize: 12 }}>System</Text>
        ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 130,
      render: (action: AuditAction) => (
        <Tag
          color={ACTION_COLOR[action] || '#8c8c8c'}
          style={{ fontSize: 11, fontWeight: 600 }}
        >
          {ACTION_LABEL[action] || action}
        </Tag>
      ),
    },
    {
      title: 'Entity',
      dataIndex: 'entity',
      key: 'entity',
      width: 120,
      render: (entity: AuditEntity) => (
        <Tag
          style={{
            background: 'rgba(0,153,68,0.15)',
            borderColor: 'rgba(0,153,68,0.4)',
            color: '#00ff88',
            fontSize: 11,
          }}
        >
          {fmtEntity(entity)}
        </Tag>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => (
        <Text style={{ color: '#d9d9d9', fontSize: 13 }}>{desc}</Text>
      ),
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (method: string) => (
        <Tag
          color={METHOD_COLOR[method] || '#8c8c8c'}
          style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700 }}
        >
          {method}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'statusCode',
      key: 'statusCode',
      width: 70,
      render: (code: number) => (
        <Text style={{ color: statusColor(code), fontWeight: 700, fontSize: 13 }}>
          {code}
        </Text>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: isMobile ? '0 8px 24px' : '0 0 24px' }}>
      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Space>
          <AuditOutlined style={{ color: '#009944', fontSize: 22 }} />
          <div>
            <Title level={3} style={{ color: '#ffffff', margin: 0 }}>Audit Log</Title>
            <Text style={{ color: '#8c8c8c', fontSize: 12 }}>
              Read-only system activity log — {total.toLocaleString()} total entries
            </Text>
          </div>
        </Space>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => loadLogs(filters)}
          loading={loading}
          style={{ color: '#009944', borderColor: '#009944' }}
        >
          Refresh
        </Button>
      </div>

      {/* ── Filter bar ── */}
      <Card style={cardStyle} bodyStyle={{ padding: '16px 20px' }}>
        <Row gutter={[12, 12]} align="middle">
          <Col>
            <FilterOutlined style={{ color: '#009944' }} />
          </Col>

          {/* Action */}
          <Col xs={24} sm={12} md={5}>
            <Select
              allowClear
              placeholder="All Actions"
              value={filters.action}
              onChange={v => updateFilter({ action: v })}
              style={{ width: '100%' }}
            >
              {ACTION_OPTIONS.map(a => (
                <Option key={a} value={a}>
                  <Tag color={ACTION_COLOR[a]} style={{ fontSize: 11 }}>
                    {ACTION_LABEL[a]}
                  </Tag>
                </Option>
              ))}
            </Select>
          </Col>

          {/* Entity */}
          <Col xs={24} sm={12} md={5}>
            <Select
              allowClear
              placeholder="All Entities"
              value={filters.entity}
              onChange={v => updateFilter({ entity: v })}
              style={{ width: '100%' }}
            >
              {ENTITY_OPTIONS.map(e => (
                <Option key={e} value={e}>{fmtEntity(e)}</Option>
              ))}
            </Select>
          </Col>

          {/* User */}
          <Col xs={24} sm={12} md={5}>
            <Select
              allowClear
              showSearch
              placeholder="All Users"
              value={filters.userId}
              onSearch={setUserSearch}
              onChange={v => updateFilter({ userId: v })}
              filterOption={false}
              style={{ width: '100%' }}
            >
              {filteredUsers.map(u => (
                <Option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </Option>
              ))}
            </Select>
          </Col>

          {/* Date range */}
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={[
                filters.startDate ? dayjs(filters.startDate) : null,
                filters.endDate   ? dayjs(filters.endDate)   : null,
              ]}
              onChange={dates => updateFilter({
                startDate: dates?.[0]?.toISOString() || undefined,
                endDate:   dates?.[1]?.toISOString() || undefined,
              })}
            />
          </Col>

          {/* Sort order + clear */}
          <Col>
            <Space>
              <Select
                value={filters.sortOrder || 'DESC'}
                onChange={v => updateFilter({ sortOrder: v })}
                style={{ width: 90 }}
              >
                <Option value="DESC">Newest</Option>
                <Option value="ASC">Oldest</Option>
              </Select>
              {hasActiveFilters && (
                <Button
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={clearFilters}
                  style={{ color: '#ff4d4f', borderColor: '#ff4d4f' }}
                >
                  Clear
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* ── Error ── */}
      {error && (
        <Alert
          message="Failed to load audit logs"
          description={error}
          type="error"
          showIcon
          style={{ margin: '16px 0' }}
        />
      )}

      {/* ── Table ── */}
      <Card style={{ ...cardStyle, marginTop: 16 }} bodyStyle={cardBody}>
        <Table<AuditLogEntry>
          columns={columns}
          dataSource={entries}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          onRow={entry => ({ onClick: () => openDetail(entry), style: { cursor: 'pointer' } })}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text style={{ color: '#595959' }}>
                    {hasActiveFilters
                      ? 'No entries match the selected filters.'
                      : 'No audit log entries found.'}
                  </Text>
                }
              >
                {hasActiveFilters && (
                  <Button size="small" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </Empty>
            ),
          }}
          pagination={{
            current: filters.page || 1,
            pageSize: filters.limit || 25,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['25', '50', '100'],
            showTotal: (t, [s, e]) => (
              <Text style={{ color: '#8c8c8c' }}>
                {s}–{e} of {t.toLocaleString()} entries
              </Text>
            ),
            onChange: (page, pageSize) =>
              updateFilter({ page, limit: pageSize }),
            style: { marginTop: 16 },
          }}
          rowClassName={() => 'audit-row'}
          style={{ overflowX: 'auto' }}
        />
      </Card>

      {/* ── Detail Drawer ── */}
      <Drawer
        title={
          <Space>
            <AuditOutlined style={{ color: '#009944' }} />
            <Text strong style={{ color: '#fff' }}>Audit Entry Detail</Text>
          </Space>
        }
        placement="right"
        width={600}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { background: '#141414', padding: 24 }, header: { background: '#1f1f1f', borderBottom: '1px solid rgba(0,153,68,0.2)' } }}
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : selectedEntry ? (
          <div>
            {/* Description */}
            <Card style={{ ...cardStyle, marginBottom: 16 }} bodyStyle={{ padding: 16 }}>
              <Text style={{ color: '#fff', fontSize: 14 }}>{selectedEntry.description}</Text>
              <div style={{ marginTop: 8 }}>
                <Text style={{ color: '#8c8c8c', fontSize: 12 }}>
                  {dayjs(selectedEntry.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                  {' · '}
                  {dayjs(selectedEntry.createdAt).fromNow()}
                </Text>
              </div>
            </Card>

            {/* Metadata */}
            <Card
              title={<Text style={{ color: '#00ff88', fontSize: 13 }}>Metadata</Text>}
              style={cardStyle}
              bodyStyle={{ padding: 16 }}
              headStyle={{ background: '#1f1f1f', borderBottom: '1px solid rgba(0,153,68,0.2)', minHeight: 40, padding: '8px 16px' }}
            >
              <Descriptions column={1} size="small" labelStyle={{ color: '#8c8c8c', width: 120 }} contentStyle={{ color: '#fff' }}>
                <Descriptions.Item label="User">
                  {selectedEntry.user
                    ? `${selectedEntry.user.firstName} ${selectedEntry.user.lastName} (${selectedEntry.user.email})`
                    : <Text style={{ color: '#595959' }}>System</Text>}
                </Descriptions.Item>
                <Descriptions.Item label="Action">
                  <Tag color={ACTION_COLOR[selectedEntry.action]} style={{ fontSize: 11, fontWeight: 600 }}>
                    {ACTION_LABEL[selectedEntry.action] || selectedEntry.action}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Entity">
                  <Space>
                    <Tag style={{ background: 'rgba(0,153,68,0.15)', borderColor: 'rgba(0,153,68,0.4)', color: '#00ff88', fontSize: 11 }}>
                      {fmtEntity(selectedEntry.entity)}
                    </Tag>
                    {selectedEntry.entityId && (
                      <Text copyable style={{ color: '#8c8c8c', fontSize: 11 }}>
                        {selectedEntry.entityId}
                      </Text>
                    )}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Method">
                  <Tag color={METHOD_COLOR[selectedEntry.method] || '#8c8c8c'} style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11 }}>
                    {selectedEntry.method}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Path">
                  <Text code style={{ fontSize: 12, color: '#aaa' }}>{selectedEntry.path}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Badge
                    color={statusColor(selectedEntry.statusCode)}
                    text={
                      <Text style={{ color: statusColor(selectedEntry.statusCode), fontWeight: 700 }}>
                        {selectedEntry.statusCode}
                      </Text>
                    }
                  />
                </Descriptions.Item>
                {selectedEntry.ipAddress && (
                  <Descriptions.Item label="IP Address">
                    <Text style={{ color: '#aaa', fontFamily: 'monospace', fontSize: 12 }}>
                      {selectedEntry.ipAddress}
                    </Text>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Entry ID">
                  <Text copyable style={{ color: '#595959', fontSize: 11 }}>
                    {selectedEntry.id}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Details JSON */}
            {selectedEntry.details && Object.keys(selectedEntry.details).length > 0 && (
              <>
                <Divider style={{ borderColor: 'rgba(0,153,68,0.2)', margin: '16px 0' }} />
                <Card
                  title={
                    <Space>
                      <CodeOutlined style={{ color: '#009944' }} />
                      <Text style={{ color: '#00ff88', fontSize: 13 }}>Details</Text>
                    </Space>
                  }
                  style={cardStyle}
                  bodyStyle={{ padding: 0 }}
                  headStyle={{ background: '#1f1f1f', borderBottom: '1px solid rgba(0,153,68,0.2)', minHeight: 40, padding: '8px 16px' }}
                >
                  <pre
                    style={{
                      background: '#0d0d0d',
                      color: '#00ff88',
                      padding: 16,
                      margin: 0,
                      fontSize: 12,
                      overflowX: 'auto',
                      borderRadius: '0 0 12px 12px',
                      fontFamily: '"Fira Code", monospace',
                      maxHeight: 400,
                      overflowY: 'auto',
                    }}
                  >
                    {JSON.stringify(selectedEntry.details, null, 2)}
                  </pre>
                </Card>
              </>
            )}
          </div>
        ) : null}
      </Drawer>

      {/* ── Row hover style ── */}
      <style>{`
        .audit-row:hover td { background: rgba(0, 153, 68, 0.06) !important; }
      `}</style>
    </div>
  );
};

export default AuditLog;
