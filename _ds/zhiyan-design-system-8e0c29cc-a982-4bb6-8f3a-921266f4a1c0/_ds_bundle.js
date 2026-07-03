/* @ds-bundle: {"format":4,"namespace":"ZhiyanDesignSystem_8e0c29","components":[{"name":"MessageBubble","sourcePath":"components/chat/MessageBubble.jsx"},{"name":"SuggestionChip","sourcePath":"components/chat/SuggestionChip.jsx"}],"sourceHashes":{"components/chat/MessageBubble.jsx":"7d52cb7b0e76","components/chat/SuggestionChip.jsx":"3281e20e8130","sources/zhiyan-web/app.js":"1b47975dd817"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ZhiyanDesignSystem_8e0c29 = window.ZhiyanDesignSystem_8e0c29 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/chat/MessageBubble.jsx
try { (() => {
/** 聊天訊息氣泡 — user 靠右淺藍，ai 靠左白底描邊 */
function MessageBubble({
  role = 'ai',
  children,
  meta,
  modeTag,
  error = false
}) {
  const isUser = role === 'user';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      maxWidth: '85%',
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      flexDirection: isUser ? 'row-reverse' : 'row'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 34,
      height: 34,
      borderRadius: '50%',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 18,
      background: isUser ? 'var(--color-primary)' : 'var(--accent-tint-15)'
    }
  }, isUser ? '👤' : '⚖️'), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 18px',
      fontSize: 14,
      lineHeight: 1.7,
      borderRadius: 'var(--radius-md)',
      background: error ? '#fef2f2' : isUser ? 'var(--bubble-user)' : 'var(--bubble-ai)',
      color: 'var(--text-primary)',
      border: isUser ? 'none' : `1px solid ${error ? '#fca5a5' : 'var(--bubble-border)'}`,
      borderBottomRightRadius: isUser ? 'var(--radius-bubble-tail)' : 'var(--radius-md)',
      borderBottomLeftRadius: isUser ? 'var(--radius-md)' : 'var(--radius-bubble-tail)'
    }
  }, children), (meta || modeTag) && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text-light)',
      marginTop: 6,
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, modeTag && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      padding: '2px 8px',
      borderRadius: 10,
      background: 'var(--accent-tint-10)',
      color: 'var(--color-accent)'
    }
  }, modeTag), meta)));
}
Object.assign(__ds_scope, { MessageBubble });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/chat/MessageBubble.jsx", error: String((e && e.message) || e) }); }

// components/chat/SuggestionChip.jsx
try { (() => {
/** 建議問題 chip — 圓角 20px，hover 轉金 */
function SuggestionChip({
  children,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      padding: '10px 18px',
      fontSize: 13,
      cursor: 'pointer',
      border: `1px solid ${hover ? 'var(--color-accent)' : 'var(--bubble-border)'}`,
      borderRadius: 'var(--radius-pill)',
      color: hover ? 'var(--color-accent)' : 'var(--text-secondary)',
      background: hover ? 'var(--accent-tint-05)' : 'var(--bg-chat)',
      transition: 'all 0.2s',
      fontFamily: 'var(--font-sans)'
    }
  }, children);
}
Object.assign(__ds_scope, { SuggestionChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/chat/SuggestionChip.jsx", error: String((e && e.message) || e) }); }

// sources/zhiyan-web/app.js
try { (() => {
/* ══════════════════════════════════════════════════
   智研 AI 法律系統 · SaaS 版
   前端邏輯 — 聊天 UI 互動
   ══════════════════════════════════════════════════ */

// ─── 狀態 ──────────────────────────────────────────
const state = {
  model: 'deepseek-chat',
  status: 'checking',
  messages: [],
  sending: false
};

// ─── DOM 參考 ──────────────────────────────────────
const $ = sel => document.querySelector(sel);
const chatArea = $('#chatArea');
const messages = $('#messages');
const welcome = $('#welcome');
const input = $('#messageInput');
const sendBtn = $('#sendBtn');
const statusText = $('#statusText');
const modelDisplay = $('#modelDisplay');
const loadingOverlay = $('#loadingOverlay');

// ─── 初始化 ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkStatus();
  setupMobileMenu();
  setupAutoSend();
});

// ─── 系統狀態 ──────────────────────────────────────
async function checkStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    state.status = 'connected';
    state.model = data.model;
    statusText.textContent = '已連線';
    modelDisplay.textContent = data.model;
  } catch (e) {
    state.status = 'error';
    statusText.textContent = '連線失敗';
    document.querySelector('.status-dot').style.background = '#ef4444';
  }
}

// ─── 發送訊息 ──────────────────────────────────────
async function sendMessage() {
  const text = input.value.trim();
  if (!text || state.sending) return;

  // 清除歡迎畫面
  welcome.style.display = 'none';

  // 顯示使用者訊息
  addMessage(text, 'user');

  // 清空輸入
  input.value = '';
  input.style.height = 'auto';
  sendBtn.disabled = true;

  // 顯示載入
  state.sending = true;
  loadingOverlay.style.display = 'flex';
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: text,
        temperature: 0.3,
        max_tokens: 4096
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || '伺服器錯誤');
    }
    const data = await res.json();
    addMessage(data.content, 'ai', data);
    state.model = data.model;
    modelDisplay.textContent = data.model;
  } catch (e) {
    addMessage(`❌ 查詢失敗：${e.message}`, 'ai', null, true);
  } finally {
    state.sending = false;
    loadingOverlay.style.display = 'none';
  }
}

// ─── 新增訊息 ──────────────────────────────────────
function addMessage(text, role, meta = null, isError = false) {
  const div = document.createElement('div');
  div.className = `message ${role}`;

  // 大頭貼
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = role === 'user' ? '👤' : '⚖️';

  // 氣泡
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  // 轉換換行為 <p> 段落
  const paragraphs = text.split('\n').filter(Boolean);
  bubble.innerHTML = paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('');
  if (isError) {
    bubble.style.borderColor = '#fca5a5';
    bubble.style.background = '#fef2f2';
  }

  // 中繼資料
  if (meta && meta.mode) {
    const metaDiv = document.createElement('div');
    metaDiv.className = 'message-meta';
    metaDiv.innerHTML = `
      <span class="mode-tag">${meta.mode_label}</span>
      <span>⚡ ${meta.tokens_in + meta.tokens_out} tokens</span>
    `;
    bubble.appendChild(metaDiv);
  }
  div.appendChild(avatar);
  div.appendChild(bubble);
  messages.appendChild(div);

  // 滾到底
  scrollToBottom();
}

// ─── 建議問題 ──────────────────────────────────────
function askSuggest(btn) {
  input.value = btn.textContent;
  autoResize(input);
  sendMessage();
}

// ─── 新對話 ────────────────────────────────────────
function newChat() {
  messages.innerHTML = '';
  welcome.style.display = 'flex';
  input.value = '';
  input.style.height = 'auto';
  sendBtn.disabled = true;
  scrollToBottom();
}

// ─── 快捷鍵 ────────────────────────────────────────
function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// ─── 自動調整輸入框 ────────────────────────────────
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// ─── 啟用/停用送出按鈕 ──────────────────────────────
function setupAutoSend() {
  input.addEventListener('input', () => {
    sendBtn.disabled = !input.value.trim() || state.sending;
  });
}

// ─── 行動版選單 ────────────────────────────────────
function setupMobileMenu() {
  const toggle = $('#menuToggle');
  const sidebar = $('#sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // 點主內容關閉選單
    document.addEventListener('click', e => {
      if (window.innerWidth <= 768) {
        if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      }
    });
  }
}

// ─── 滾動到底 ──────────────────────────────────────
function scrollToBottom() {
  requestAnimationFrame(() => {
    chatArea.scrollTop = chatArea.scrollHeight;
  });
}

// ─── HTML 跳脫 ─────────────────────────────────────
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "sources/zhiyan-web/app.js", error: String((e && e.message) || e) }); }

__ds_ns.MessageBubble = __ds_scope.MessageBubble;

__ds_ns.SuggestionChip = __ds_scope.SuggestionChip;

})();
