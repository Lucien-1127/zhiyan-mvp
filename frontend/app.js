/* ══════════════════════════════════════════════════
   智研 AI 法律系統 · SaaS 版
   前端邏輯 — 聊天 UI 互動
   v1.1.0：對話紀錄持久化、多輪上下文、Markdown 渲染、
           深色模式、複製/重試/匯出
   ══════════════════════════════════════════════════ */

// ─── 常數 ──────────────────────────────────────────
const STORE_KEY = 'zhiyan_conversations';
const ACTIVE_KEY = 'zhiyan_active_conv';
const THEME_KEY = 'zhiyan_theme';
const MAX_HISTORY_TURNS = 6; // 送往後端的上下文輪數上限

// ─── 狀態 ──────────────────────────────────────────
const state = {
  model: 'deepseek-chat',
  status: 'checking',
  conversations: [],   // [{id, title, createdAt, updatedAt, messages:[{role,text,meta,ts,isError}]}]
  activeId: null,
  sending: false,
};

// ─── DOM 參考 ──────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const chatArea = $('#chatArea');
const messages = $('#messages');
const welcome = $('#welcome');
const input = $('#messageInput');
const sendBtn = $('#sendBtn');
const statusText = $('#statusText');
const modelDisplay = $('#modelDisplay');
const convList = $('#convList');

// ─── 初始化 ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadConversations();
  checkStatus();
  setupMobileMenu();
  setupAutoSend();
});

// ─── 深色模式 ──────────────────────────────────────
function initTheme() {
  let theme = localStorage.getItem(THEME_KEY);
  if (!theme) {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = $('#themeToggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#0f1520' : '#1a2332';
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = cur === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

// ─── 對話紀錄（localStorage）───────────────────────
function loadConversations() {
  try {
    state.conversations = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
  } catch (e) {
    state.conversations = [];
  }
  state.activeId = localStorage.getItem(ACTIVE_KEY) || null;
  const active = getActiveConv();
  if (active) {
    renderConversation(active);
  }
  renderConvList();
}

function saveConversations() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state.conversations));
    if (state.activeId) localStorage.setItem(ACTIVE_KEY, state.activeId);
  } catch (e) {
    // 容量滿時移除最舊的對話後重試一次
    if (state.conversations.length > 1) {
      state.conversations.sort((a, b) => b.updatedAt - a.updatedAt);
      state.conversations.pop();
      try { localStorage.setItem(STORE_KEY, JSON.stringify(state.conversations)); } catch (e2) { /* 放棄 */ }
    }
  }
}

function getActiveConv() {
  return state.conversations.find((c) => c.id === state.activeId) || null;
}

function ensureActiveConv(firstText) {
  let conv = getActiveConv();
  if (!conv) {
    conv = {
      id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: (firstText || '新對話').slice(0, 24),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    state.conversations.unshift(conv);
    state.activeId = conv.id;
  }
  return conv;
}

function switchConv(id) {
  if (state.sending) return;
  state.activeId = id;
  localStorage.setItem(ACTIVE_KEY, id);
  const conv = getActiveConv();
  messages.innerHTML = '';
  if (conv) renderConversation(conv);
  renderConvList();
  closeSidebarOnMobile();
}

function deleteConv(id, ev) {
  if (ev) ev.stopPropagation();
  if (!confirm('確定刪除這則對話紀錄？')) return;
  state.conversations = state.conversations.filter((c) => c.id !== id);
  if (state.activeId === id) {
    state.activeId = null;
    localStorage.removeItem(ACTIVE_KEY);
    messages.innerHTML = '';
    welcome.style.display = 'flex';
  }
  saveConversations();
  renderConvList();
}

function renderConvList() {
  convList.innerHTML = '';
  const sorted = [...state.conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  if (sorted.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'conv-empty';
    empty.textContent = '尚無對話紀錄';
    convList.appendChild(empty);
    return;
  }
  sorted.forEach((c) => {
    const item = document.createElement('button');
    item.className = 'conv-item' + (c.id === state.activeId ? ' active' : '');
    item.onclick = () => switchConv(c.id);

    const title = document.createElement('span');
    title.className = 'conv-title';
    title.textContent = c.title || '未命名對話';

    const del = document.createElement('span');
    del.className = 'conv-del';
    del.textContent = '✕';
    del.title = '刪除';
    del.onclick = (ev) => deleteConv(c.id, ev);

    item.appendChild(title);
    item.appendChild(del);
    convList.appendChild(item);
  });
}

function renderConversation(conv) {
  welcome.style.display = conv.messages.length ? 'none' : 'flex';
  messages.innerHTML = '';
  conv.messages.forEach((m) => appendMessageEl(m));
  scrollToBottom();
}

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
async function sendMessage(retryText) {
  const text = (retryText || input.value).trim();
  if (!text || state.sending) return;

  welcome.style.display = 'none';

  const conv = ensureActiveConv(text);
  const userMsg = { role: 'user', text, ts: Date.now() };
  conv.messages.push(userMsg);
  conv.updatedAt = Date.now();
  appendMessageEl(userMsg);
  saveConversations();
  renderConvList();

  if (!retryText) {
    input.value = '';
    input.style.height = 'auto';
  }
  sendBtn.disabled = true;
  state.sending = true;

  // 行內打字指示（不再全螢幕鎖定）
  const typing = appendTyping();

  // 多輪上下文：帶上最近幾輪對話（不含剛送出的這句與錯誤訊息）
  const history = conv.messages
    .slice(0, -1)
    .filter((m) => !m.isError)
    .slice(-MAX_HISTORY_TURNS * 2)
    .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));

  try {
    const res = await fetch('/api/chat/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history,
        temperature: 0.3,
        max_tokens: 4096,
        provider: 'freellmapi',
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(errText ? `伺服器錯誤: ${errText.slice(0, 100)}` : `HTTP ${res.status}`);
    }

    const data = await res.json();
    let displayContent = data.content;

    // RAG 無資料時顯示警告
    if (data.rag_warning) {
      displayContent = '⚠️ ' + displayContent;
    }

    const aiMsg = { role: 'ai', text: displayContent, meta: { model: data.model, rag_hits: data.rag_hits }, ts: Date.now() };
    conv.messages.push(aiMsg);
    conv.updatedAt = Date.now();
    typing.remove();
    appendMessageEl(aiMsg);

    state.model = data.model || 'auto';
    modelDisplay.textContent = state.model;
  } catch (e) {
    const errMsg = { role: 'ai', text: `❌ 連線失敗：${e.message}`, isError: true, retryFor: text, ts: Date.now() };
    conv.messages.push(errMsg);
    typing.remove();
    appendMessageEl(errMsg);
  } finally {
    state.sending = false;
    sendBtn.disabled = !input.value.trim();
    saveConversations();
    renderConvList();
  }
}

// ─── 重試 ──────────────────────────────────────────
function retryMessage(text) {
  if (state.sending) return;
  const conv = getActiveConv();
  if (conv) {
    // 移除最後的錯誤訊息與對應的使用者訊息，避免重複堆疊
    const last = conv.messages[conv.messages.length - 1];
    if (last && last.isError) {
      conv.messages.pop();
      const prev = conv.messages[conv.messages.length - 1];
      if (prev && prev.role === 'user' && prev.text === text) conv.messages.pop();
      renderConversation(conv);
      saveConversations();
    }
  }
  sendMessage(text);
}

// ─── 訊息渲染 ──────────────────────────────────────
function appendMessageEl(m) {
  const div = document.createElement('div');
  div.className = `message ${m.role}`;

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = m.role === 'user' ? '👤' : '⚖️';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.innerHTML = renderMarkdownLite(m.text);

  if (m.isError) {
    bubble.classList.add('error');
    const retryBtn = document.createElement('button');
    retryBtn.className = 'retry-btn';
    retryBtn.textContent = '🔄 重試';
    retryBtn.onclick = () => retryMessage(m.retryFor);
    bubble.appendChild(retryBtn);
  }

  // 中繼資料
  if (m.meta && m.meta.model) {
    const metaDiv = document.createElement('div');
    metaDiv.className = 'message-meta';
    metaDiv.innerHTML = `
      <span class="mode-tag">${escapeHtml(m.meta.model)}</span>
      <span>📚 RAG: ${m.meta.rag_hits || 0} 條</span>
      <span>${formatTime(m.ts)}</span>
    `;
    bubble.appendChild(metaDiv);
  }

  // AI 訊息附複製按鈕
  if (m.role === 'ai' && !m.isError) {
    const actions = document.createElement('div');
    actions.className = 'message-actions';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'action-btn';
    copyBtn.textContent = '📋 複製';
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(m.text).then(() => {
        copyBtn.textContent = '✓ 已複製';
        setTimeout(() => { copyBtn.textContent = '📋 複製'; }, 1500);
      });
    };
    actions.appendChild(copyBtn);
    bubble.appendChild(actions);
  }

  div.appendChild(avatar);
  div.appendChild(bubble);
  messages.appendChild(div);
  scrollToBottom();
  return div;
}

function appendTyping() {
  const div = document.createElement('div');
  div.className = 'message ai typing-row';
  div.innerHTML = `
    <div class="message-avatar">⚖️</div>
    <div class="message-bubble typing-bubble">
      <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>
      <span class="typing-label">智研分析中...</span>
    </div>
  `;
  messages.appendChild(div);
  scrollToBottom();
  return div;
}

// ─── 輕量 Markdown 渲染（先跳脫再轉換，安全）────────
function renderMarkdownLite(text) {
  const esc = escapeHtml(text);
  const lines = esc.split('\n');
  const out = [];
  let inCode = false;
  let codeBuf = [];
  let inList = false;

  const closeList = () => { if (inList) { out.push('</ul>'); inList = false; } };

  for (const line of lines) {
    // 圍欄式程式碼區塊
    if (/^```/.test(line.trim())) {
      if (inCode) {
        out.push('<pre><code>' + codeBuf.join('\n') + '</code></pre>');
        codeBuf = [];
        inCode = false;
      } else {
        closeList();
        inCode = true;
      }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }

    let html = line
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');

    // 標題
    const heading = /^(#{1,4})\s+(.*)$/.exec(html);
    if (heading) {
      closeList();
      const level = Math.min(heading[1].length + 2, 6);
      out.push(`<h${level}>${heading[2]}</h${level}>`);
      continue;
    }

    // 無序清單
    if (/^\s*[-•]\s+/.test(html)) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push('<li>' + html.replace(/^\s*[-•]\s+/, '') + '</li>');
      continue;
    }

    closeList();
    if (html.trim() === '') continue;
    out.push('<p>' + html + '</p>');
  }
  if (inCode) out.push('<pre><code>' + codeBuf.join('\n') + '</code></pre>');
  closeList();
  return out.join('');
}

// ─── 匯出對話 ──────────────────────────────────────
function exportChat() {
  const conv = getActiveConv();
  if (!conv || conv.messages.length === 0) {
    alert('目前沒有可匯出的對話。');
    return;
  }
  const lines = [
    '智研 AI 法律系統 — 對話紀錄',
    '匯出時間：' + new Date().toLocaleString('zh-TW'),
    '（本紀錄僅供參考，不構成法律意見。）',
    '═'.repeat(30),
    '',
  ];
  conv.messages.forEach((m) => {
    lines.push((m.role === 'user' ? '【我】' : '【智研】') + ' ' + formatTime(m.ts));
    lines.push(m.text);
    lines.push('');
  });
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '智研對話_' + new Date().toISOString().slice(0, 10) + '.txt';
  a.click();
  URL.revokeObjectURL(a.href);
}

// ─── 建議問題 ──────────────────────────────────────
function askSuggest(btn) {
  input.value = btn.textContent.trim();
  autoResize(input);
  sendMessage();
}

// ─── 新對話 ────────────────────────────────────────
function newChat() {
  if (state.sending) return;
  state.activeId = null;
  localStorage.removeItem(ACTIVE_KEY);
  messages.innerHTML = '';
  welcome.style.display = 'flex';
  input.value = '';
  input.style.height = 'auto';
  sendBtn.disabled = true;
  renderConvList();
  closeSidebarOnMobile();
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
  const backdrop = $('#sidebarBackdrop');

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (backdrop) backdrop.classList.toggle('show', sidebar.classList.contains('open'));
    });
    if (backdrop) {
      backdrop.addEventListener('click', () => {
        sidebar.classList.remove('open');
        backdrop.classList.remove('show');
      });
    }
  }
}

function closeSidebarOnMobile() {
  if (window.innerWidth <= 768) {
    $('#sidebar').classList.remove('open');
    const backdrop = $('#sidebarBackdrop');
    if (backdrop) backdrop.classList.remove('show');
  }
}

// ─── 滾動到底 ──────────────────────────────────────
function scrollToBottom() {
  requestAnimationFrame(() => {
    chatArea.scrollTop = chatArea.scrollHeight;
  });
}

// ─── 工具 ──────────────────────────────────────────
function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
