import { apiService } from './api';

export type ChatMessageStatus = 'SENT' | 'DELIVERED' | 'READ' | string;

export interface ConversationStakeholder {
  id: string;
  name: string;
  organization?: string;
  role?: string;
  userId?: string;
}

export interface StakeholderConversation {
  id: string;
  projectId: string;
  stakeholderId: string;
  stakeholder?: ConversationStakeholder;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  unreadCount?: number;
}

export interface ChatSender {
  id?: string;
  firstName?: string;
  lastName?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  body: string;
  status: ChatMessageStatus;
  createdAt: string;
  deliveredAt?: string | null;
  readAt?: string | null;
  mine?: boolean;
  sender?: ChatSender;
  pending?: boolean;
  failed?: boolean;
}

export interface ConversationThread {
  conversation: StakeholderConversation;
  messages: ChatMessage[];
  hasMore?: boolean;
}

export interface MessagesPage {
  messages: ChatMessage[];
  hasMore: boolean;
}

export interface RealtimeConfig {
  enabled: boolean;
  key?: string;
  cluster?: string;
}

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
}

function asRec(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function unwrap(payload: unknown): unknown {
  const rec = asRec(payload);
  if (!rec) return payload;
  if (rec.data !== undefined) return rec.data;
  return payload;
}

function pickStr(obj: Record<string, unknown> | undefined, ...keys: string[]): string {
  if (!obj) return '';
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function pickNum(obj: Record<string, unknown> | undefined, ...keys: string[]): number {
  if (!obj) return 0;
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

function fail(error: unknown, fallback: string): never {
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  throw new Error(err.response?.data?.message || err.message || fallback);
}

function normalizeStakeholder(raw: unknown, fallbackId?: string): ConversationStakeholder | undefined {
  const rec = asRec(raw);
  const id = pickStr(rec, 'id', 'stakeholderId') || fallbackId || '';
  const name = pickStr(rec, 'name', 'fullName');
  if (!id && !name) return undefined;
  return {
    id: id || fallbackId || '',
    name: name || 'Stakeholder',
    organization: pickStr(rec, 'organization', 'organisation', 'company') || undefined,
    role: pickStr(rec, 'role') || undefined,
    userId: pickStr(rec, 'userId', 'user_id') || undefined,
  };
}

function normalizeConversation(raw: unknown): StakeholderConversation | null {
  const rec = asRec(raw);
  if (!rec) return null;
  const nested = asRec(rec.conversation);
  const src = nested || rec;
  const id = pickStr(src, 'id', 'conversationId');
  const stakeholder = normalizeStakeholder(
    src.stakeholder,
    pickStr(src, 'stakeholderId')
  );
  const stakeholderId =
    pickStr(src, 'stakeholderId') || stakeholder?.id || '';
  if (!id && !stakeholderId) return null;
  return {
    id: id || stakeholderId,
    projectId: pickStr(src, 'projectId'),
    stakeholderId,
    stakeholder,
    lastMessageAt: pickStr(src, 'lastMessageAt', 'updatedAt') || null,
    lastMessagePreview: pickStr(src, 'lastMessagePreview', 'preview', 'lastMessage') || null,
    unreadCount: pickNum(src, 'unreadCount', 'unread'),
  };
}

function normalizeSender(raw: unknown): ChatSender | undefined {
  const rec = asRec(raw);
  if (!rec) return undefined;
  return {
    id: pickStr(rec, 'id') || undefined,
    firstName: pickStr(rec, 'firstName', 'first_name') || undefined,
    lastName: pickStr(rec, 'lastName', 'last_name') || undefined,
  };
}

export function normalizeChatMessage(raw: unknown): ChatMessage | null {
  const rec = asRec(raw);
  if (!rec) return null;
  const id = pickStr(rec, 'id');
  const body = typeof rec.body === 'string' ? rec.body : pickStr(rec, 'text', 'message');
  if (!id) return null;
  return {
    id,
    conversationId: pickStr(rec, 'conversationId'),
    body,
    status: (pickStr(rec, 'status') || 'SENT').toUpperCase(),
    createdAt: pickStr(rec, 'createdAt', 'sentAt') || new Date().toISOString(),
    deliveredAt: pickStr(rec, 'deliveredAt') || null,
    readAt: pickStr(rec, 'readAt') || null,
    mine: rec.mine === true || rec.mine === 'true',
    sender: normalizeSender(rec.sender),
  };
}

function asMessageList(raw: unknown): ChatMessage[] {
  const rec = asRec(raw);
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(rec?.messages)
      ? rec.messages
      : Array.isArray(rec?.data)
        ? rec.data
        : [];
  return list
    .map(normalizeChatMessage)
    .filter((m): m is ChatMessage => m != null);
}

function asConversationList(raw: unknown): StakeholderConversation[] {
  const rec = asRec(raw);
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(rec?.conversations)
      ? rec.conversations
      : Array.isArray(rec?.items)
        ? rec.items
        : [];
  return list
    .map(normalizeConversation)
    .filter((c): c is StakeholderConversation => c != null);
}

class StakeholderMessengerService {
  async getConversations(
    projectId: string,
    asStakeholderSelf = false
  ): Promise<StakeholderConversation[]> {
    try {
      const params: Record<string, string> = { projectId };
      if (asStakeholderSelf) params.stakeholderUser = 'me';
      const response = await apiService.get<ApiResponse<unknown>>(
        '/stakeholders/conversations',
        { params }
      );
      return asConversationList(unwrap(response.data));
    } catch (error) {
      fail(error, 'Failed to load conversations');
    }
  }

  async getOrCreateConversation(stakeholderId: string): Promise<ConversationThread> {
    try {
      const response = await apiService.get<ApiResponse<unknown>>(
        `/stakeholders/${stakeholderId}/conversation`
      );
      const data = unwrap(response.data);
      const rec = asRec(data);
      const conversation =
        normalizeConversation(rec?.conversation ?? data) ||
        ({
          id: '',
          projectId: '',
          stakeholderId,
        } as StakeholderConversation);
      const messages = asMessageList(rec?.messages ?? rec);
      return { conversation, messages, hasMore: messages.length >= 50 };
    } catch (error) {
      fail(error, 'Failed to open conversation');
    }
  }

  async getMessages(
    conversationId: string,
    opts?: { before?: string; limit?: number }
  ): Promise<MessagesPage> {
    try {
      const params: Record<string, string | number> = {
        limit: opts?.limit ?? 50,
      };
      if (opts?.before) params.before = opts.before;
      const response = await apiService.get<ApiResponse<unknown>>(
        `/stakeholders/conversations/${conversationId}/messages`,
        { params }
      );
      const data = unwrap(response.data);
      const rec = asRec(data);
      const messages = asMessageList(data);
      const hasMore =
        rec && typeof rec.hasMore === 'boolean' ? rec.hasMore : messages.length >= (opts?.limit ?? 50);
      return { messages, hasMore };
    } catch (error) {
      fail(error, 'Failed to load messages');
    }
  }

  async sendMessage(conversationId: string, body: string): Promise<ChatMessage> {
    try {
      const response = await apiService.post<ApiResponse<unknown>>(
        `/stakeholders/conversations/${conversationId}/messages`,
        { body }
      );
      const parsed = normalizeChatMessage(unwrap(response.data));
      if (!parsed) throw new Error('Invalid message response');
      return parsed;
    } catch (error) {
      fail(error, 'Failed to send message');
    }
  }

  async markDelivered(conversationId: string): Promise<ChatMessage[]> {
    try {
      const response = await apiService.post<ApiResponse<unknown>>(
        `/stakeholders/conversations/${conversationId}/delivered`
      );
      return asMessageList(unwrap(response.data));
    } catch (error) {
      fail(error, 'Failed to mark delivered');
    }
  }

  async markRead(conversationId: string): Promise<ChatMessage[]> {
    try {
      const response = await apiService.post<ApiResponse<unknown>>(
        `/stakeholders/conversations/${conversationId}/read`
      );
      return asMessageList(unwrap(response.data));
    } catch (error) {
      fail(error, 'Failed to mark read');
    }
  }

  async getRealtimeConfig(): Promise<RealtimeConfig> {
    try {
      const response = await apiService.get<ApiResponse<unknown>>(
        '/stakeholders/conversations/realtime-config'
      );
      const data = asRec(unwrap(response.data)) || asRec(response.data) || {};
      return {
        enabled: data.enabled === true,
        key: pickStr(data, 'key') || undefined,
        cluster: pickStr(data, 'cluster') || undefined,
      };
    } catch {
      return { enabled: false };
    }
  }

  async authorizePusher(socketId: string, channelName: string): Promise<unknown> {
    const response = await apiService.post<unknown>(
      '/stakeholders/conversations/pusher/auth',
      new URLSearchParams({
        socket_id: socketId,
        channel_name: channelName,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );
    return unwrap(response.data) ?? response.data;
  }
}

export const stakeholderMessengerService = new StakeholderMessengerService();
