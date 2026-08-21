import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Button,
  Card,
  Collapse,
  Descriptions,
  List,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  Input,
} from 'antd';
import type { InputRef } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import {
  aiService,
  ActionProposal,
  ActionProposalStatus,
  AiChatRespondResponse,
  AiKeyResults,
  ChatIntent,
  CostKeyResults,
  RiskKeyResults,
  ScheduleKeyResults,
  userFacingAiError,
} from '../../services/aiService';
import { useAuth } from '../../contexts/AuthContext';
import './ProjectAIChat.css';

const { Text } = Typography;
const { TextArea } = Input;

const MESSAGE_MAX = 2000;
const EMPTY_LINE = 'Ask about schedule, cost, risk, or this project’s tasks.';
const DISABLED_LINE = 'The assistant is not configured on the server.';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  intent?: ChatIntent | string;
  keyResults?: AiKeyResults;
  actionProposals?: ActionProposal[];
  error?: boolean;
  retryable?: boolean;
  createdAt: number;
}

interface ThreadStore {
  conversationId: string | null;
  messages: ChatMessage[];
}

interface ProjectAIChatProps {
  projectId: string;
  assistantName?: string;
  onActionExecuted?: (proposal: ActionProposal) => void;
}

const QUICK_PROMPTS = [
  'Estimated schedule',
  'Cost forecast',
  'Top risks',
  'Overdue tasks',
];

const HIDDEN_PARAM_KEYS = new Set([
  'id',
  'taskId',
  'riskId',
  'projectId',
  'conversationId',
  'userId',
  'reason',
]);

const PARAM_LABELS: Record<string, string> = {
  taskName: 'Task',
  name: 'Name',
  title: 'Title',
  startDate: 'Start',
  endDate: 'End',
  currentStartDate: 'Current start',
  currentEndDate: 'Current end',
  newStartDate: 'New start',
  newEndDate: 'New end',
  fromDate: 'From',
  toDate: 'To',
  proposedStartDate: 'Proposed start',
  proposedEndDate: 'Proposed end',
  assignedTo: 'Assign to',
  assigneeName: 'Assign to',
  assignee: 'Assign to',
  status: 'Status',
  severity: 'Severity',
  probability: 'Probability',
  impact: 'Impact',
  duration: 'Duration',
  progress: 'Progress',
};

const mkId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const threadKey = (userId: string, projectId: string) =>
  `ua_designs_ai_thread:${userId}:${projectId}`;

const loadThread = (userId: string, projectId: string): ThreadStore => {
  try {
    const raw = sessionStorage.getItem(threadKey(userId, projectId));
    if (!raw) return { conversationId: null, messages: [] };
    const parsed = JSON.parse(raw) as ThreadStore;
    return {
      conversationId:
        typeof parsed.conversationId === 'string'
          ? parsed.conversationId
          : null,
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
    };
  } catch {
    return { conversationId: null, messages: [] };
  }
};

const saveThread = (userId: string, projectId: string, store: ThreadStore) => {
  try {
    sessionStorage.setItem(threadKey(userId, projectId), JSON.stringify(store));
  } catch {
    /* quota / private mode */
  }
};

const fmtNumber = (n?: number | null, prefix = '') =>
  n != null && Number.isFinite(n)
    ? `${prefix}${Number(n).toLocaleString('en-PH')}`
    : '—';

const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return d;
  return parsed.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const fmtDateTime = (d?: string | null) => {
  if (!d) return '';
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return d;
  return parsed.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const looksLikeDate = (key: string, value: unknown): value is string => {
  if (typeof value !== 'string' || value.length < 8) return false;
  if (/date|at$/i.test(key)) return !Number.isNaN(new Date(value).getTime());
  return (
    /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(new Date(value).getTime())
  );
};

const humanizeKey = (key: string) =>
  PARAM_LABELS[key] ||
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/^\s+/, '')
    .replace(/^./, c => c.toUpperCase());

const severityColor = (s?: string) => {
  if (!s) return 'default';
  switch (s.toUpperCase()) {
    case 'CRITICAL':
      return 'red';
    case 'HIGH':
      return 'orange';
    case 'MEDIUM':
      return 'gold';
    case 'LOW':
      return 'green';
    default:
      return 'default';
  }
};

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return undefined;
  return value as Record<string, unknown>;
};

const pickSchedule = (kr?: AiKeyResults): ScheduleKeyResults | null => {
  if (!kr) return null;
  if (kr.criticalPath || kr.finishDates || kr.totalTasks != null)
    return kr as ScheduleKeyResults;
  for (const value of Object.values(kr)) {
    const rec = asRecord(value);
    if (
      rec &&
      (rec.criticalPath || rec.finishDates || rec.totalTasks != null)
    ) {
      return rec as ScheduleKeyResults;
    }
  }
  return null;
};

const pickCost = (kr?: AiKeyResults): CostKeyResults | null => {
  if (!kr) return null;
  if (kr.baseMetrics || kr.forecasts || kr.indices) return kr as CostKeyResults;
  for (const value of Object.values(kr)) {
    const rec = asRecord(value);
    if (rec && (rec.baseMetrics || rec.forecasts || rec.indices))
      return rec as CostKeyResults;
  }
  return null;
};

const pickRisk = (kr?: AiKeyResults): RiskKeyResults | null => {
  if (!kr) return null;
  if (
    kr.summary ||
    kr.officialRisks ||
    kr.topPriorityRisks ||
    kr.scheduleImpact
  ) {
    return kr as RiskKeyResults;
  }
  for (const value of Object.values(kr)) {
    const rec = asRecord(value);
    if (rec && (rec.summary || rec.officialRisks || rec.topPriorityRisks))
      return rec as RiskKeyResults;
  }
  return null;
};

const pickOverdueList = (kr?: AiKeyResults): Array<Record<string, unknown>> => {
  if (!kr) return [];
  const candidates = [
    kr.get_overdue_tasks,
    kr.overdueTasks,
    kr.overdue,
    kr.tasks,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate))
      return candidate.filter(x => x && typeof x === 'object') as Array<
        Record<string, unknown>
      >;
    const rec = asRecord(candidate);
    if (Array.isArray(rec?.tasks)) {
      return rec.tasks.filter(x => x && typeof x === 'object') as Array<
        Record<string, unknown>
      >;
    }
    if (Array.isArray(rec?.items)) {
      return rec.items.filter(x => x && typeof x === 'object') as Array<
        Record<string, unknown>
      >;
    }
  }
  return [];
};

const hasStructuredSupplement = (kr?: AiKeyResults, intent?: string) => {
  if (!kr) return false;
  const keys = Object.keys(kr).filter(
    k => k !== 'toolsUsed' && k !== 'toolStatus'
  );
  if (keys.length === 0) return false;
  if (
    pickSchedule(kr) ||
    pickCost(kr) ||
    pickRisk(kr) ||
    pickOverdueList(kr).length > 0
  )
    return true;
  if (
    intent === 'schedule_estimate' ||
    intent === 'cost_forecast' ||
    intent === 'risk_summary' ||
    intent === 'schedule_impact' ||
    intent === 'project_summary' ||
    intent === 'resource_summary'
  ) {
    return keys.length > 0;
  }
  return (
    pickOverdueList(kr).length > 0 ||
    Boolean(pickSchedule(kr) || pickCost(kr) || pickRisk(kr))
  );
};

const actionTypeLabel = (type: string) => {
  switch (type) {
    case 'CREATE_TASK':
      return 'Create task';
    case 'UPDATE_TASK':
      return 'Update task';
    case 'ASSIGN_TASK':
      return 'Assign task';
    case 'RESCHEDULE_TASK':
      return 'Reschedule';
    case 'CREATE_RISK':
      return 'Record a risk';
    case 'UPDATE_RISK':
      return 'Update risk';
    case 'APPLY_SCHEDULE':
      return 'Apply schedule';
    default:
      return type
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/^\w/, c => c.toUpperCase());
  }
};

const proposalName = (params: Record<string, unknown>) => {
  const value =
    params.taskName ?? params.name ?? params.title ?? params.riskTitle;
  return typeof value === 'string' && value.trim() ? value.trim() : '';
};

const proposalHeadline = (proposal: ActionProposal) => {
  const name = proposalName(proposal.parameters || {});
  if (proposal.type === 'RESCHEDULE_TASK' && name) return `Move ${name}`;
  if (proposal.type === 'CREATE_TASK' && name) return `Create ${name}`;
  if (proposal.type === 'ASSIGN_TASK' && name) return `Assign ${name}`;
  if (proposal.type === 'UPDATE_TASK' && name) return `Update ${name}`;
  if (proposal.type === 'CREATE_RISK' && name) return name;
  if (proposal.type === 'UPDATE_RISK' && name) return name;
  return name || actionTypeLabel(String(proposal.type));
};

const specRowsForProposal = (
  proposal: ActionProposal
): Array<{ label: string; value: string }> => {
  const params = proposal.parameters || {};
  const rows: Array<{ label: string; value: string }> = [];
  const used = new Set<string>();

  const current =
    params.currentEndDate ??
    params.fromDate ??
    params.currentStartDate ??
    params.startDate;
  const proposed =
    params.newEndDate ??
    params.toDate ??
    params.proposedEndDate ??
    params.newStartDate ??
    params.endDate;

  if (proposal.type === 'RESCHEDULE_TASK' && (current || proposed)) {
    if (
      looksLikeDate('endDate', current) ||
      looksLikeDate('endDate', proposed)
    ) {
      rows.push({
        label: 'Dates',
        value: `${fmtDate(typeof current === 'string' ? current : undefined)} → ${fmtDate(
          typeof proposed === 'string' ? proposed : undefined
        )}`,
      });
      used.add('currentEndDate');
      used.add('fromDate');
      used.add('currentStartDate');
      used.add('startDate');
      used.add('newEndDate');
      used.add('toDate');
      used.add('proposedEndDate');
      used.add('newStartDate');
      used.add('endDate');
    }
  }

  const name = proposalName(params);
  if (name && proposal.type !== 'RESCHEDULE_TASK') {
    rows.push({
      label: params.title || params.riskTitle ? 'Title' : 'Task',
      value: name,
    });
    used.add('taskName');
    used.add('name');
    used.add('title');
    used.add('riskTitle');
  }

  Object.entries(params).forEach(([key, value]) => {
    if (used.has(key) || HIDDEN_PARAM_KEYS.has(key)) return;
    if (value == null || value === '') return;
    if (typeof value === 'object') return;
    const display = looksLikeDate(key, value) ? fmtDate(value) : String(value);
    rows.push({ label: humanizeKey(key), value: display });
  });

  return rows.slice(0, 8);
};

const ScheduleCard: React.FC<{ kr: ScheduleKeyResults }> = ({ kr }) => (
  <div>
    <Descriptions
      className="ua-ai-desc"
      size="small"
      column={2}
      style={{ marginBottom: 8 }}
    >
      <Descriptions.Item label="Total tasks">
        {kr.totalTasks ?? '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Critical path">
        {kr.criticalPath?.taskCount ?? '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Duration">
        {kr.criticalPath?.durationDays != null
          ? `${kr.criticalPath.durationDays} days`
          : '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Risk delay">
        {kr.finishDates?.totalProjectRiskDelayDays != null
          ? `+${kr.finishDates.totalProjectRiskDelayDays} days`
          : '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Baseline finish">
        {fmtDate(kr.finishDates?.baselineFinishDate)}
      </Descriptions.Item>
      <Descriptions.Item label="Risk-adjusted">
        {fmtDate(kr.finishDates?.riskAdjustedFinishDate)}
      </Descriptions.Item>
    </Descriptions>
    {kr.criticalPath?.tasks && kr.criticalPath.tasks.length > 0 && (
      <Table
        size="small"
        pagination={false}
        rowKey={(r, i) => r.name ?? String(i)}
        dataSource={kr.criticalPath.tasks}
        columns={[
          {
            title: 'Task',
            dataIndex: 'name',
            render: (v: string) => (
              <Text style={{ color: '#fff', fontSize: 12 }}>{v ?? '—'}</Text>
            ),
          },
          {
            title: 'Start',
            dataIndex: 'startDate',
            render: (v: string) => (
              <Text style={{ color: '#b3b3b3', fontSize: 12 }}>
                {fmtDate(v)}
              </Text>
            ),
          },
          {
            title: 'End',
            dataIndex: 'endDate',
            render: (v: string) => (
              <Text style={{ color: '#b3b3b3', fontSize: 12 }}>
                {fmtDate(v)}
              </Text>
            ),
          },
        ]}
      />
    )}
  </div>
);

const CostCard: React.FC<{ kr: CostKeyResults }> = ({ kr }) => (
  <Descriptions className="ua-ai-desc" size="small" column={2}>
    <Descriptions.Item label="BAC">
      {fmtNumber(kr.baseMetrics?.BAC, '₱')}
    </Descriptions.Item>
    <Descriptions.Item label="AC">
      {fmtNumber(kr.baseMetrics?.AC, '₱')}
    </Descriptions.Item>
    <Descriptions.Item label="EV">
      {fmtNumber(kr.baseMetrics?.EV, '₱')}
    </Descriptions.Item>
    <Descriptions.Item label="PV">
      {fmtNumber(kr.baseMetrics?.PV, '₱')}
    </Descriptions.Item>
    <Descriptions.Item label="CPI">
      {kr.indices?.CPI != null ? Number(kr.indices.CPI).toFixed(2) : '—'}
    </Descriptions.Item>
    <Descriptions.Item label="SPI">
      {kr.indices?.SPI != null ? Number(kr.indices.SPI).toFixed(2) : '—'}
    </Descriptions.Item>
    <Descriptions.Item label="EAC">
      {fmtNumber(kr.forecasts?.EAC, '₱')}
    </Descriptions.Item>
    <Descriptions.Item label="VAC">
      {fmtNumber(kr.forecasts?.VAC, '₱')}
    </Descriptions.Item>
  </Descriptions>
);

const RiskCard: React.FC<{ kr: RiskKeyResults }> = ({ kr }) => {
  const summary = kr.summary;
  const topRisks = kr.topPriorityRisks ?? kr.officialRisks ?? [];
  return (
    <div>
      {summary && (
        <Space wrap style={{ marginBottom: 8 }}>
          <Tag>Total: {summary.total ?? '—'}</Tag>
          {summary.critical != null && summary.critical > 0 && (
            <Tag color="red">Critical: {summary.critical}</Tag>
          )}
          {summary.high != null && summary.high > 0 && (
            <Tag color="orange">High: {summary.high}</Tag>
          )}
          {summary.medium != null && summary.medium > 0 && (
            <Tag color="gold">Medium: {summary.medium}</Tag>
          )}
          {summary.low != null && summary.low > 0 && (
            <Tag color="green">Low: {summary.low}</Tag>
          )}
        </Space>
      )}
      {kr.scheduleImpact && (
        <Descriptions
          className="ua-ai-desc"
          size="small"
          column={2}
          style={{ marginBottom: 8 }}
        >
          <Descriptions.Item label="Risk delay">
            {kr.scheduleImpact.totalDelayDays != null
              ? `${kr.scheduleImpact.totalDelayDays} days`
              : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Risk-adjusted">
            {fmtDate(kr.scheduleImpact.riskAdjustedFinishDate)}
          </Descriptions.Item>
        </Descriptions>
      )}
      {topRisks.length > 0 && (
        <List
          size="small"
          dataSource={topRisks.slice(0, 5)}
          renderItem={r => (
            <List.Item
              style={{ padding: '4px 0', borderBottom: '1px solid #333333' }}
            >
              <Space>
                <Tag color={severityColor(r.severity)}>{r.severity ?? '—'}</Tag>
                <Text style={{ color: '#fff', fontSize: 12 }}>
                  {r.title ?? '—'}
                </Text>
              </Space>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

const OverdueCard: React.FC<{ items: Array<Record<string, unknown>> }> = ({
  items,
}) => (
  <List
    size="small"
    dataSource={items.slice(0, 8)}
    renderItem={item => (
      <List.Item
        style={{ padding: '6px 0', borderBottom: '1px solid #333333' }}
      >
        <div style={{ width: '100%' }}>
          <Text style={{ color: '#fff', fontSize: 13, display: 'block' }}>
            {String(item.name ?? item.title ?? 'Task')}
          </Text>
          <Text style={{ color: '#808080', fontSize: 12 }}>
            Due{' '}
            {fmtDate(
              typeof item.dueDate === 'string'
                ? item.dueDate
                : typeof item.endDate === 'string'
                  ? item.endDate
                  : undefined
            )}
            {item.status ? ` · ${String(item.status)}` : ''}
          </Text>
        </div>
      </List.Item>
    )}
  />
);

const KeyResultsSupplement: React.FC<{
  intent?: string;
  keyResults?: AiKeyResults;
}> = ({ intent, keyResults }) => {
  if (!hasStructuredSupplement(keyResults, intent)) return null;

  const schedule = pickSchedule(keyResults);
  const cost = pickCost(keyResults);
  const risk = pickRisk(keyResults);
  const overdue = pickOverdueList(keyResults);

  let label = 'Supporting figures';
  if (overdue.length) label = 'Overdue tasks';
  else if (schedule) label = 'Schedule figures';
  else if (cost) label = 'Cost figures';
  else if (risk) label = 'Risk figures';

  return (
    <div className="ua-ai-supplement">
      <Collapse
        ghost
        items={[
          {
            key: 'figures',
            label,
            children: (
              <>
                {overdue.length > 0 && <OverdueCard items={overdue} />}
                {schedule && <ScheduleCard kr={schedule} />}
                {cost && <CostCard kr={cost} />}
                {risk && <RiskCard kr={risk} />}
              </>
            ),
          },
        ]}
      />
    </div>
  );
};

interface ProposalCardProps {
  proposal: ActionProposal;
  busy: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  busy,
  onApprove,
  onReject,
}) => {
  const status = String(proposal.status || 'PENDING_APPROVAL').toUpperCase() as
    | ActionProposalStatus
    | string;
  const pending = status === 'PENDING_APPROVAL';
  const executed = status === 'EXECUTED';
  const rejected = status === 'REJECTED';
  const failed = status === 'FAILED';
  const rows = specRowsForProposal(proposal);
  const stamp = fmtDateTime(proposal.decidedAt);

  let lockedClass = '';
  if (!pending)
    lockedClass = failed ? 'ua-ai-proposal--failed' : 'ua-ai-proposal--locked';

  return (
    <div className={`ua-ai-proposal ${lockedClass}`}>
      <div className="ua-ai-proposal__kicker">AI Recommendation</div>
      <h4 className="ua-ai-proposal__title">{proposalHeadline(proposal)}</h4>
      {rows.length > 0 && (
        <div className="ua-ai-spec">
          {rows.map(row => (
            <div className="ua-ai-spec__row" key={`${row.label}-${row.value}`}>
              <span className="ua-ai-spec__label">{row.label}</span>
              <span className="ua-ai-spec__value">{row.value}</span>
            </div>
          ))}
        </div>
      )}
      {proposal.reason && (
        <p className="ua-ai-proposal__reason">Reason: {proposal.reason}</p>
      )}
      {pending && (
        <div className="ua-ai-proposal__actions">
          <Button
            type="primary"
            size="small"
            loading={busy}
            disabled={busy}
            onClick={() => onApprove(proposal.id)}
            style={{ background: '#009944', borderColor: '#009944' }}
          >
            Approve
          </Button>
          <Button
            size="small"
            disabled={busy}
            onClick={() => onReject(proposal.id)}
          >
            Dismiss
          </Button>
        </div>
      )}
      {executed && (
        <div className="ua-ai-proposal__status">
          Approved{stamp ? ` · ${stamp}` : ''}. The change has been applied.
        </div>
      )}
      {rejected && (
        <div className="ua-ai-proposal__status">
          Declined{stamp ? ` · ${stamp}` : ''}.
        </div>
      )}
      {failed && (
        <div className="ua-ai-proposal__status">
          This change could not be applied.
        </div>
      )}
    </div>
  );
};

const ProjectAIChat: React.FC<ProjectAIChatProps> = ({
  projectId,
  assistantName = 'NUKI',
  onActionExecuted,
}) => {
  const { user } = useAuth();
  const userId = user?.id || 'anon';
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<InputRef>(null);

  const initial = useMemo(
    () => loadThread(userId, projectId),
    [userId, projectId]
  );
  const [conversationId, setConversationId] = useState<string | null>(
    initial.conversationId
  );
  const [messages, setMessages] = useState<ChatMessage[]>(initial.messages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [busyProposalId, setBusyProposalId] = useState<string | null>(null);
  const [retryText, setRetryText] = useState<string | null>(null);

  useEffect(() => {
    saveThread(userId, projectId, { conversationId, messages });
  }, [userId, projectId, conversationId, messages]);

  useEffect(() => {
    let cancelled = false;
    aiService.checkHealth().then(health => {
      if (!cancelled) setConfigured(health.configured);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const scrollToBottom = () => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    requestAnimationFrame(scrollToBottom);
  }, [messages, loading]);

  const overLimit = input.length > MESSAGE_MAX;
  const canSend = Boolean(input.trim()) && !overLimit && !loading && configured;

  const appendAssistant = (res: AiChatRespondResponse) => {
    if (res.conversationId) setConversationId(res.conversationId);
    setMessages(prev => [
      ...prev,
      {
        id: mkId(),
        role: 'assistant',
        text: res.replyText || 'No response was returned.',
        intent: res.intent,
        keyResults: res.keyResults,
        actionProposals: res.actionProposals,
        createdAt: Date.now(),
      },
    ]);
  };

  const handleSend = async (messageText?: string) => {
    const text = (messageText ?? input).trim();
    if (!text || loading || !configured) return;
    if (text.length > MESSAGE_MAX) return;

    setInput('');
    setRetryText(text);
    setMessages(prev => [
      ...prev,
      { id: mkId(), role: 'user', text, createdAt: Date.now() },
    ]);
    setLoading(true);

    try {
      const res = await aiService.chat(
        projectId,
        text,
        conversationId || undefined
      );
      appendAssistant(res);
    } catch (err) {
      const mapped = userFacingAiError(err);
      if (mapped.code === 'AI_NOT_CONFIGURED' || mapped.status === 503) {
        setConfigured(false);
      }
      setMessages(prev => [
        ...prev,
        {
          id: mkId(),
          role: 'assistant',
          text: mapped.text,
          error: true,
          retryable: mapped.retryable,
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const handleNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setRetryText(null);
    setInput('');
    saveThread(userId, projectId, { conversationId: null, messages: [] });
    inputRef.current?.focus();
  };

  const patchProposal = useCallback(
    (proposalId: string, next: ActionProposal) => {
      setMessages(prev =>
        prev.map(msg => ({
          ...msg,
          actionProposals: msg.actionProposals?.map(p =>
            p.id === proposalId ? { ...p, ...next } : p
          ),
        }))
      );
    },
    []
  );

  const handleApprove = async (id: string) => {
    setBusyProposalId(id);
    try {
      const res = await aiService.approveAction(id);
      const decided: ActionProposal = {
        ...res.data,
        decidedAt: res.data.decidedAt || new Date().toISOString(),
      };
      patchProposal(id, decided);
      if (String(decided.status).toUpperCase() === 'EXECUTED') {
        onActionExecuted?.(decided);
      }
    } catch (err) {
      const mapped = userFacingAiError(err);
      setMessages(prev => [
        ...prev,
        {
          id: mkId(),
          role: 'assistant',
          text: mapped.text,
          error: true,
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setBusyProposalId(null);
    }
  };

  const handleReject = async (id: string) => {
    setBusyProposalId(id);
    try {
      const res = await aiService.rejectAction(id);
      patchProposal(id, {
        ...res.data,
        decidedAt: res.data.decidedAt || new Date().toISOString(),
      });
    } catch (err) {
      const mapped = userFacingAiError(err);
      setMessages(prev => [
        ...prev,
        {
          id: mkId(),
          role: 'assistant',
          text: mapped.text,
          error: true,
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setBusyProposalId(null);
    }
  };

  const showEmpty = messages.length === 0 && !loading && configured;
  const countClass = overLimit
    ? 'ua-ai-composer__count ua-ai-composer__count--warn'
    : 'ua-ai-composer__count';

  return (
    <Card
      className="ua-ai-panel"
      title={assistantName}
      extra={
        <Button
          type="text"
          className="ua-ai-panel__new"
          onClick={handleNewConversation}
          disabled={loading}
        >
          New conversation
        </Button>
      }
    >
      <div
        className="ua-ai-thread"
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label={`${assistantName} conversation`}
      >
        {!configured && (
          <div className="ua-ai-disabled">
            <p>{DISABLED_LINE}</p>
          </div>
        )}
        {showEmpty && (
          <div className="ua-ai-empty">
            <p>{EMPTY_LINE}</p>
          </div>
        )}
        {configured &&
          messages.map(msg => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`ua-ai-turn ${isUser ? 'ua-ai-turn--user' : ''}`}
              >
                <div
                  className={`ua-ai-msg ${isUser ? 'ua-ai-msg--user' : 'ua-ai-msg--assistant'} ${msg.error ? 'ua-ai-msg--error' : ''}`}
                >
                  {!isUser && (
                    <span className="ua-ai-label">{assistantName}</span>
                  )}
                  <p>{msg.text}</p>
                  {msg.error && msg.retryable && retryText && (
                    <div className="ua-ai-retry">
                      <Button
                        size="small"
                        onClick={() => handleSend(retryText)}
                        disabled={loading}
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                  {!isUser && !msg.error && (
                    <KeyResultsSupplement
                      intent={msg.intent}
                      keyResults={msg.keyResults}
                    />
                  )}
                  {!isUser &&
                    msg.actionProposals?.map(proposal => (
                      <ProposalCard
                        key={proposal.id}
                        proposal={proposal}
                        busy={busyProposalId === proposal.id}
                        onApprove={handleApprove}
                        onReject={handleReject}
                      />
                    ))}
                </div>
              </div>
            );
          })}
        {loading && (
          <div className="ua-ai-thinking">
            <Spin size="small" />
            <span>Working</span>
          </div>
        )}
      </div>

      <div className="ua-ai-composer">
        <div className="ua-ai-composer__row">
          <TextArea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={
              configured
                ? 'Write a question about this project'
                : 'Assistant unavailable'
            }
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={loading || !configured}
            maxLength={MESSAGE_MAX + 200}
            aria-label="Message to assistant"
            onPressEnter={e => {
              if (!e.shiftKey) {
                e.preventDefault();
                if (canSend) handleSend();
              }
            }}
          />
          <Button
            type="primary"
            className="ua-ai-composer__send"
            icon={<SendOutlined />}
            onClick={() => handleSend()}
            disabled={!canSend}
            aria-label="Send message"
          >
            Send
          </Button>
        </div>
        <div className="ua-ai-composer__meta">
          {configured && messages.length === 0 && (
            <div className="ua-ai-prompts">
              {QUICK_PROMPTS.map(label => (
                <Button
                  key={label}
                  size="small"
                  disabled={loading}
                  onClick={() => handleSend(label)}
                >
                  {label}
                </Button>
              ))}
            </div>
          )}
          {input.length > 0 && (
            <span className={countClass}>
              {input.length}/{MESSAGE_MAX}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProjectAIChat;
