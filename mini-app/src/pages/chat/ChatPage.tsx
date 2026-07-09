import { useCallback, useState } from 'react';
import { useTelegramBackButton } from '../../hooks/telegram/index';

/* ───────── Types ───────── */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
}

/* ───────── Mock Data ───────── */

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    text: '你好！我是 Hermes AI 助手，有什麼可以幫你的嗎？',
    time: '09:32',
  },
  {
    id: '2',
    role: 'user',
    text: '幫我分析一下目前的 API 路由狀態',
    time: '09:33',
  },
  {
    id: '3',
    role: 'assistant',
    text: '目前所有 API 路由均正常運行。共 5 條路由在線，平均延遲 158ms，最慢的路由是 GPT-4.1 約 198ms。需要我深入檢查哪一條嗎？',
    time: '09:33',
  },
];

/* ───────── Styles ───────── */

const styles = {
  page: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    height: '100vh',
    background: 'var(--tg-theme-bg-color, #1a1a2e)',
    color: 'var(--tg-theme-text-color, #e2e8f0)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  header: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '12px',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
    background: 'var(--tg-theme-secondary-bg-color, #1e293b)',
  },
  headerTitle: {
    fontSize: '17px',
    fontWeight: 600,
    color: 'var(--tg-theme-text-color, #e2e8f0)',
  },
  messageList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '16px',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '12px',
  },
  messageRow: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    maxWidth: '85%',
  },
  userRow: {
    alignSelf: 'flex-end' as const,
    alignItems: 'flex-end' as const,
  },
  assistantRow: {
    alignSelf: 'flex-start' as const,
    alignItems: 'flex-start' as const,
  },
  bubble: {
    padding: '10px 14px',
    borderRadius: '14px',
    fontSize: '14px',
    lineHeight: 1.5,
    wordBreak: 'break-word' as const,
  },
  userBubble: {
    background: 'var(--tg-theme-button-color, #40a7e3)',
    color: '#fff',
    borderBottomRightRadius: '4px',
  },
  assistantBubble: {
    background: 'var(--tg-theme-secondary-bg-color, #1e293b)',
    color: 'var(--tg-theme-text-color, #e2e8f0)',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    borderBottomLeftRadius: '4px',
  },
  messageTime: {
    fontSize: '10px',
    color: 'var(--tg-theme-hint-color, #94a3b8)',
    marginTop: '4px',
    padding: '0 4px',
  },
  inputBar: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '8px',
    padding: '12px 16px',
    paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
    borderTop: '1px solid rgba(148, 163, 184, 0.12)',
    background: 'var(--tg-theme-secondary-bg-color, #1e293b)',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '20px',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    background: 'var(--tg-theme-bg-color, #1a1a2e)',
    color: 'var(--tg-theme-text-color, #e2e8f0)',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
  },
  sendBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    background: 'var(--tg-theme-button-color, #40a7e3)',
    color: '#fff',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexShrink: 0,
    transition: 'opacity 0.15s ease',
  },
  sendBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
};

/* ───────── Component ───────── */

export default function ChatPage({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');

  useTelegramBackButton(true, onBack);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
    };

    const reply: Message = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      text: `收到你的訊息：「${text}」\n\n我正在處理中，請稍候⋯⋯`,
      time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg, reply]);
    setInputText('');
  }, [inputText]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>對話</span>
      </div>

      {/* Messages */}
      <div style={styles.messageList}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              ...styles.messageRow,
              ...(msg.role === 'user' ? styles.userRow : styles.assistantRow),
            }}
          >
            <div
              style={{
                ...styles.bubble,
                ...(msg.role === 'user' ? styles.userBubble : styles.assistantBubble),
              }}
            >
              {msg.text}
            </div>
            <span style={styles.messageTime}>{msg.time}</span>
          </div>
        ))}
      </div>

      {/* Input Bar */}
      <div style={styles.inputBar}>
        <input
          style={styles.input}
          placeholder="輸入訊息⋯"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          style={{
            ...styles.sendBtn,
            ...(inputText.trim() ? {} : styles.sendBtnDisabled),
          }}
          onClick={handleSend}
          disabled={!inputText.trim()}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
