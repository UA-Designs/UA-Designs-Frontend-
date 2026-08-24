import { AxiosError } from 'axios';
import { apiService } from './api';

const CHAT_TIMEOUT_MS = 90_000;
const ACTION_TIMEOUT_MS = 45_000;

// ── Intents ───────────────────────────────────────────────────────────────────

export type ChatIntent =
  | 'assistant'
  | 'schedule_estimate'
  | 'schedule_propose'
  | 'cost_forecast'
  | 'risk_summary'
  | 'project_summary'
  | 'resource_summary'
  | 'schedule_impact'
  | 'action_proposal'
  | 'fallback';

// ── Action proposals ──────────────────────────────────────────────────────────

export type ActionProposalType =
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'ASSIGN_TASK'
  | 'RESCHEDULE_TASK'
  | 'CREATE_RISK'
  | 'UPDATE_RISK'
  | 'APPLY_SCHEDULE';

export type ActionProposalStatus =
  | 'PENDING_APPROVAL'
  | 'EXECUTED'
  | 'REJECTED'
  | 'FAILED';

export interface ActionProposal {
  id: string;
  type: ActionProposalType | string;
  status: ActionProposalStatus | string;
  parameters: Record<string, unknown>;
  reason?: string;
  conversationId?: string;
  projectId?: string;
  createdAt?: string;
  decidedAt?: string | null;
  result?: Record<string, unknown> | null;
}

export interface ActionDecisionResponse {
  success: boolean;
  message?: string;
  data: ActionProposal;
}

// ── Tool / keyResults ─────────────────────────────────────────────────────────

export interface ToolStatus {
  name: string;
  status: string;
  durationMs?: number;
}

export interface ScheduleKeyResults {
  totalTasks?: number;
  wbs?: {
    rootTaskCount?: number;
    childTaskCount?: number;
  };
  criticalPath?: {
    taskCount?: number;
    durationDays?: number;
    tasks?: Array<{
      name?: string;
      startDate?: string;
      endDate?: string;
      totalFloat?: number;
    }>;
  };
  finishDates?: {
    baselineFinishDate?: string;
    riskAdjustedFinishDate?: string;
    totalProjectRiskDelayDays?: number;
  };
  delayedTasks?: Array<{
    name?: string;
    delay?: number;
    [key: string]: unknown;
  }>;
}

export interface CostKeyResults {
  baseMetrics?: {
    BAC?: number;
    PV?: number;
    EV?: number;
    AC?: number;
  };
  indices?: {
    CPI?: number;
    SPI?: number;
  };
  forecasts?: {
    EAC?: number;
    ETC?: number;
    VAC?: number;
    TCPI?: number;
  };
  status?: {
    cost?: string;
    schedule?: string;
    overall?: string;
  };
  burnRateForecast?: {
    forecastedTotalCost?: number;
    willExceedBudget?: boolean;
    budgetExhaustionDate?: string | null;
  };
}

export interface AiRiskSuggestion {
  riskId?: string;
  title?: string;
  aiProbability?: number;
  aiImpact?: number;
  aiSeverity?: string;
  aiRiskScore?: number;
  aiConfidence?: number;
  aiModelVersion?: string;
  aiReasons?: unknown;
}

export interface RiskKeyResults {
  summary?: {
    total?: number;
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
  };
  officialRisks?: Array<{
    id?: string;
    title?: string;
    severity?: string;
    riskScore?: number;
    status?: string;
    [key: string]: unknown;
  }>;
  topPriorityRisks?: Array<{
    id?: string;
    title?: string;
    severity?: string;
    riskScore?: number;
    [key: string]: unknown;
  }>;
  scheduleImpact?: {
    totalDelayDays?: number;
    baselineFinishDate?: string;
    riskAdjustedFinishDate?: string;
  };
  aiSuggestionsIncluded?: boolean;
  aiSuggestions?: AiRiskSuggestion[];
  aiScoringRan?: boolean;
  aiScoringSkippedReason?: string;
}

export interface OverdueTaskItem {
  id?: string;
  name?: string;
  title?: string;
  dueDate?: string;
  endDate?: string;
  status?: string;
  delayDays?: number;
  [key: string]: unknown;
}

export type AiKeyResults = {
  toolsUsed?: string[];
  toolStatus?: ToolStatus[];
} & Record<string, unknown>;

export interface AiChatPayload {
  intent?: ChatIntent | string;
  keyResults?: AiKeyResults;
  actionProposals?: ActionProposal[];
}

export interface AiChatRespondResponse {
  success?: boolean;
  replyText: string;
  conversationId?: string;
  intent: ChatIntent | string | undefined;
  payload: AiChatPayload | undefined;
  keyResults: AiKeyResults | undefined;
  actionProposals: ActionProposal[];
}

export interface AiHealthStatus {
  configured: boolean;
}

export interface AiRiskScoreResponse {
  projectId?: string;
  risks?: AiRiskSuggestion[];
}

export class AiRequestError extends Error {
  status?: number;
  code?: string;
  retryable: boolean;

  constructor(
    message: string,
    status?: number,
    code?: string,
    retryable = false
  ) {
    super(message);
    this.name = 'AiRequestError';
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

const looksLikeSecretOrStack = (text: string) =>
  /api[_-]?key|sk-[a-zA-Z0-9]{8,}|-----BEGIN|stack trace|at\s+\S+\s+\(/i.test(
    text
  );

function sanitizeApiMessage(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 240) return undefined;
  if (looksLikeSecretOrStack(trimmed)) return undefined;
  return trimmed;
}

function unwrapBody(responseData: unknown): Record<string, unknown> {
  if (!responseData || typeof responseData !== 'object') return {};
  const outer = responseData as Record<string, unknown>;
  const inner = outer.data;
  const hasTopLevelChatFields =
    typeof outer.replyText === 'string' ||
    typeof outer.conversationId === 'string' ||
    outer.payload != null;
  if (
    !hasTopLevelChatFields &&
    inner &&
    typeof inner === 'object' &&
    !Array.isArray(inner)
  ) {
    return inner as Record<string, unknown>;
  }
  return outer;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return undefined;
  return value as Record<string, unknown>;
}

function normalizeProposal(raw: unknown): ActionProposal | null {
  const rec = asRecord(raw);
  if (!rec || typeof rec.id !== 'string') return null;
  const parameters = asRecord(rec.parameters) ?? {};
  return {
    id: rec.id,
    type: typeof rec.type === 'string' ? rec.type : 'UPDATE_TASK',
    status: typeof rec.status === 'string' ? rec.status : 'PENDING_APPROVAL',
    parameters,
    reason: typeof rec.reason === 'string' ? rec.reason : undefined,
    conversationId:
      typeof rec.conversationId === 'string' ? rec.conversationId : undefined,
    projectId: typeof rec.projectId === 'string' ? rec.projectId : undefined,
    createdAt: typeof rec.createdAt === 'string' ? rec.createdAt : undefined,
    decidedAt:
      typeof rec.decidedAt === 'string'
        ? rec.decidedAt
        : rec.decidedAt === null
          ? null
          : undefined,
    result: asRecord(rec.result) ?? null,
  };
}

function normalizeProposals(raw: unknown): ActionProposal[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeProposal)
    .filter((p): p is ActionProposal => p != null);
}

interface AiErrorBody {
  message?: unknown;
  code?: unknown;
  error?: unknown;
}

export function userFacingAiError(err: unknown): {
  text: string;
  status?: number;
  code?: string;
  retryable: boolean;
} {
  const axiosErr = err as AxiosError<AiErrorBody>;
  const status = axiosErr?.response?.status;
  const data = axiosErr?.response?.data;
  const code =
    (typeof data?.code === 'string' && data.code) ||
    (typeof data?.error === 'string' && data.error) ||
    undefined;
  const apiMsg = sanitizeApiMessage(data?.message);

  if (status === 401) {
    return {
      text: 'Your session expired. Please sign in again.',
      status,
      code,
      retryable: false,
    };
  }
  if (status === 400) {
    return {
      text: apiMsg || 'The request could not be processed.',
      status,
      code,
      retryable: false,
    };
  }
  if (status === 404) {
    return {
      text: 'This project could not be found.',
      status,
      code,
      retryable: false,
    };
  }
  if (status === 403) {
    return {
      text: 'You do not have permission to do that.',
      status,
      code,
      retryable: false,
    };
  }
  if (status === 429) {
    return {
      text: 'The assistant is busy. Please wait a moment and try again.',
      status,
      code,
      retryable: true,
    };
  }
  if (status === 502 || status === 504) {
    return {
      text: 'The assistant is temporarily unavailable. Please try again.',
      status,
      code,
      retryable: true,
    };
  }
  if (status === 503 || code === 'AI_NOT_CONFIGURED') {
    return {
      text: 'The assistant is not configured on the server.',
      status,
      code: code || 'AI_NOT_CONFIGURED',
      retryable: false,
    };
  }
  if (axiosErr?.code === 'ECONNABORTED') {
    return {
      text: 'The assistant took too long to respond. Please try again.',
      status,
      retryable: true,
    };
  }
  if (!axiosErr?.response) {
    return {
      text: 'Unable to reach the assistant. Please try again.',
      retryable: true,
    };
  }

  return {
    text: apiMsg || 'Something went wrong. Please try again.',
    status,
    code,
    retryable: status != null && status >= 500,
  };
}

function readConfigured(raw: unknown): boolean | undefined {
  const rec = asRecord(raw);
  if (!rec) return undefined;
  const llm = asRecord(rec.llm);
  if (typeof llm?.configured === 'boolean') return llm.configured;
  const nested = asRecord(rec.data);
  const nestedLlm = asRecord(nested?.llm);
  if (typeof nestedLlm?.configured === 'boolean') return nestedLlm.configured;
  if (typeof rec.configured === 'boolean') return rec.configured;
  return undefined;
}

class AiService {
  async chat(
    projectId: string,
    message: string,
    conversationId?: string
  ): Promise<AiChatRespondResponse> {
    const payload: Record<string, string> = { projectId, message };
    if (conversationId) payload.conversationId = conversationId;

    const response = await apiService.post<unknown>(
      '/ai/chat/respond',
      payload,
      {
        timeout: CHAT_TIMEOUT_MS,
      }
    );

    const body = unwrapBody(response?.data);
    const chatPayload = asRecord(body.payload) as AiChatPayload | undefined;
    const replyText =
      (typeof body.replyText === 'string' && body.replyText) ||
      (typeof body.text === 'string' && body.text) ||
      (typeof body.reply === 'string' && body.reply) ||
      '';

    const keyResults = (chatPayload?.keyResults ??
      (asRecord(body.keyResults) as AiKeyResults | undefined)) as
      | AiKeyResults
      | undefined;

    const actionProposals = normalizeProposals(
      chatPayload?.actionProposals ?? body.actionProposals
    );

    const payloadConversation =
      chatPayload &&
      typeof (chatPayload as { conversationId?: unknown }).conversationId ===
        'string'
        ? (chatPayload as { conversationId: string }).conversationId
        : undefined;
    const conversation =
      (typeof body.conversationId === 'string' && body.conversationId) ||
      payloadConversation ||
      undefined;

    const intent = (chatPayload?.intent ??
      (typeof body.intent === 'string' ? body.intent : undefined)) as
      | ChatIntent
      | string
      | undefined;

    return {
      success: body.success === true || body.success === undefined,
      replyText,
      conversationId: conversation,
      intent,
      payload: chatPayload,
      keyResults,
      actionProposals,
    };
  }

  /** @deprecated Prefer `chat`. Kept for existing call sites. */
  chatRespond(projectId: string, message: string, conversationId?: string) {
    return this.chat(projectId, message, conversationId);
  }

  sendAiChat(opts: {
    projectId: string;
    message: string;
    conversationId?: string;
  }) {
    return this.chat(opts.projectId, opts.message, opts.conversationId);
  }

  approveAiAction(id: string) {
    return this.approveAction(id);
  }

  rejectAiAction(id: string) {
    return this.rejectAction(id);
  }

  async approveAction(id: string): Promise<ActionDecisionResponse> {
    const response = await apiService.post<unknown>(
      `/ai/actions/${id}/approve`,
      undefined,
      {
        timeout: ACTION_TIMEOUT_MS,
      }
    );
    return this.parseDecision(response?.data);
  }

  async rejectAction(id: string): Promise<ActionDecisionResponse> {
    const response = await apiService.post<unknown>(
      `/ai/actions/${id}/reject`,
      undefined,
      {
        timeout: ACTION_TIMEOUT_MS,
      }
    );
    return this.parseDecision(response?.data);
  }

  private parseDecision(raw: unknown): ActionDecisionResponse {
    const outer = asRecord(raw) ?? {};
    const dataRec = asRecord(outer.data) ?? outer;
    const proposal = normalizeProposal(dataRec);
    if (!proposal) {
      throw new AiRequestError(
        'The recommendation could not be updated.',
        undefined,
        undefined,
        true
      );
    }
    return {
      success: outer.success !== false,
      message: sanitizeApiMessage(outer.message),
      data: proposal,
    };
  }

  async runRiskScoring(projectId: string): Promise<AiRiskScoreResponse> {
    const response = await apiService.post<unknown>('/ai/risk/score', {
      projectId,
    });
    const body = asRecord(response?.data) ?? {};
    const nested = asRecord(body.data);
    return (nested ?? body) as AiRiskScoreResponse;
  }

  async checkHealth(): Promise<AiHealthStatus> {
    try {
      const response = await apiService.get<unknown>('/ai/health', {
        timeout: 8_000,
      });
      const configured = readConfigured(response?.data);
      return { configured: configured !== false };
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<AiErrorBody>;
      const status = axiosErr?.response?.status;
      const data = axiosErr?.response?.data;
      const code =
        (typeof data?.code === 'string' && data.code) ||
        (typeof data?.error === 'string' && data.error) ||
        undefined;
      if (status === 503 || code === 'AI_NOT_CONFIGURED') {
        return { configured: false };
      }
      return { configured: true };
    }
  }
}

export const aiService = new AiService();

export const sendAiChat = (opts: {
  projectId: string;
  message: string;
  conversationId?: string;
}) => aiService.sendAiChat(opts);

export const approveAiAction = (id: string) => aiService.approveAiAction(id);
export const rejectAiAction = (id: string) => aiService.rejectAiAction(id);
