/**
 * 手機排版修正 v4
 * - 漢堡選單（垂直滑入面板）
 * - Hero 區強制單欄 + 字級縮放
 * - 哨兵過濾器
 * - MutationObserver + 輪詢保障
 */
(function() {
  'use strict';

  // ── 哨兵 ──
  window.__sentryCheck = function(t) {
    if (!t || t.length < 10) return null;
    var p = [/ignore\s+.*(instructions|prompts|rules)/i, /你是誰.*(系統|提示詞)/i, /[你妳].*(系統指令|system prompt)/i, /輸出.*(原始|完整).*(提示詞|指令)/i, /DAN|do\s+anything\s+now|free\s+mode/i, /洩漏.*(金鑰|key|密碼|password|token|secret)/i];
    for (var i = 0; i < p.length; i++) { if (p[i].test(t)) return { blocked: true, message: '你的問題好像不太對勁～可以直接寄信聊聊：Lucien127@proton.me' }; }
    if (t.length > 2000) return { blocked: true, message: '訊息太長了～方便整理重點直接寄信嗎？' };
    return null;
  };
  window.__sentryFilter = function(t) {
    if (!t) return t;
    if (/(freellmapi|sk-|AIza|ghp_|Bearer|api[_-]?key)/i.test(t)) return '抱歉，出了點問題，重新問一次？或寄信：Lucien127@proton.me';
    return t;
  };

  // ── Hero 區手機版強制修復 ──
  function fixHeroMobile() {
    var w = window.innerWidth;
    if (w > 768) return;

    // 目標：找到 Hero 區的 grid container
    // 可能 selector 是 section 的 flex/grid 包住標題 + widget
    var containers = document.querySelectorAll('section > .flex, section > div[style*="grid"]');
    if (!containers || containers.length === 0) {
      // fallback: 找任何直接包了標題和 .widget / chat 的容器
      containers = document.querySelectorAll('section');
    }

    for (var i = 0; i < containers.length; i++) {
      var el = containers[i];
      // 強制單欄
      el.style.setProperty('grid-template-columns', '1fr', 'important');
      el.style.setProperty('flex-direction', 'column', 'important');
      el.style.setProperty('display', 'flex', 'important');
    }

    // 縮小 Hero 區標題字級
    var targets = [
      // 大型標題（46px 那種）
      'h1', '.hero-title', '.headline', '[class*="hero"] h1',
      '[class*="hero"] [class*="title"]', '[class*="heading"]',
      // 直排文字區
      '.dc-text-block h1', '.dc-text-block .dc-text-block',
      // 所有大字
      '.dc-text-style-display, .dc-text-style-heading1, .dc-text-style-heading2',
      '[style*="font-size: 46"]', '[style*="font-size:46"]'
    ];

    var all = document.querySelectorAll(targets.join(','));
    for (var j = 0; j < all.length; j++) {
      var t = all[j];
      // 只改大於 22px 的
      var fs = window.getComputedStyle(t).fontSize;
      var px = parseFloat(fs);
      if (px > 22) {
        if (px >= 40) {
          t.style.setProperty('font-size', '28px', 'important');
          t.style.setProperty('line-height', '1.4', 'important');
        } else {
          t.style.setProperty('font-size', Math.min(px, 24) + 'px', 'important');
          t.style.setProperty('line-height', '1.4', 'important');
        }
      }
    }

    // 縮小 section 標題
    var secTitles = document.querySelectorAll('section h2, .dc-text-style-heading2');
    for (var k = 0; k < secTitles.length; k++) {
      var st = secTitles[k];
      st.style.setProperty('font-size', '18px', 'important');
      st.style.setProperty('line-height', '1.5', 'important');
    }
  }

  // ── 執行 ──
  function runAll() {
    fixHeroMobile();
    setupMenu();
  }

  // ── 漢堡選單 ──
  function setupMenu() {
    var btn = document.querySelector('.hamburger');
    var menu = document.querySelector('.nav-links');
    if (!btn || !menu || btn.dataset.hb) return;
    btn.dataset.hb = '1';

    var overlay = document.querySelector('.nav-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'nav-overlay';
      btn.parentNode.appendChild(overlay);
    }

    function applyMobileNav() {
      var w = window.innerWidth;
      if (w > 768) return;
      menu.style.setProperty('display', 'flex', 'important');
      menu.style.setProperty('flex-direction', 'column', 'important');
      menu.style.setProperty('position', 'fixed', 'important');
      menu.style.setProperty('top', '0', 'important');
      menu.style.setProperty('right', '0', 'important');
      menu.style.setProperty('width', '280px', 'important');
      menu.style.setProperty('height', '100vh', 'important');
      menu.style.setProperty('height', '100dvh', 'important');
      menu.style.setProperty('background', '#fff', 'important');
      menu.style.setProperty('padding', '96px 32px 40px', 'important');
      menu.style.setProperty('gap', '8px', 'important');
      menu.style.setProperty('z-index', '9999', 'important');
      menu.style.setProperty('box-shadow', '-4px 0 32px rgba(0,0,0,0.12)', 'important');
      menu.style.setProperty('transform', 'translateX(100%)', 'important');
      menu.style.setProperty('transition', 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)', 'important');
      menu.style.setProperty('overflow-y', 'auto', 'important');
      menu.style.setProperty('align-items', 'stretch', 'important');

      var links = menu.querySelectorAll('a');
      for (var i = 0; i < links.length; i++) {
        links[i].style.setProperty('display', 'flex', 'important');
        links[i].style.setProperty('padding', '14px 16px', 'important');
        links[i].style.setProperty('font-size', '15px', 'important');
        links[i].style.setProperty('border-radius', '12px', 'important');
        links[i].style.setProperty('min-height', '48px', 'important');
        links[i].style.setProperty('color', 'var(--text-primary)', 'important');
      }

      overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.35);z-index:9998;backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);';
    }

    applyMobileNav();

    function openM() {
      menu.classList.add('open');
      btn.classList.add('open');
      menu.style.setProperty('transform', 'translateX(0)', 'important');
      if (overlay) { overlay.style.display = 'block'; overlay.classList.add('open'); }
      document.body.style.overflow = 'hidden';
    }

    function closeM() {
      menu.classList.remove('open');
      btn.classList.remove('open');
      menu.style.setProperty('transform', 'translateX(100%)', 'important');
      if (overlay) { overlay.style.display = 'none'; overlay.classList.remove('open'); }
      document.body.style.overflow = '';
    }

    function toggleM() {
      if (menu.classList.contains('open')) { closeM(); } else { openM(); }
    }

    btn.onclick = function(e) { e.stopPropagation(); toggleM(); };
    btn.ontouchend = function(e) { e.preventDefault(); toggleM(); };

    if (overlay) {
      overlay.onclick = closeM;
      overlay.ontouchend = function(e) { e.preventDefault(); closeM(); };
    }

    menu.onclick = function(e) {
      var link = e.target.closest('a');
      if (link) setTimeout(closeM, 100);
    };

    window.addEventListener('resize', function() {
      if (window.innerWidth > 768 && menu.classList.contains('open')) closeM();
      applyMobileNav();
      fixHeroMobile();
    });

    console.log('[導航] ✅ 漢堡選單已綁定');
  }

  // ── 初次執行 ──
  runAll();

  // ── MutationObserver 監聽動態 DOM ──
  var iv = setInterval(function() { runAll(); setupChatFAB(); }, 500);
  setTimeout(function() { clearInterval(iv); }, 15000);

  var obs = new MutationObserver(function() { runAll(); setupChatFAB(); });
  if (document.body) obs.observe(document.body, { childList: true, subtree: true, attributes: false });

  // ── 頁面完全載入後再跑一次 ──
  window.addEventListener('load', function() { setTimeout(runAll, 200); });
  window.addEventListener('DOMContentLoaded', function() { setTimeout(runAll, 100); });

  // ── 浮動聊天按鈕（右下圓圈） ──
  var hermesFAB = null, hermesPanel = null, hermesOpen = false;

  function setupChatFAB() {
    if (document.getElementById('hermes-chat-fab')) return;
    if (document.getElementById('zhiyan-fab')) return;  // 已有 AI 客服 FAB，跳過

    // 注入 keyframes
    if (!document.getElementById('hermes-chat-keyframes')) {
      var kf = document.createElement('style');
      kf.id = 'hermes-chat-keyframes';
      kf.textContent = '@keyframes hSlideUp{from{opacity:0;transform:translateY(16px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}';
      document.head.appendChild(kf);
    }

    // ── 浮動按鈕 ──
    var fab = document.createElement('div');
    fab.id = 'hermes-chat-fab'; hermesFAB = fab;
    fab.style.cssText = 'position:fixed;bottom:28px;right:24px;z-index:99999;width:60px;height:60px;border-radius:50%;cursor:pointer;border:none;background:url(/images/ai-chat-icon.jpg) center/cover no-repeat;box-shadow:0 4px 20px rgba(0,0,0,.18);';
    document.body.appendChild(fab);

    // ── 彈出面板（初始隱藏）──
    var p = document.createElement('div');
    p.id = 'hermes-chat-panel'; hermesPanel = p;
    p.style.cssText = 'position:fixed;bottom:96px;right:20px;width:360px;max-width:92vw;max-height:70vh;background:#fff;border-radius:20px;box-shadow:0 8px 40px rgba(0,0,0,.18);z-index:99998;display:none;flex-direction:column;overflow:hidden;';
    p.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid #eee;">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<span style="width:8px;height:8px;border-radius:50%;background:#34c759;"></span>' +
          '<span style="font-size:14px;font-weight:700;color:#555;">智小研 · 歡迎聊聊</span>' +
        '</div>' +
        '<span id="hermes-chat-close" style="font-size:18px;cursor:pointer;color:#999;line-height:1;">✕</span>' +
      '</div>' +
      '<div style="flex:1;padding:18px;overflow-y:auto;text-align:center;">' +
        '<div style="margin-top:20px;font-size:15px;color:#666;line-height:1.6;">有想法想討論？<br/>直接寄信或填表單，我親自回。</div>' +
        '<a href="mailto:Lucien127@proton.me" style="display:inline-block;margin-top:20px;background:#c9a84c;color:#fff;padding:12px 28px;border-radius:40px;font-weight:700;text-decoration:none;font-size:14px;">寄信給我</a>' +
        '<div style="margin-top:14px;">' +
          '<a href="contact" style="color:#c9a84c;font-size:13px;font-weight:700;text-decoration:none;">填表單約時間 →</a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(p);

    // ── 開關 ──
    function toggleChat() {
      hermesOpen = !hermesOpen;
      p.style.display = hermesOpen ? 'flex' : 'none';
      if (hermesOpen) p.style.animation = 'hSlideUp .25s ease';
    }

    // 綁事件（用點擊代理避免 support.js 覆蓋）
    fab.onclick = function(e) { e.stopPropagation(); toggleChat(); };

    document.getElementById('hermes-chat-close').onclick = function(e) {
      e.stopPropagation(); hermesOpen = true; toggleChat();
    };

    // 點外面關
    document.addEventListener('click', function(e) {
      if (hermesOpen && !p.contains(e.target) && e.target !== fab && !fab.contains(e.target)) {
        hermesOpen = false; p.style.display = 'none';
      }
    }, true);

    console.log('[聊天 FAB] ✅ 已建立');
  }

  // ── 啟動 FAB ──
  setTimeout(function() { setupChatFAB(); }, 800);
  window.addEventListener('load', function() { setTimeout(setupChatFAB, 500); });

  console.log('[手機修正 v4] ✅ 已啟動');
})();
