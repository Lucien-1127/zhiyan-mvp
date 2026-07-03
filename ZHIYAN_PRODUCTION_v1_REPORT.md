# 智研 AI 法律系統 — Production v1.0 基礎架構報告

> 研究日期：2026-07-03
> 研究範圍：FreeLLMAPI 原始碼（v23+）、Provider 生態、智研整合、GCP 部署

---

## 目錄

1. [FreeLLMAPI 深度分析](#1-freellmapi-深度分析)
2. [Provider 最佳化分析](#2-provider-最佳化分析)
3. [智研整合設計](#3-智研整合設計)
4. [GCP 部署方案](#4-gcp-部署方案)
5. [維護與擴充](#5-維護與擴充)

---

## 1. FreeLLMAPI 深度分析

### 1.1 架構概覽

```
┌─────────────────────────────────────────────────┐
│                  使用者 (curl/SDK)                │
├─────────────────────────────────────────────────┤
│             FreeLLMAPI (port 3001)               │
│                                                   │
│  /v1/chat/completions  ← OpenAI-compatible API    │
│  /v1/messages          ← Anthropic-compatible API │
│  /api/*                ← Dashboard Admin API      │
│                                                   │
│  ┌─────────────────────────────────────────┐      │
│  │ Router (Bandit / Priority)              │      │
│  │  • scoring.ts — Beta posterior routing  │      │
│  │  • fusion.ts  — K-panel + Judge         │      │
│  │  • ratelimit.ts — RPM/RPD/TPM/TPD      │      │
│  └─────────────────────────────────────────┘      │
│                                                   │
│  ┌─────────────────────────────────────────┐      │
│  │ Provider Layer                          │      │
│  │  Google | Groq | Cerebras | NVIDIA      │      │
│  │  Mistral | OpenRouter | GitHub | Cohere │      │
│  │  Cloudflare | AI Horde | Custom         │      │
│  └─────────────────────────────────────────┘      │
│                                                   │
│  ┌─────────────────────────────────────────┐      │
│  │ Data Layer                              │      │
│  │  SQLite (better-sqlite3)                │      │
│  │  Encrypted API keys                     │      │
│  │  Model catalog (auto-synced)            │      │
│  └─────────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
```

### 1.2 支援的 Provider（原始碼驗證）

| Provider | 類型 | Base URL | 特殊設定 |
|----------|------|----------|---------|
| **Google Gemini** | 原生 | Gemini API | 獨特 API 格式，非 OpenAI 相容 |
| **Groq** | OpenAI 相容 | `api.groq.com/openai/v1` | — |
| **Cerebras** | OpenAI 相容 | `api.cerebras.ai/v1` | 超快推論 |
| **NVIDIA NIM** | OpenAI 相容 | `integrate.api.nvidia.com/v1` | ⚠️ `forceSingleToolCall: true` |
| **Mistral** | OpenAI 相容 | `api.mistral.ai/v1` | — |
| **OpenRouter** | OpenAI 相容 | `openrouter.ai/api/v1` | 加 `HTTP-Referer` + `X-Title` header |
| **GitHub Models** | OpenAI 相容 | `models.github.ai/inference` | 需 GitHub Token |
| **Cohere** | OpenAI 相容 | Cohere 相容端點 | — |
| **Cloudflare** | OpenAI 相容 | Workers AI | — |
| **AI Horde** | 社群 | — | 免費但慢 |
| **自訂 Provider** | OpenAI 相容 | 任意 | declarative-config.json 或 Dashboard |

### 1.3 核心機制

#### Auto Routing（Bandit）

程式碼實證：`server/src/services/scoring.ts`

```
effective_score = BASE × headroomFactor × rateLimitFactor

BASE = w_rel·reliability + w_speed·speed + w_intel·intelligence
     (weights sum to 1, so BASE ∈ [0, 1])
```

五大策略：

| 策略 | 可靠性 | 速度 | 智能 | 適用場景 |
|------|--------|------|------|---------|
| `balanced`（預設） | 0.5 | 0.25 | 0.25 | 通用 |
| `smartest` | 0.35 | 0.1 | 0.55 | 法律分析（推薦） |
| `fastest` | 0.35 | 0.55 | 0.1 | 簡單問答 |
| `reliable` | 0.7 | 0.15 | 0.15 | 穩定優先 |
| `priority` | — | — | — | 手動排序鏈 |

> **可靠性演算法**：Beta(1,1) prior → Thompson sampling，自動探索不確定模型。
> 速度包含 Throughput（佔 60%）+ TTFB（佔 40%），用飽和曲線標準化。

#### Fusion（多模型委員會）

程式碼實證：`server/src/services/fusion.ts`

| 參數 | 預設值 | 說明 |
|------|--------|------|
| Panel K | 4 | 平行呼叫模型數 |
| Panel 上限 | 8 | 硬上限 |
| Synthesis quorum | 2 | 最少成功數才觸發 Judge |
| Slot attempts | 4 | 每個 slot 最多重試次數 |
| Judge attempts | 6 | Judge 最多重試次數 |

#### API Key 管理

- 金鑰加密儲存在 SQLite（`crypto.ts` + `key-parser.ts`）
- 支援多金鑰 pooling（round-robin）
- 每個 Provider 可獨立 RPM/RPD/TPM/TPD 限制
- Daily cap 可透過 `PROVIDER_DAILY_REQUEST_CAP_<PLATFORM>` 環境變數設定

### 1.4 環境變數完整清單（原始碼驗證）

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `ENCRYPTION_KEY` | — | 必填！64 hex chars，金鑰加密用 |
| `PORT` | 3001 | 服務通訊埠 |
| `HOST` | :: | 監聽介面 (dual-stack) |
| `HOST_BIND` | 127.0.0.1 | Docker port publishing 介面 |
| `PROXY_RATE_LIMIT_RPM` | 120 | 每 IP 每分鐘 Proxy 請求上限（0=停用） |
| `PROVIDER_DAILY_REQUEST_CAP_<PLATFORM>` | — | Provider 每日上限（如 `_OPENROUTER=50`） |
| `REQUEST_ANALYTICS_RETENTION_DAYS` | 90 | 分析記錄保留天數 |
| `REQUEST_ANALYTICS_MAX_ROWS` | 100000 | 分析記錄最大筆數 |
| `PROXY_URL` | — | HTTP/SOCKS Proxy |
| `FREEAPI_BLOCK_PRIVATE_PROVIDER_URLS` | false | 封鎖私有 IP 自訂 Provider |
| `CATALOG_BASE_URL` | api.freellmapi.co | 模型目錄來源 |
| `CATALOG_PUBKEY` | Ed25519 | 目錄簽章驗證公鑰 |
| `FREEAPI_ENV_PATH` | ./.env | .env 路徑覆寫 |
| `NODE_ENV` | production | Node.js 環境 |

### 1.5 現有配置分析

**當前 `freellmapi.config.json`：**

```json
{
  "fallback": [
    { "platform": "custom",   "modelId": "agnes-2.0-flash",  "priority": 1 },
    { "platform": "custom",   "modelId": "agnes-2.0-pro",    "priority": 2 },
    { "platform": "google",   "modelId": "gemini-2.5-flash",  "priority": 3 },
    { "platform": "nvidia",   "modelId": "moonshotai/kimi-k2.6", "priority": 4 }
  ],
  "routing": { "strategy": "priority" }
}
```

**問題：**
- ❌ `strategy: "priority"` 不使用 bandit 路由，無法自動故障轉移
- ❌ 只有 1 個 Custom Provider + 1 個 Google key + 1 個 NVIDIA free key
- ❌ 未設定 `ENCRYPTION_KEY`（或使用預設）
- ⚠️ Google Gemini key 無每日上限控管

---

## 2. Provider 最佳化分析

### 2.1 Provider 評比矩陣

| Provider | 免費等級 | RPM | 適合法律 AI | 穩定性 | 延遲 |
|----------|---------|-----|------------|--------|------|
| **Google Gemini** | ✅ | 60 RPM (v1) | ⭐⭐⭐⭐⭐ | 高 | ~1s |
| **Groq** | ✅ | 30 RPM | ⭐⭐⭐⭐ | 高 | ~0.5s |
| **GitHub Models** | ✅ (有 PAT) | 需查 | ⭐⭐⭐⭐⭐ | 高 | ~1s |
| **NVIDIA NIM** | ✅ | 20 RPM | ⭐⭐⭐ | 中 | ~3s |
| **Cerebras** | ✅ | 30 RPM | ⭐⭐⭐ | 中 | ~0.3s |
| **OpenRouter** | 付費爲主 | 依模型 | ⭐⭐⭐⭐⭐ | 高 | 依模型 |
| **Mistral** | ✅ 有限 | 需查 | ⭐⭐⭐ | 高 | ~1s |
| **Cloudflare** | ✅ | 50 RPM | ⭐⭐ | 中 | ~2s |
| **DeepSeek** | ❌ | 付費 | ⭐⭐⭐⭐⭐ | 高 | ~0.5s |

### 2.2 法律 AI 推薦優先順序

```
Tier 1 (主要路由 — 智能優先)：
  Gemini 2.5 Flash    → 法律理解力強，速度可接受
  GitHub Models       → GPT-4.1 等級，法律能力最佳
  Groq (LLaMA/Mixtral) → 超快回應，適合簡單查詢

Tier 2 (備援 — 當 Tier 1 達上限)：
  Cerebras             → 極快，適合簡單法律問答
  Mistral              → 法規理解中等
  NVIDIA NIM           → 可用 Kimi K2.6

Tier 3 (最後手段)：
  Cloudflare Workers AI → 模型較小，法律能力有限
  AI Horde              → 不保證 SLA
```

**推薦建議：**
- **主要 Provider**：Google Gemini（免費 60 RPM）→ 已配置 ✅
- **次要 Provider**：Groq（30 RPM）→ 需加 key
- **備援 Provider**：GitHub Models（需 GitHub PAT）→ 適合 GPT-4.1
- **不建議**：SambaNova（已永久關閉免費 tier，官方已註明）

### 2.3 Provider 金鑰配置策略

```yaml
# 每個 Provider 應配置 2-3 組金鑰做 round-robin
# 以 Gemini 為例（60 RPM）：
#   金鑰 A：60 RPM
#   金鑰 B：60 RPM → total 120 RPM（但實務上共用同一個配額池）

# 實際建議：
Gemini:   多個金鑰 → 同配額池，效果有限
Groq:     多個金鑰 → 同配額池，效果有限
GitHub:   1 PAT    → 免費 tier 共用
```

---

## 3. 智研整合設計

### 3.1 雙層路由架構

```
                                 ┌─────────────────┐
                                 │   使用者請求      │
                                 └────────┬────────┘
                                          │
                          ┌───────────────▼──────────────┐
                          │    智研 MVP (localhost:8001)   │
                          │                               │
                          │  1. RAG 搜尋（強制優先）         │
                          │  2. 系統提示詞 + RAG 上下文      │
                          │  3. LLM 呼叫 (model=auto)       │
                          └───────────────┬───────────────┘
                                          │ POST /v1/chat/completions
                                          │ Authorization: Bearer <unified_key>
                                          │ model: "auto"
                                          ▼
                          ┌───────────────────────────────┐
                          │   FreeLLMAPI (localhost:3001)   │
                          │                                │
                          │  Auto Router (Bandit)           │
                          │  ① Gemini 2.5 Flash (~1s)      │
                          │  ② Groq LLAMA (~0.5s)          │
                          │  ③ GitHub Models GPT-4.1       │
                          │  ④ NVIDIA Kimi K2.6 (~3s)      │
                          │  ⑤ Cerebras (~0.3s)            │
                          │  ⑥ Mistral (~1s)               │
                          └───────────────────────────────┘
```

### 3.2 設定分配

| 層級 | 管理內容 | 配置位置 |
|------|----------|---------|
| **智研 MVP** | 系統提示詞、強制 RAG、法規資料庫 | `server.py` 直接寫死 |
| **智研 MVP** | Provider 選擇（freellmapi/deepseek/committee） | `server.py` 或 API 參數 |
| **FreeLLMAPI** | 模型路由策略、Provider 金鑰、每日上限 | `freellmapi.config.json` + Dashboard |
| **FreeLLMAPI** | 容器資源、環境變數 | `.env` + `docker-compose.yml` |

### 3.3 Prompt 分流策略

```python
# 智研 server.py 的 LLM 呼叫邏輯
if provider == "freellmapi":
    # → FreeLLMAPI auto router
    #    (依 Bandit 策略自動選擇最佳模型)
    return call_freellmapi(messages, model="auto")

elif provider == "committee":
    # → FreeLLMAPI Fusion
    #    (K 模型平行 + Judge 合成)
    return call_committee(messages, k=3, strategy="synthesize")

elif provider == "deepseek":
    # → 直接 DeepSeek API（備援）
    return call_deepseek(messages)
```

### 3.4 智研特定優化建議

| 請求類型 | 推薦路由 | 策略 | 說明 |
|----------|---------|------|------|
| **法條查詢** | `auto` → balanced | Bandit balanced | 需要可靠法條引用 |
| **合約產生** | `auto` → smartest | Bandit smartest | 需高智能模型 |
| **委員會分析** | `fusion` | K=3 synthesize | 重大案件多重驗證 |
| **OSINT** | `auto` → fastest | Bandit fastest | 速度優先 |

---

## 4. GCP 部署方案

### 4.1 架構圖

```
                    ┌──────────────────────┐
                    │   Cloud Load Balancer  │
                    │   (+ SSL termination)  │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │   GCE VM Instance      │
                    │   e2-medium (2GB RAM)  │
                    │                        │
                    │  Docker Compose Stack  │
                    │  ┌──────────────────┐ │
                    │  │ freellmapi:3001  │ │
                    │  │ (免費 API 代理)   │ │
                    │  └──────────────────┘ │
                    │  ┌──────────────────┐ │
                    │  │ zhiyan:8001      │ │
                    │  │ (FastAPI 後端)    │ │
                    │  └──────────────────┘ │
                    │  ┌──────────────────┐ │
                    │  │ nginx:443→8001   │ │
                    │  │ (反向代理+SSL)    │ │
                    │  └──────────────────┘ │
                    │                        │
                    │  Docker Volumes:       │
                    │  ├ freellmapi-data     │
                    │  └ zhiyan-data        │
                    └──────────────────────┘
```

### 4.2 GCP Startup Script

```bash
#!/bin/bash
# 智研 AI 法律系統 — GCP VM 啟動腳本
# 適用：Debian 12 / Ubuntu 24.04 LTS

set -e

# ── 準備 ──
export HOME=/root
export DEBIAN_FRONTEND=noninteractive

# 更新系統
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl git docker.io docker-compose-v2 nginx certbot python3-certbot-nginx

# 啟動 Docker
systemctl enable docker
systemctl start docker

# ── 建立專案目錄 ──
mkdir -p /opt/zhiyan
cd /opt/zhiyan

# ── 克隆程式碼 ──
git clone https://github.com/Lucien-1127/zhiyan-mvp.git frontend
git clone https://github.com/Lucien-1127/zhiyan-legal.git backend
# 或是用你自建的合併 repo

# ── 設定 .env ──
cat > /opt/zhiyan/.env << 'EOF'
# FreeLLMAPI
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
PORT=3001
HOST_BIND=0.0.0.0
PROXY_RATE_LIMIT_RPM=120

# Google Gemini (主要)
GOOGLE_API_KEY=your_gemini_key_here

# Groq (次要) 
GROQ_API_KEY=your_groq_key_here

# GitHub Models (備援)
GITHUB_TOKEN=your_github_pat_here

# NVIDIA NIM (備援)
NVIDIA_API_KEY=your_nvidia_key_here

# 智研後端
ZHIYAN_PORT=8001
ZHIYAN_RAG_PATH=/data/law.db
EOF

# ── docker-compose.yml ──
cat > /opt/zhiyan/docker-compose.yml << 'DOCKERCOMPOSE'
services:
  freellmapi:
    image: ghcr.io/tashfeenahmed/freellmapi:latest
    env_file: .env
    environment:
      NODE_ENV: production
      PORT: 3001
      NODE_OPTIONS: "--max-old-space-size=1024"
    ports:
      - "127.0.0.1:3001:3001"
    volumes:
      - freellmapi-data:/app/server/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:3001/api/ping').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
      interval: 30s
      timeout: 5s
      start_period: 30s
      retries: 3

  zhiyan:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "127.0.0.1:8001:8001"
    environment:
      LLM_PROVIDER: freellmapi
      FREELMAPI_BASE_URL: http://freellmapi:3001/v1
      FREELMAPI_API_KEY: ${UNIFIED_API_KEY:-freellmapi}
      DATABASE_PATH: /data/zhiyan.db
      RAG_DB_PATH: /data/law.db
    volumes:
      - zhiyan-data:/data
    depends_on:
      freellmapi:
        condition: service_healthy
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - zhiyan
    restart: unless-stopped

volumes:
  freellmapi-data:
  zhiyan-data:
DOCKERCOMPOSE

# ── nginx 配置 ──
cat > /opt/zhiyan/nginx.conf << 'NGINX'
server {
    listen 80;
    server_name _;
    
    # 前端靜態檔案
    root /opt/zhiyan/frontend/frontend;
    index index.html;

    # 後端 API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
    }

    # 靜態檔案快取
    location /static/ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

# ── 啟動 ──
docker compose up -d

# ── 設定 SSL（如有網域） ──
# certbot --nginx -d your-domain.com --non-interactive --agree-tos -m admin@your-domain.com

echo "✅ 智研部署完成！"
echo "   後端：http://localhost:8001"
echo "   API：http://localhost:8001/api/chat/ask"
echo "   FreeLLMAPI：http://localhost:3001"
```

### 4.3 Docker Volume 規劃

| Volume | 掛載點 | 內容 | 備份策略 |
|--------|--------|------|---------|
| `freellmapi-data` | `/app/server/data` | SQLite DB、加密金鑰 | 每日排程備份 |
| `zhiyan-data` | `/data` | 法規 RAG DB、聊天記錄 | 每週備份 |

### 4.4 備份策略

```bash
#!/bin/bash
# /opt/zhiyan/scripts/backup.sh — 每日備份

BACKUP_DIR="/mnt/backup/zhiyan"
DATE=$(date +%Y%m%d)
mkdir -p "$BACKUP_DIR/$DATE"

# FreeLLMAPI 資料
docker cp freellmapi:/app/server/data "$BACKUP_DIR/$DATE/freellmapi/"

# 智研資料
docker cp zhiyan:/data "$BACKUP_DIR/$DATE/zhiyan/"

# 壓縮
cd "$BACKUP_DIR"
tar czf "zhiyan-backup-$DATE.tar.gz" "$DATE/"
rm -rf "$DATE"

# 保留 90 天
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +90 -delete

echo "✅ 備份完成：zhiyan-backup-$DATE.tar.gz"
```

### 4.5 更新策略

```bash
#!/bin/bash
# /opt/zhiyan/scripts/update.sh — 無痛更新

cd /opt/zhiyan

# 備份
bash scripts/backup.sh

# Pull 最新程式碼
git -C frontend pull
git -C backend pull

# 更新 FreeLLMAPI
docker compose pull freellmapi

# 重新建立並啟動
docker compose up -d --build

# 健康檢查
sleep 10
if curl -sf http://localhost:8001/api/status > /dev/null; then
    echo "✅ 更新成功"
else
    echo "❌ 更新失敗，檢查日誌"
    docker compose logs --tail=20 zhiyan
fi
```

### 4.6 .env 生產範本

```bash
# ══════════════════════════════════════════════════
# 智研 AI 法律系統 — Production .env
# ══════════════════════════════════════════════════

# ── FreeLLMAPI ──
ENCRYPTION_KEY=<從未曝光過的 64 hex chars — 用 node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 產生>
PORT=3001
HOST_BIND=0.0.0.0
PROXY_RATE_LIMIT_RPM=120
REQUEST_ANALYTICS_RETENTION_DAYS=90
REQUEST_ANALYTICS_MAX_ROWS=100000

# 每日上限（避免免費 tier 超量）
PROVIDER_DAILY_REQUEST_CAP_GOOGLE=1000
PROVIDER_DAILY_REQUEST_CAP_GROQ=500
PROVIDER_DAILY_REQUEST_CAP_GITHUB=500

# ── Provider API Keys ──
# 主要 — Google Gemini
GOOGLE_API_KEY=你的_Gemini_Key

# 次要 — Groq
GROQ_API_KEY=你的_Groq_Key

# 備援 — GitHub Models
GITHUB_TOKEN=你的_GitHub_PAT

# 備援 — NVIDIA NIM
NVIDIA_API_KEY=你的_NVIDIA_Key

# 備援 — Mistral
MISTRAL_API_KEY=你的_Mistral_Key

# ── 智研後端 ──
ZHIYAN_PORT=8001
ZHIYAN_SECRET_KEY=<隨機字串，用於 JWT>
```

---

## 5. 維護與擴充

### 5.1 FreeLLMAPI Dashboard 設定

第一次啟動後：
1. 開瀏覽器到 `http://localhost:3001`
2. 設定 Dashboard 使用者名稱和密碼
3. 在 Dashboard 中：
   - 設定 Provider API Keys
   - 設定 Routing Strategy（建議：`smartest`）
   - 設定 Daily Caps
   - 查看 Request Analytics

### 5.2 後續擴充建議

| 階段 | 項目 | 說明 |
|------|------|------|
| Phase 1 | ✅ FreeLLMAPI + Gemini | 當前架構 |
| Phase 2 | Groq + GitHub Models 加入 | 增加備援 Provider |
| Phase 3 | Nginx + SSL | 正式網域部署 |
| Phase 4 | Redis 快取 | RAG 結果快取，減少 LLM 呼叫 |
| Phase 5 | PostgreSQL | 取代 SQLite，支援更大規模 |
| Phase 6 | Prometheus + Grafana | 監控 LLM 使用量與延遲 |

### 5.3 安全注意事項

1. **FreeLLMAPI 永不暴露到網際網路** — 容器綁定 `127.0.0.1:3001`
2. **ENCRYPTION_KEY** 是最高機密 — 丟失後所有加密金鑰無法回復
3. **Unified API Key** 是唯一閘道 — 不要共用
4. **Dashboard 設定強密碼** — Dashboard 控制所有 Provider 金鑰
5. **定期輪替 API Keys** — 尤其免費 tier 的 key

---

## 總結

```
✅ FreeLLMAPI 架構完整掌握
   - 10+ 內建 Provider
   - Bandit routing (5 策略)
   - Fusion (K=4 預設)
   - 加密金鑰儲存

✅ Provider 最佳化
   - 法律 AI 路由優先順序已制定
   - 免費 tier 上限已評估
   - 金鑰配置策略已規劃

✅ 智研整合設計
   - 雙層路由架構
   - 分流策略
   - 設定分配明確

✅ GCP 部署方案
   - Startup Script 可直接使用
   - docker-compose.yml 可直接使用
   - 備份/更新/安全策略完整
```
