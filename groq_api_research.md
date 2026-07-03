# Groq API 研究報告

> 研究日期：2026-07-03  
> 來源：https://console.groq.com/docs  

---

## 1. API 端點與認證

### 基礎端點
| 用途 | 端點 |
|------|------|
| Chat Completions | `POST https://api.groq.com/openai/v1/chat/completions` |
| Models List | `GET https://api.groq.com/openai/v1/models` |
| Responses API (beta) | `POST https://api.groq.com/openai/v1/responses` |
| Audio Speech (TTS) | `POST https://api.groq.com/openai/v1/audio/speech` |
| Audio Transcription | `POST https://api.groq.com/openai/v1/audio/transcriptions` |
| Batch API | `POST https://api.groq.com/openai/v1/batch` |

### 認證方式
- **API Key**：在 [console.groq.com](https://console.groq.com/keys) 建立
- 設定環境變數：`export GROQ_API_KEY=<your-api-key>`
- 請求頭：`Authorization: Bearer $GROQ_API_KEY`
- **完全相容 OpenAI SDK**：只需改 `base_url` 為 `https://api.groq.com/openai/v1`

### SDK 支援
- Python SDK：`pip install groq` (v1.2.0)
- TypeScript/JS SDK：`npm install groq-sdk` (v1.1.2)
- 也支援 OpenAI 官方 SDK（改 base_url）

---

## 2. 免費 Tier 限制

### 免費方案可用模型
- `llama-3.1-8b-instant`
- `llama-3.3-70b-versatile`
- `meta-llama/llama-4-scout-17b-16e-instruct`
- `meta-llama/llama-prompt-guard-2-22m`
- `meta-llama/llama-prompt-guard-2-86m`
- `qwen/qwen3-32b`
- `qwen/qwen3.6-27b`
- `whisper-large-v3`
- `whisper-large-v3-turbo`

### 速率限制說明
Groq 以多種維度限制速率：

| 縮寫 | 全稱 | 說明 |
|------|------|------|
| RPM | Requests Per Minute | 每分鐘請求數 |
| RPD | Requests Per Day | 每日請求數 |
| TPM | Tokens Per Minute | 每分鐘 token 數 |
| TPD | Tokens Per Day | 每日 token 數 |
| ASH | Audio Seconds Per Hour | 每秒鐘音訊處理量 |
| ASD | Audio Seconds Per Day | 每日音訊處理量 |
| ITPM | Input Tokens Per Minute | 輸入 token 每分鐘限制 |
| OTPM | Output Tokens Per Minute | 輸出 token 每分鐘限制 |

### 開發者方案限制（Developer Plan — 有付費才有的基準值）
| 模型 | TPM | RPM |
|------|-----|-----|
| Llama 3.1 8B | 250K | 1K |
| Llama 3.3 70B | 300K | 1K |
| GPT OSS 120B | 250K | 1K |
| GPT OSS 20B | 250K | 1K |
| Whisper Large V3 | 200K ASH / 300 RPM | — |
| Whisper Turbo | 400K ASH / 400 RPM | — |
| Compound (系統) | 200K TPM / 200 RPM | — |
| Compound Mini | 200K TPM / 200 RPM | — |
| Qwen3-32B | 300K TPM / 1K RPM | — |
| Qwen3.6-27B | 250K TPM / 1K RPM | — |
| Llama 4 Scout | 300K TPM / 1K RPM | — |
| Prompt Guard 22M | 30K TPM / 100 RPM | — |
| Prompt Guard 86M | 30K TPM / 100 RPM | — |
| GPT OSS Safeguard | 150K TPM / 1K RPM | — |
| Orpheus Arabic | 50K TPM / 250 RPM | — |
| Orpheus V1 English | 50K TPM / 250 RPM | — |

### 免費方案的實際限制
- 免費方案的具體數字未在公開文件列出詳細表格
- 可在 console 的 **Limits 頁面**查看自己組織的實際限制
- 升級到 Developer 方案可提高限制並取得 Batch/Flex 處理能力

### 速率限制回應標頭
```
x-ratelimit-limit-requests    → RPD 上限
x-ratelimit-limit-tokens      → TPM 上限
x-ratelimit-remaining-requests → RPD 剩餘
x-ratelimit-remaining-tokens  → TPM 剩餘
x-ratelimit-reset-requests   → RPD 重置時間
x-ratelimit-reset-tokens     → TPM 重置時間
retry-after                  → 僅在 429 時返回
```

---

## 3. 可用模型

### 生產級模型（Production Models）
| 模型 ID | 供應商 | 價格（輸入/輸出） | 上下文 |
|---------|--------|-------------------|--------|
| `llama-3.1-8b-instant` | Meta | $0.05 / $0.08 | 128K |
| `llama-3.3-70b-versatile` | Meta | $0.59 / $0.79 | 128K |
| `openai/gpt-oss-120b` | OpenAI | $0.15 / $0.60 | 128K |
| `openai/gpt-oss-20b` | OpenAI | $0.075 / $0.30 | 128K |
| `whisper-large-v3` | OpenAI | $0.111/小時 | — |
| `whisper-large-v3-turbo` | OpenAI | $0.04/小時 | — |

### 預覽模型（Preview Models）— 不建議用於生產
| 模型 ID | 說明 |
|---------|------|
| `canopylabs/orpheus-arabic-saudi` | TTS - 阿拉伯語沙烏地 |
| `canopylabs/orpheus-v1-english` | TTS - 英語 |
| `meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 小模型 |
| `meta-llama/llama-prompt-guard-2-22m` | 提示注入檢測 |
| `meta-llama/llama-prompt-guard-2-86m` | 提示注入檢測 |
| `openai/gpt-oss-safeguard-20b` | 安全分類 |
| `qwen/qwen3-32b` | Qwen3 |
| `qwen/qwen3.6-27b` | Qwen3.6 |

### 系統（Systems）
- `groq/compound` — 內建工具整合（網頁搜尋 + 程式碼執行），~450 tps
- `groq/compound-mini` — 輕量版 compound

### 企業專屬模型
- `minimaxai/minimax-m2.5` — MiniMax M2.5
- `qwen/qwen3-vl-32b-instruct` — Qwen3 VL 多模態

---

## 4. 工具呼叫支援（Tool Use）

### 支援程度
- **所有模型都支援 tool calling**
- 推薦使用最新模型獲得最佳效果

### 三種工具使用模式

#### ① Groq 內建工具（最簡單）
- 無需寫工具協調代碼，單次 API 呼叫即可
- 支援：網頁搜尋、程式碼執行、瀏覽網站、Wolfram Alpha
- 適用模型：`groq/compound`, `groq/compound-mini`, `openai/gpt-oss-20b`, `openai/gpt-oss-120b`

#### ② 遠端工具（MCP）
- 透過 Model Context Protocol 連接外部工具
- Groq 伺服器端管理 MCP 伺服器連線
- 支援 GitHub、資料庫、外部 API 等第三方工具

#### ③ 本機工具呼叫（Function Calling）
- 完全控制工具執行邏輯
- 標準 OpenAI 格式 `tools` 參數 + JSON Schema
- 支援平行工具呼叫（parallel tool calling）
- 適用於所有模型

### 工具呼叫格式（標準 OpenAI 格式）
```json
{
  "tools": [{
    "type": "function",
    "function": {
      "name": "get_weather",
      "description": "Get current weather",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {"type": "string"}
        },
        "required": ["location"]
      }
    }
  }]
}
```

---

## 5. 其他重要功能

### Structured Outputs
- **Strict Mode** (`strict: true`)：強制解碼，100% 符合 schema，需所有欄位 required + `additionalProperties: false`
- **Best-effort Mode** (`strict: false`)：嘗試匹配但不保證
- 需要模型支援 strict mode

### Prompt Caching
- 自動啟用，無需修改程式碼
- 快取命中時輸入 token 享 **50% 折扣**
- 快取過期時間：2 小時
- 目前僅支援：`gpt-oss-20b`, `gpt-oss-120b`, `gpt-oss-safeguard-20b`
- **快取 token 不計入速率限制**

### Content Moderation
- `gpt-oss-safeguard-20b`：自訂策略的安全分類
- `llama-prompt-guard-2`：提示注入檢測（22M / 86M）

### Service Tiers
| Tier | 說明 |
|------|------|
| `performance` | 最高優先級，低延遲，企業專屬 |
| `on_demand` | 預設，穩定高速 |
| `flex` | 高吞吐量，可能遇到 498 錯誤，需重試 |
| `auto` | 自動選擇最佳 tier |

### Batch API
- 非同步處理大量請求
- 價格比同步 API **便宜 50%**
- 處理窗口：24 小時 ~ 7 天
- 不影響標準速率限制
- 不支援 `service_tier` 參數
- 不與 prompt caching 折扣疊加

---

## 6. 限制與坑（Gotchas）

### ⚠️ 免費方案限制
- 免費方案的具體 RPM/TPM 限制未公開，需在 console 查看
- 某些功能（Flex、Batch）僅限付費方案
- 免費方案模型較少

### ⚠️ 速率限制
- 限制以 **組織層級** 計算，非個別用戶
- 同時受 RPM、TPM、ITPM、OTPM 等多個維度限制，任何一個達上限都會被擋
- 平行請求時即使 token 總和未超 TPM，也可能因 ITPM/OTPM 被擋
- 免費方案觸發限制後需等待重置或升級

### ⚠️ 模型生命周期
- **Preview 模型可能隨時下架**，不提供提前通知
- 生產模型下架會提供遷移路徑和公告
- 舊模型如 `llama-3.1-8b-instant` 已進入 deprecation 流程

### ⚠️ Responses API
- 目前處於 **beta** 階段
- **不支援 stateful 對話**，需自行維護對話歷史
- 部分功能可能變動

### ⚠️ Structured Outputs
- Strict mode 僅部分模型支援
- 不支援 strict mode 的模型使用時會回傳 400 錯誤
- 所有欄位必須是 required，物件必須設 `additionalProperties: false`

### ⚠️ Prompt Caching
- 僅支援特定模型（GPT-OSS 系列）
- 需要提示結構化優化（靜態內容放前面）才能有效命中
- 不保證快取命中

### ⚠️ Flex Processing
- 容量不足時回傳 **HTTP 498** + `capacity_exceeded` 錯誤
- 必須實現 jittered backoff + retry 機制

### ⚠️ Spend Limits
- 僅限付費方案
- 追蹤延遲 10-15 分鐘，可能小幅超支
- 觸發時所有 API key 都會被封鎖（400 `blocked_api_access`）

### ⚠️ 其他
- 日曆 token 不計入速率限制，但平行大量請求仍可能超限
- Batch API 的 50% 折扣不與 prompt caching 疊加
- 某些高級模型（MiniMax、Qwen3 VL）僅限企業方案

---

## 7. 總結

| 項目 | 評價 |
|------|------|
| API 相容性 | ⭐⭐⭐⭐⭐ 完全 OpenAI 相容，換 base_url 即可 |
| 速度 | ⭐⭐⭐⭐⭐ LPU 硬體加速，極低延遲 |
| 免費方案 | ⭐⭐⭐⭐ 免費但限制不明確 |
| 工具呼叫 | ⭐⭐⭐⭐⭐ 支援良好，三種模式可選 |
| 文件品質 | ⭐⭐⭐⭐ 文件完整但部分頁面動態渲染 |
| 功能豐富度 | ⭐⭐⭐⭐⭐ 內建工具、MCP、Batch、Caching、Structured Outputs |
| 生產成熟度 | ⭐⭐⭐⭐ 部分功能仍 beta |
