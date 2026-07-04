[![CodeQL](https://github.com/Lucien-1127/zhiyan-mvp/actions/workflows/codeql.yml/badge.svg)](https://github.com/Lucien-1127/zhiyan-mvp/actions/workflows/codeql.yml)

# 智研 AI 法律系統 — MVP 應用

完全繁體中文化的台灣法律 AI 助手，集成聊天諮詢、合約產生、法規監控、智慧搜尋、背景調查和文件摘要功能。

## 📦 核心功能模組

### 1️⃣ 法律諮詢 (`智研法律諮詢.dc.html`)
- 實時對話介面，支援多輪對話
- 建議問題快速啟動
- AI 回覆實時流式顯示
- 實現於 deepseek-chat 或其他 OpenAI 相容 LLM

### 2️⃣ 合約自動產生 (`合約產生器.dc.html`)
- 支援三種範本：保密協議（NDA）、服務條款、融資協議
- 參數化產生流程
- PDF 下載和文字複製
- 直接串接 NDA 腳本和法律範本庫

### 3️⃣ 法規異動監控 (`法規異動監控 Dashboard.dc.html`)
- 追蹤法規動態（修正/新增/刪除）
- 統計異動摘要卡片
- 法規卡片列表（綠/黃/紅 三色狀態指示）
- 執行查核按鈕串接後端檢查機制

### 4️⃣ 智慧搜尋 (RAG) (`智慧搜尋 RAG.dc.html`)
- 搜尋判決書、法規、條款
- 搜尋結果過濾和排序
- 直接整合 SQLite FTS5（47,001 條法規資料）
- OpenAI 相容 embedding 和向量搜尋

### 5️⃣ 背景調查報告 (`OSINT 調查.dc.html`)
- 人名/公司名快速查詢
- 整合 private-investigator-osint 技能
- 結構化報告生成
- 支援多源資料彙整

### 6️⃣ 文件自動摘要 (`AI 摘要生成.dc.html`)
- 長文件快速摘要
- 支援貼上內容或上傳檔案
- 法律文件專用摘要模式
- 可配置摘要長度和詳細度

### 7️⃣ 主應用框架 (`智研 App 主應用.dc.html`)
- 6 個功能模組的統一導航
- 行動側邊欄（可展開/收起）
- 頁面標題動態更新
- 使用者檔案和登出功能

## 🔌 後端 API 層

### API 配置 (`api-config.js`)
```javascript
// 統一管理所有 API 端點
const apiService = new ApiService(API_CONFIG);

// 範例呼叫
await apiService.askLegal('公然侮辱罪的構成要件？');
await apiService.generateContract('nda', { partyA, partyB });
await apiService.searchLaws('民法');
```

### 驗證層 (`oauth-service.js`)
- Google OAuth 登入
- GitHub OAuth 登入
- Token 和使用者檔案管理
- localStorage 持久化

### API 端點表

| 模組 | 端點 | 方法 | 說明 |
|------|------|------|------|
| 聊天 | `/api/chat/ask` | POST | 發送法律問題 |
| 聊天 | `/api/chat/history` | GET | 取得對話記錄 |
| 合約 | `/api/contract/generate` | POST | 生成合約 |
| 法規 | `/api/monitor/check` | POST | 檢查法規異動 |
| 搜尋 | `/api/search/query` | GET | RAG 搜尋 |
| OSINT | `/api/osint/investigate` | POST | 背景調查 |
| 摘要 | `/api/summary/generate` | POST | 生成摘要 |

## 🚀 環境設定

### 必要環境變數 (`.env`)

```bash
# API 伺服器
REACT_APP_API_URL=http://localhost:8000

# LLM 配置
REACT_APP_LLM_PROVIDER=deepseek
REACT_APP_LLM_URL=https://api.deepseek.com/v1
REACT_APP_LLM_KEY=sk_live_...

# OAuth（可選）
REACT_APP_GOOGLE_CLIENT_ID=...
REACT_APP_GITHUB_CLIENT_ID=...
```

## 📱 設備支援

- **行動優先**：375px × 812px 響應式設計
- **桌面相容**：側邊欄導航可展開
- **無依賴**：純 HTML/CSS/JS，Design Component 架構

## 🎨 設計系統

遵循智研 Zhiyan Design System：
- **色彩**：深藍 `#1a2332` + 法律金 `#c9a84c`
- **排版**：系統字體堆疊（蘋方/PingFang/微軟正黑）
- **邊角**：8-20px 圓角，卡片 12px
- **陰影**：極簡 (`0 1px 3px`, `0 4px 12px`)
- **語氣**：專業法律、繁體中文、敬語

## 📂 檔案結構

```
.
├── 智研 App 主應用.dc.html          (主導航框架)
├── 智研法律諮詢.dc.html              (聊天介面)
├── 合約產生器.dc.html               (NDA/條款產生)
├── 法規異動監控 Dashboard.dc.html    (法規追蹤)
├── 法規異動監控 Search.dc.html       (搜尋法規)
├── 法規異動監控 Diff Viewer.dc.html  (條文對照)
├── 智慧搜尋 RAG.dc.html             (判決書搜尋)
├── api-config.js                     (API 層配置)
├── oauth-service.js                  (OAuth 驗證)
└── README.md                         (本檔)
```

## 🔧 快速開始

### 開發環境

1. 複製此專案
2. 設定 `.env` 環境變數
3. 在瀏覽器開啟任一 `.dc.html` 檔案
4. 或啟動開發伺服器（若使用 Node.js）

### 部署到 Docker

```bash
# 使用 Docker Compose
docker-compose up -d

# 應用將在 http://localhost:3000 提供
```

### 連接後端 API

後端應實現以下堆疊：

- **框架**：FastAPI (Python) 或 Express (Node.js)
- **資料庫**：SQLite (FTS5) + PostgreSQL (可選)
- **LLM**：OpenAI 相容 API (DeepSeek、Claude、Gemini)
- **搜尋**：Elasticsearch 或 Milvus (可選，需高效能)

## 📋 待實裝清單

- [ ] 後端 FastAPI/Express 伺服器
- [ ] OAuth 回調端點實裝
- [ ] RAG 搜尋向量化和索引
- [ ] OSINT 資料來源整合
- [ ] 合約範本庫擴充
- [ ] PDF 產生和下載
- [ ] WebSocket 實時對話流
- [ ] 使用者檔案和設定儲存
- [ ] 歷史記錄和收藏功能
- [ ] 多語言支援（英文、簡中）

## 📞 聯繫

作者：謝小育  
Email：Lucien127@proton.me  
LINE：vbn920

---

本專案採用開源協議 (AGPL-3.0)，用於台灣法律研究與教育用途。
