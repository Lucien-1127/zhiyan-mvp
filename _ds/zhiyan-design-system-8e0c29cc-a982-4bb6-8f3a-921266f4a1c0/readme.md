# 智研 Zhiyan Design System · 智研 AI 法律系統

Design system for **Zhiyan AI Legal System (智研 AI 法律系統)** — an open-source Taiwan law AI research framework (multi-model committee, GraphRAG, mandatory citation, contract review).

**Source repo:** https://github.com/Lucien-1127/zhiyan-legal — explore it further to build designs grounded in the real product:
- `frontend/` — 智研 chat SaaS web UI (vanilla HTML/CSS/JS), copied to `sources/zhiyan-web/`
- `law_monitor_app/` — 法規異動監控 Flutter mobile app (Material 3), Dart screens copied to `sources/law_monitor_app/`

## Products / surfaces

1. **智研法律諮詢 (chat)** — a legal Q&A chat interface. Dark navy sidebar, gold accent, white chat canvas, suggestion chips, message bubbles with mode tags. Recreated at iPhone size in `ui_kits/chat/`.
2. **法規異動監控 (law monitor)** — a mobile app tracking Taiwan statute changes (全國法規資料庫). Material 3, seed color `#1A5276`, status-dot cards (green/yellow/red), diff viewer with 修正/新增/刪除 article cards. Recreated in `ui_kits/law_monitor/`.

## CONTENT FUNDAMENTALS

- **Language:** Traditional Chinese (zh-Hant, Taiwan). English only for technical identifiers (model names like `deepseek-chat`, versions `v1.0.0 · SaaS 版`, API URLs).
- **Register:** professional, precise legal software. Polite second person 「您」 in prompts (「輸入您的法律問題...」); imperative labels are terse 2–4 character verbs: 儲存, 重試, 追蹤, 執行查核, 完整對照, 新對話.
- **Interpunct `·` as separator** everywhere: 「台灣法律 AI 研究助手 · 5 層架構 · 強制引用 · 安全優先」, 「法律 · 修正 20240731」.
- **Full-width punctuation** in body copy (：、。？); counts written 「6 部有異動」「近 7 天異動：3 部」.
- **Emoji ARE part of the product voice** — used as functional icons and status markers: ⚖️ (brand mark), 💬 🆕 ☰ ➤ 👤, ✅/❌ for test results, 🔶/🟢/🔴 prefixing diff section titles.
- **Disclaimers are mandatory** on legal output surfaces: 「本 App 僅供參考，不構成法律意見。」/ "Outputs are research artifacts, not legal advice."
- Ellipsis for in-progress states: 連線中... / 測試中… / 智研分析中...

## VISUAL FOUNDATIONS

- **Palette:** deep navy `#1a2332` (authority) + legal gold `#c9a84c` (accent) on light gray `#f5f6fa` canvas with white cards. The monitor app runs on a separate Material 3 steel-blue seed `#1A5276`. Status trio: green `#22c55e` / orange / red. Diff kinds use muted exact hexes: 修正 `#B4882B`, 新增 `#2F7D4F`, 刪除 `#B4452B`.
- **Type:** system CJK stack (`-apple-system … "Noto Sans TC", "PingFang TC", "Microsoft JhengHei"`). No display serif, no webfonts. Base 15px/1.6; messages 14px/1.7; stat numbers 28px bold; logo subtitle 11px uppercase letter-spacing 2px.
- **Backgrounds:** flat solid colors only. No gradients, no imagery, no textures, no illustrations.
- **Corners:** 8px buttons, 12px cards/bubbles/inputs, 16px modals, 20px full-pill chips, circles for avatars/send/dots. Chat bubbles flatten the sender-side bottom corner to 4px (tail).
- **Shadows:** very restrained — `0 1px 3px rgba(0,0,0,.08)` and `0 4px 12px rgba(0,0,0,.1)`; monitor cards are Material elevation 1. Most separation is done with 1px `#e5e7eb` borders, not shadows.
- **Tint system:** accent/semantic colors are reused at low alpha for fills — 15% (active nav, avatar bg), 12% (pills), 10% (mode tags), 8% (diff card headers), 5% (chip hover). Never a second saturated color.
- **Animation:** subtle and quick — fadeIn 0.2–0.5s, messages slide up 8px over 0.3s ease, spinner 0.8s linear. Transitions 0.15–0.2s. No bounces.
- **Hover:** borders/text recolor to gold; sidebar items get `rgba(255,255,255,.08)` fill; send button scales 1.05. **Focus:** gold border + `0 0 0 3px rgba(201,168,76,.1)` ring. **Disabled:** opacity 0.4.
- **Layout:** fixed 260px dark sidebar + fluid main column (web); on mobile the sidebar becomes a slide-in drawer. Monitor app: centered app bar, stat summary card, card list, extended FAB bottom-right.
- **Cards:** white, 12px radius, 1px border or elevation-1, 16px padding. Diff cards have a tinted full-width header strip.

## ICONOGRAPHY

- **Chat product: emoji ARE the icon system.** ⚖️ brand, 💬 諮詢, 🆕 new chat, ☰ menu, ➤ send, 👤 user. Unicode arrows/symbols used directly. Do NOT swap in an icon font for the chat surface.
- **Monitor app: Material Symbols** (Flutter built-in `Icons.*`): search, settings, refresh, chevron_right, compare_arrows, cloud_off, error_outline, check_circle, add, link, save, wifi_find, circle. UI kits link **Material Symbols Outlined** from Google Fonts CDN — same glyph set as Flutter, not a substitution.
- **No logo asset exists** in the repo (favicon is the ⚖️ emoji rendered as SVG text). Where a mark is needed, render 「智研」 in bold white 20px + 「AI 法律系統」 11px uppercase-tracked subtitle next to ⚖️. Do not draw a logo.

## Index

- `styles.css` → imports `tokens/colors.css`, `tokens/typography.css`, `tokens/spacing.css`
- `guidelines/` — foundation specimen cards (Design System tab)
- `components/chat/` — MessageBubble, SuggestionChip, ChatInput, StatusBadge, ModeTag, NavButton
- `components/monitor/` — Pill, StatItem, LawCard, DiffCard, MonitorButton, SearchField, Fab
- `ui_kits/chat/` — 智研法律諮詢 interactive iPhone-size recreation
- `ui_kits/law_monitor/` — 法規異動監控 interactive iPhone-size recreation (Dashboard/Search/Detail/Diff/Settings)
- `sources/` — verbatim source files from the repo (ground truth)
- `SKILL.md` — agent skill entry point

### Intentional additions
- `MonitorButton` — one component wrapping Flutter's Filled/Tonal/Outlined button variants used across the monitor screens.
- Material Symbols via CDN — stands in for Flutter's bundled Material icon font.
