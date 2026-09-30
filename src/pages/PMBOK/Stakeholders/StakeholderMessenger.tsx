import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Avatar,
  Button,
  Empty,
  Input,
  Select,
  Spin,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  CommentOutlined,
  SendOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../../../contexts/AuthContext';
import { Stakeholder } from '../../../services/stakeholderService';
import {
  ChatMessage,
  StakeholderConversation,
  normalizeChatMessage,
  stakeholderMessengerService,
} from '../../../services/stakeholderMessengerService';
import './StakeholderMessenger.css';

const { Text } = Typography;
const { TextArea } = Input;

const MESSAGE_MAX = 4000;
const POLL_MS = 4000;
const NEAR_BOTTOM_PX = 80;

interface Props {
  projectId: string;
  stakeholders?: Stakeholder[];
  openStakeholderId?: string | null;
}

function dayLabel(iso: string): string {
  const d = dayjs(iso);
  if (!d.isValid()) return '';
  if (d.isSame(dayjs(), 'day')) return 'Today';
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return 'Yesterday';
  return d.format('MMM D, YYYY');
}

function timeLabel(iso?: string | null): string {
  if (!iso) return '';
  const d = dayjs(iso);
  if (!d.isValid()) return '';
  if (d.isSame(dayjs(), 'day')) return d.format('h:mm A');
  return d.format('MMM D');
}

function bubbleTime(iso?: string | null): string {
  if (!iso) return '';
  const d = dayjs(iso);
  return d.isValid() ? d.format('h:mm A') : '';
}

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const map = new Map<string, ChatMessage>();
  current.forEach(m => map.set(m.id, m));
  incoming.forEach(m => {
    const prev = map.get(m.id);
    map.set(m.id, prev ? { ...prev, ...m, pending: false, failed: false } : m);
  });
  return Array.from(map.values()).sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    if (ta !== tb) return ta - tb;
    return a.id.localeCompare(b.id);
  });
}

function applyReceipts(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  if (!incoming.length) return current;
  const byId = new Map(incoming.map(m => [m.id, m]));
  return current.map(m => {
    const next = byId.get(m.id);
    if (!next) return m;
    return { ...m, ...next, pending: false };
  });
}

const Ticks: React.FC<{ status: string }> = ({ status }) => {
  const s = (status || 'SENT').toUpperCase();
  if (s === 'READ') return <span className="ua-ticks ua-ticks--read">✓✓</span>;
  if (s === 'DELIVERED') return <span className="ua-ticks">✓✓</span>;
  return <span className="ua-ticks">✓</span>;
};

const StakeholderMessenger: React.FC<Props> = ({
  projectId,
  stakeholders = [],
  openStakeholderId,
}) => {
  const { user, can } = useAuth();
  const asSelf = !can('ENGINEER_AND_ABOVE');
  const isMobile =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  const [mobile, setMobile] = useState(isMobile);

  const [conversations, setConversations] = useState<StakeholderConversation[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<StakeholderConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const loadingOlderRef = useRef(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [newChatId, setNewChatId] = useState<string | undefined>();

  const listRef = useRef<HTMLDivElement | null>(null);
  const stickToBottom = useRef(true);
  const activeIdRef = useRef<string | null>(null);
  const conversationsRef = useRef<StakeholderConversation[]>([]);
  const openedStakeholderRef = useRef<string | null>(null);
  const pusherRef = useRef<any>(null);
  const pusherReadyRef = useRef(false);
  const [pusherReady, setPusherReady] = useState(false);
  const channelsRef = useRef<Map<string, any>>(new Map());
  const realtimeEnabled = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const loadInbox = useCallback(async () => {
    if (!projectId) return;
    setInboxLoading(true);
    try {
      const rows = await stakeholderMessengerService.getConversations(projectId, asSelf);
      setConversations(rows);
      conversationsRef.current = rows;
    } catch {
      setConversations([]);
    } finally {
      setInboxLoading(false);
    }
  }, [projectId, asSelf]);

  useEffect(() => {
    setActive(null);
    setMessages([]);
    setDraft('');
    loadInbox();
  }, [loadInbox]);

  const scrollToBottom = useCallback((force = false) => {
    const el = listRef.current;
    if (!el) return;
    if (force || stickToBottom.current) {
      el.scrollTop = el.scrollHeight;
      setShowJump(false);
    }
  }, []);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distance < NEAR_BOTTOM_PX;
    stickToBottom.current = nearBottom;
    if (nearBottom) setShowJump(false);
    if (el.scrollTop < 40 && hasMore && !loadingOlder) {
      void loadOlder();
    }
  };

  const patchInbox = useCallback(
    (conversationId: string, patch: Partial<StakeholderConversation>) => {
      setConversations(prev => {
        const next = prev.map(c => (c.id === conversationId ? { ...c, ...patch } : c));
        conversationsRef.current = next;
        return next;
      });
    },
    []
  );

  const openThread = useCallback(
    async (row: StakeholderConversation) => {
      setActive(row);
      activeIdRef.current = row.id;
      setThreadLoading(true);
      setShowJump(false);
      stickToBottom.current = true;
      try {
        let threadMessages: ChatMessage[] = [];
        let conversation = row;
        if (row.stakeholderId) {
          const thread = await stakeholderMessengerService.getOrCreateConversation(
            row.stakeholderId
          );
          conversation = { ...row, ...thread.conversation, id: thread.conversation.id || row.id };
          threadMessages = thread.messages;
          setHasMore(Boolean(thread.hasMore));
        } else {
          const page = await stakeholderMessengerService.getMessages(row.id);
          threadMessages = page.messages;
          setHasMore(page.hasMore);
        }
        setActive(conversation);
        activeIdRef.current = conversation.id;
        setMessages(threadMessages);
        setConversations(prev => {
          if (!conversation.id) return prev;
          const exists = prev.some(c => c.id === conversation.id);
          const next = exists
            ? prev.map(c => (c.id === conversation.id ? { ...c, ...conversation } : c))
            : [conversation, ...prev];
          conversationsRef.current = next;
          return next;
        });
        setTimeout(() => scrollToBottom(true), 0);
        try {
          const delivered = await stakeholderMessengerService.markDelivered(conversation.id);
          const read = await stakeholderMessengerService.markRead(conversation.id);
          setMessages(prev => applyReceipts(applyReceipts(prev, delivered), read));
        } catch {
          /* receipts are best-effort */
        }
        patchInbox(conversation.id, { unreadCount: 0 });
      } catch {
        setMessages([]);
      } finally {
        setThreadLoading(false);
      }
    },
    [patchInbox, scrollToBottom]
  );

  useEffect(() => {
    if (!openStakeholderId) return;
    if (openedStakeholderRef.current === openStakeholderId) return;
    openedStakeholderRef.current = openStakeholderId;
    const existing = conversationsRef.current.find(
      c => c.stakeholderId === openStakeholderId
    );
    const listed = stakeholders.find(s => s.id === openStakeholderId);
    void openThread(
      existing || {
        id: '',
        projectId,
        stakeholderId: openStakeholderId,
        stakeholder: listed
          ? {
              id: listed.id,
              name: listed.name,
              organization: listed.organization,
              role: listed.role,
            }
          : { id: openStakeholderId, name: 'Stakeholder' },
      }
    );
  }, [openStakeholderId, projectId, stakeholders, openThread]);

  const loadOlder = useCallback(async () => {
    if (!active?.id || !hasMore || loadingOlderRef.current || messages.length === 0) return;
    loadingOlderRef.current = true;
    const oldest = messages[0];
    const el = listRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    const prevTop = el?.scrollTop ?? 0;
    setLoadingOlder(true);
    try {
      const page = await stakeholderMessengerService.getMessages(active.id, {
        before: oldest.createdAt,
        limit: 50,
      });
      setHasMore(page.hasMore);
      setMessages(prev => mergeMessages(prev, page.messages));
      requestAnimationFrame(() => {
        if (!el) return;
        el.scrollTop = prevTop + (el.scrollHeight - prevHeight);
      });
    } catch {
      /* keep current page */
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [active?.id, hasMore, loadingOlder, messages]);

  const refreshOpenThread = useCallback(async () => {
    const id = activeIdRef.current;
    if (!id) return;
    try {
      const page = await stakeholderMessengerService.getMessages(id, { limit: 50 });
      setMessages(prev => {
        const pending = prev.filter(m => m.pending || m.failed);
        const next = mergeMessages(
          prev.filter(m => !m.pending && !m.failed),
          page.messages
        );
        const merged = mergeMessages(next, pending);
        const added = merged.length > prev.length;
        if (added && !stickToBottom.current) setShowJump(true);
        else if (stickToBottom.current) setTimeout(() => scrollToBottom(), 0);
        return merged;
      });
      setHasMore(page.hasMore);
    } catch {
      /* ignore poll errors */
    }
  }, [scrollToBottom]);

  const handleIncoming = useCallback(
    (raw: unknown) => {
      const msg = normalizeChatMessage(raw) || (raw as ChatMessage);
      if (!msg?.id) return;
      const openId = activeIdRef.current;
      if (msg.conversationId && msg.conversationId === openId) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          if (!stickToBottom.current) setShowJump(true);
          else setTimeout(() => scrollToBottom(), 0);
          return mergeMessages(prev, [msg]);
        });
        stakeholderMessengerService.markRead(msg.conversationId).catch(() => undefined);
        patchInbox(msg.conversationId, {
          lastMessageAt: msg.createdAt,
          lastMessagePreview: msg.body,
          unreadCount: 0,
        });
        return;
      }
      if (msg.conversationId) {
        const row = conversationsRef.current.find(c => c.id === msg.conversationId);
        patchInbox(msg.conversationId, {
          lastMessageAt: msg.createdAt,
          lastMessagePreview: msg.body,
          unreadCount: (row?.unreadCount ?? 0) + (msg.mine ? 0 : 1),
        });
      }
    },
    [patchInbox, scrollToBottom]
  );

  const handleReceiptEvent = useCallback((raw: unknown) => {
    const rec = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const id = typeof rec.id === 'string' ? rec.id : typeof rec.messageId === 'string' ? rec.messageId : '';
    const status = typeof rec.status === 'string' ? rec.status.toUpperCase() : '';
    if (!id) return;
    setMessages(prev =>
      prev.map(m =>
        m.id === id
          ? {
              ...m,
              status: status || m.status,
              deliveredAt:
                typeof rec.deliveredAt === 'string' ? rec.deliveredAt : m.deliveredAt,
              readAt: typeof rec.readAt === 'string' ? rec.readAt : m.readAt,
            }
          : m
      )
    );
  }, []);

  const bindChannel = useCallback(
    (channel: any) => {
      channel.unbind('message:new');
      channel.unbind('message:delivered');
      channel.unbind('message:read');
      channel.bind('message:new', handleIncoming);
      channel.bind('message:delivered', handleReceiptEvent);
      channel.bind('message:read', handleReceiptEvent);
    },
    [handleIncoming, handleReceiptEvent]
  );

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const setup = async () => {
      const config = await stakeholderMessengerService.getRealtimeConfig();
      if (cancelled) return;
      realtimeEnabled.current = Boolean(config.enabled && config.key);

      if (!realtimeEnabled.current) {
        pollTimer = setInterval(() => {
          if (document.hidden) return;
          void refreshOpenThread();
        }, POLL_MS);
        return;
      }

      const Pusher = (await import('pusher-js')).default;
      if (cancelled) return;
      const client = new Pusher(config.key as string, {
        cluster: config.cluster || 'mt1',
        authorizer: (channel: { name: string }) => ({
          authorize: (socketId: string, callback: (err: Error | null, data: any) => void) => {
            stakeholderMessengerService
              .authorizePusher(socketId, channel.name)
              .then(auth => callback(null, auth))
              .catch(err => callback(err as Error, null));
          },
        }),
      });
      pusherRef.current = client;
      pusherReadyRef.current = true;
      setPusherReady(true);
    };

    setup();
    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      channelsRef.current.forEach(ch => {
        try {
          ch.unbind_all?.();
        } catch {
          /* ignore */
        }
      });
      channelsRef.current.clear();
      try {
        pusherRef.current?.disconnect();
      } catch {
        /* ignore */
      }
      pusherRef.current = null;
      pusherReadyRef.current = false;
      setPusherReady(false);
    };
  }, [projectId, refreshOpenThread]);

  useEffect(() => {
    const client = pusherRef.current;
    if (!client || !realtimeEnabled.current) return;
    const ids = new Set(conversations.map(c => c.id).filter(Boolean));
    if (active?.id) ids.add(active.id);

    ids.forEach(id => {
      const name = `private-conversation-${id}`;
      if (channelsRef.current.has(name)) {
        bindChannel(channelsRef.current.get(name));
        return;
      }
      const channel = client.subscribe(name);
      bindChannel(channel);
      channelsRef.current.set(name, channel);
    });

    Array.from(channelsRef.current.keys()).forEach(name => {
      const id = name.replace('private-conversation-', '');
      if (!ids.has(id)) {
        try {
          client.unsubscribe(name);
        } catch {
          /* ignore */
        }
        channelsRef.current.delete(name);
      }
    });
  }, [conversations, active?.id, bindChannel, pusherReady]);

  const send = async (bodyText?: string, retryId?: string) => {
    const text = (bodyText ?? draft).trim();
    if (!text || sending || !active) return;
    if (text.length > MESSAGE_MAX) return;
    if (!active.id) return;

    if (!retryId) setDraft('');
    setSending(true);
    const tempId = retryId || `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      conversationId: active.id,
      body: text,
      status: 'SENT',
      createdAt: new Date().toISOString(),
      mine: true,
      pending: true,
      sender: user
        ? { id: user.id, firstName: user.firstName, lastName: user.lastName }
        : undefined,
    };
    if (retryId) {
      setMessages(prev =>
        prev.map(m => (m.id === retryId ? { ...optimistic, failed: false } : m))
      );
    } else {
      setMessages(prev => [...prev, optimistic]);
    }
    stickToBottom.current = true;
    setTimeout(() => scrollToBottom(true), 0);

    try {
      const saved = await stakeholderMessengerService.sendMessage(active.id, text);
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== tempId);
        return mergeMessages(withoutTemp, [{ ...saved, mine: true }]);
      });
      patchInbox(active.id, {
        lastMessageAt: saved.createdAt,
        lastMessagePreview: saved.body,
      });
    } catch {
      setMessages(prev =>
        prev.map(m => (m.id === tempId ? { ...m, pending: false, failed: true } : m))
      );
      if (!retryId) setDraft(text);
    } finally {
      setSending(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(c =>
      (c.stakeholder?.name || '').toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const unusedStakeholders = useMemo(() => {
    const used = new Set(conversations.map(c => c.stakeholderId));
    return stakeholders.filter(s => !used.has(s.id));
  }, [conversations, stakeholders]);

  const grouped = useMemo(() => {
    const groups: Array<{ label: string; items: ChatMessage[] }> = [];
    messages.forEach(m => {
      const label = dayLabel(m.createdAt) || ' ';
      const last = groups[groups.length - 1];
      if (!last || last.label !== label) groups.push({ label, items: [m] });
      else last.items.push(m);
    });
    return groups;
  }, [messages]);

  const overLimit = draft.length > MESSAGE_MAX;
  const canSend = Boolean(draft.trim()) && !overLimit && !sending && Boolean(active?.id);
  const showList = !mobile || !active;
  const showThread = !mobile || Boolean(active);

  return (
    <div className={`ua-messenger ${mobile ? 'ua-messenger--mobile' : ''}`}>
      {showList && (
        <div className="ua-inbox">
          <div className="ua-inbox__search">
            <Input
              allowClear
              placeholder="Search by name"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {!asSelf && unusedStakeholders.length > 0 && (
              <Select
                allowClear
                placeholder="Start a conversation"
                style={{ width: '100%', marginTop: 8 }}
                value={newChatId}
                options={unusedStakeholders.map(s => ({ value: s.id, label: s.name }))}
                onChange={id => {
                  setNewChatId(undefined);
                  if (!id) return;
                  const s = unusedStakeholders.find(x => x.id === id);
                  void openThread({
                    id: '',
                    projectId,
                    stakeholderId: id,
                    stakeholder: s
                      ? {
                          id: s.id,
                          name: s.name,
                          organization: s.organization,
                          role: s.role,
                        }
                      : { id, name: 'Stakeholder' },
                  });
                }}
              />
            )}
          </div>
          <div className="ua-inbox__list">
            {inboxLoading ? (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <Spin />
              </div>
            ) : filtered.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text style={{ color: '#808080' }}>No stakeholder conversations yet.</Text>
                }
                style={{ padding: 32 }}
              />
            ) : (
              filtered.map(row => {
                const name = row.stakeholder?.name || 'Stakeholder';
                const unread = row.unreadCount ?? 0;
                return (
                  <button
                    key={row.id || row.stakeholderId}
                    type="button"
                    className={`ua-inbox__row ${active?.id === row.id ? 'ua-inbox__row--active' : ''}`}
                    onClick={() => void openThread(row)}
                  >
                    <Avatar style={{ backgroundColor: '#009944', flexShrink: 0 }}>
                      {name.charAt(0).toUpperCase()}
                    </Avatar>
                    <div className="ua-inbox__meta">
                      <div className="ua-inbox__name">
                        <span>{name}</span>
                        <span className="ua-inbox__time">{timeLabel(row.lastMessageAt)}</span>
                      </div>
                      {row.stakeholder?.organization && (
                        <span className="ua-inbox__org">{row.stakeholder.organization}</span>
                      )}
                      <span className="ua-inbox__preview">
                        {row.lastMessagePreview || ' '}
                      </span>
                      {unread > 0 && <span className="ua-unread">{unread}</span>}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {showThread && (
        <div className="ua-thread">
          {active ? (
            <>
              <div className="ua-thread__header">
                {mobile && (
                  <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => {
                      setActive(null);
                      activeIdRef.current = null;
                    }}
                    style={{ color: '#009944' }}
                  />
                )}
                <Avatar style={{ backgroundColor: '#009944' }}>
                  {(active.stakeholder?.name || 'S').charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <div className="ua-thread__header-name">
                    {active.stakeholder?.name || 'Stakeholder'}
                  </div>
                  {active.stakeholder?.organization && (
                    <div className="ua-thread__header-org">
                      {active.stakeholder.organization}
                    </div>
                  )}
                </div>
              </div>

              <div
                className="ua-thread__messages"
                ref={listRef}
                onScroll={handleScroll}
              >
                {threadLoading ? (
                  <div style={{ textAlign: 'center', padding: 48 }}>
                    <Spin />
                  </div>
                ) : (
                  <>
                    {loadingOlder && (
                      <div style={{ textAlign: 'center', padding: 8 }}>
                        <Spin size="small" />
                      </div>
                    )}
                    {grouped.map(group => (
                      <div key={group.label}>
                        <div className="ua-day-chip">
                          <span>{group.label}</span>
                        </div>
                        {group.items.map(msg => {
                          const mine =
                            msg.mine === true ||
                            (msg.sender?.id != null && msg.sender.id === user?.id);
                          return (
                            <div
                              key={msg.id}
                              className={`ua-bubble-row ${mine ? 'ua-bubble-row--mine' : ''}`}
                            >
                              <div
                                className={`ua-bubble ${mine ? 'ua-bubble--mine' : 'ua-bubble--theirs'} ${msg.failed ? 'ua-bubble--failed' : ''}`}
                              >
                                {!mine && (
                                  <span className="ua-bubble__sender">
                                    {msg.sender?.firstName || active.stakeholder?.name || 'Stakeholder'}
                                  </span>
                                )}
                                <p className="ua-bubble__body">{msg.body}</p>
                                <div className="ua-bubble__foot">
                                  <span className="ua-bubble__time">{bubbleTime(msg.createdAt)}</span>
                                  {mine && !msg.failed && <Ticks status={msg.status} />}
                                  {msg.failed && (
                                    <Button
                                      type="link"
                                      size="small"
                                      onClick={() => void send(msg.body, msg.id)}
                                      style={{ color: '#fca5a5', padding: 0, height: 'auto' }}
                                    >
                                      Retry
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    {messages.length === 0 && !threadLoading && (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <Text style={{ color: '#808080' }}>No messages yet. Say hello.</Text>
                        }
                      />
                    )}
                  </>
                )}
              </div>

              {showJump && (
                <div className="ua-jump">
                  <Button
                    size="small"
                    onClick={() => {
                      stickToBottom.current = true;
                      scrollToBottom(true);
                    }}
                    style={{ background: '#009944', borderColor: '#009944', color: '#04120a' }}
                  >
                    New message
                  </Button>
                </div>
              )}

              <div className="ua-composer">
                <div className="ua-composer__row">
                  <TextArea
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    placeholder="Write a message"
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    disabled={sending || !active.id}
                    maxLength={MESSAGE_MAX + 200}
                    onPressEnter={e => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        if (canSend) void send();
                      }
                    }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => void send()}
                    disabled={!canSend}
                    loading={sending}
                    style={{ background: '#009944', borderColor: '#009944', height: 40 }}
                  >
                    Send
                  </Button>
                </div>
                {draft.length > 0 && (
                  <div className={overLimit ? 'ua-composer__count ua-composer__count--warn' : 'ua-composer__count'}>
                    {draft.length}/{MESSAGE_MAX}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="ua-thread__empty">
              <div>
                <CommentOutlined style={{ fontSize: 28, color: '#009944', marginBottom: 8 }} />
                <div>Select a conversation to start messaging.</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StakeholderMessenger;
