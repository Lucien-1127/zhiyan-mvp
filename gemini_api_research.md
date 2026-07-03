# Google Gemini API 研究報告

> 研究日期：2026-07-03
> 資料來源：https://ai.google.dev/gemini-api/docs 及其子頁面

---

## 1. API 端點格式

### 主要端點

| 用途 | 端點 |
|------|------|
| **REST API (v1)** | `https://generativelanguage.googleapis.com/v1/` |
| **REST API (v1beta)** | `https://generativelanguage.googleapis.com/v1beta/` |
| **OpenAI 相容** | `https://generativelanguage.googleapis.com/v1beta/openai/` |
| **Interactions API (GA)** | `https://generativelanguage.googleapis.com/v1/interactions` |

### API 版本差異

- **v1** — 穩定版。功能經過充分測試，非破壞性變更可在不升級主版本的情況下引入。
- **v1beta** — 預覽版。包含正在積極開發的早期功能，可能發生變更。GenAI SDK 預設使用 v1beta。

### 認證方式

```
x-goog-api-key: YOUR_API_KEY
```

所有請求必須在 header 中包含 `x-goog-api-key`。

### 主要 REST 端點

| 方法 | 端點 | 說明 |
|------|------|------|
| POST | `/v1/{model}:generateContent` | 生成內容（文字/多模態） |
| POST | `/v1/{model}:streamGenerateContent` | 流式生成 |
| POST | `/v1/{model}:countTokens` | 計數 token |
| POST | `/v1/{model}:embedContent` | 生成單條嵌入向量 |
| POST | `/v1/{model}:batchEmbedContents` | 批次嵌入 |
| POST | `/v1/interactions` | Interactions API（聊天/多輪） |
| GET/POST | `/v1/files/*` | 檔案上傳/管理 |
| POST | `/v1/batches` | 批次 API |
| POST | `/v1/cachedContent` | 內容快取 |
| WebSocket | `wss://generativelanguage.googleapis.com/v1beta/apps/{app}:stream` | Live API |

### OpenAI 相容端點

| 方法 | 端點 | 說明 |
|------|------|------|
| POST | `/v1beta/openai/chat/completions` | 聊天補完 |
| POST | `/v1beta/openai/embeddings` | 嵌入 |
| POST | `/v1beta/openai/images/generations` | 圖片生成 |
| POST | `/v1beta/openai/videos` | 影片生成 |
| GET | `/v1beta/openai/videos/{id}` | 查詢影片狀態 |
| POST | `/v1beta/openai/batches` | 批次 API |
| GET | `/v1beta/openai/models` | 列出模型 |

---

## 2. 免費 Tier RPM/RPD 限制

### 用量層級（Usage Tiers）

| 層級 | 資格 | 帳單上限 | 支出限額（每 10 分鐘） |
|------|------|----------|----------------------|
| **Free** | 活躍專案或免費試用 | N/A | N/A |
| **Tier 1** | 設定並連結活躍帳單帳戶 | $250 | $10 |
| **Tier 2** | 已付費 $100 + 首次付款後 3 天 | $2,000 | $200 |
| **Tier 3** | 已付費 $1,000 + 首次付款後 30 天 | $20,000 - $100,000+ | 更高 |

### 速率限制機制

- **RPM**（Requests Per Minute）— 每分鐘請求數
- **TPM**（Tokens Per Minute）— 每分鐘 token 數
- **RPD**（Requests Per Day）— 每日請求數
- **TPD**（Tokens Per Day）— 每日 token 數
- **IPM**（Images Per Minute）— 僅適用於圖片生成模型
- 限制以 **專案** 為單位套用，而非 API Key
- RPD 配額於太平洋時間午夜重置
- 超過任何限制會觸發 429 RESOURCE_EXHAUSTED 錯誤
- 支出限制以滾動 10 分鐘視窗評估
- 實際容量可能因模型和層級而異，官方不保證特定數值

### 優先推理（Priority Inference）

- 有獨立的速率限制
- 預設限額：標準限額的 0.3 倍
- 透過 `service_tier="priority"` 啟用

### 批次 API

- 有自己的獨立速率限制，與非批次呼叫分開

### 如何升級層級

1. 在 AI Studio 設定帳單 → Free 升 Tier 1（通常立即生效）
2. Tier 1 → Tier 2：總支出達 $100 + 3 天（約 10 分鐘內生效）
3. Tier 2 → Tier 3：總支出達 $1,000 + 30 天
4. 也可申請速率限制提升

---

## 3. 可用模型清單

### 穩定版（Stable）

| 模型 | 類型 | 特色 |
|------|------|------|
| **gemini-3.5-flash** | 文字/多模態 | 當前推薦的主流模型 |
| **gemini-3.1-flash-lite** | 文字/多模態 | 高效能、低延遲 |
| **nano-banana-2** | 圖片生成 | Stable 版圖片生成 |
| **nano-banana-lite** | 圖片生成 | 輕量圖片生成 |
| **nano-banana-pro** | 圖片生成 | 進階圖片生成 |

### 預覽版（Preview）

| 模型 | 類型 | 特色 |
|------|------|------|
| **gemini-3.1-pro-preview** | 文字/多模態 | 高階推理能力 |
| **gemini-3-flash** | 文字/多模態 | 新一代閃電模型 |
| **gemini-3.5-live-translate** | 即時翻譯 | Live API 翻譯 |
| **gemini-3.1-flash-live** | 即時 | Live API 支援 |
| **gemini-3.1-flash-tts** | 語音合成 | 文字轉語音 |
| **gemini-omni-flash-preview** | 多模態 | 全功能閃電模型 |
| **gemini-2.5-flash** | 文字/多模態 | 推理增強 |
| **gemini-2.5-flash-preview** | 文字/多模態 | 預覽版 |
| **gemini-2.5-flash-tts-preview** | 語音合成 | TTS 預覽 |
| **gemini-2.5-flash-live-preview** | 即時 | Live API 預覽 |
| **gemini-2.5-flash-lite** | 文字/多模態 | 輕量高效 |
| **gemini-2.5-flash-lite-preview** | 文字/多模態 | 預覽版 |
| **gemini-2.5-pro** | 文字/多模態 | 高階推理 |
| **gemini-2.5-pro-tts-preview** | 語音合成 | TTS 預覽 |
| **nano-banana** | 圖片生成 | 基礎圖片生成 |
| **veo-3.1-generate-preview** | 影片生成 | Sora 相容影片生成 |
| **veo-3.1-lite-preview** | 影片生成 | 輕量影片生成 |
| **gemini-3-pro-image-preview** | 圖片生成 | 高階圖片生成 |

### 音訊模型

| 模型 | 類型 |
|------|------|
| **lyria-3-pro-preview** | 音樂生成 |
| **lyria-3-clip-preview** | 音樂生成 |
| **lyria-realtime-experimental** | 即時音樂 |

### 工具與 Agent 模型

| 模型 | 類型 |
|------|------|
| **computer-use-preview** | 電腦控制 |
| **gemini-deep-research-preview** | 深度研究 |
| **gemini-deep-research-max-preview** | 深度研究 Max |
| **antigravity-agent-preview** | 代理 Agent |

### 嵌入模型

| 模型 | 類型 |
|------|------|
| **gemini-embedding-2-preview** | 多模態嵌入 |
| **gemini-embedding-001** | 純文字嵌入 |
| **gemini-robotics-er-1.6-preview** | 機器人專用 |

### 已停用模型（Previous models）

- gemini-2.0-flash — 已停用
- gemini-2.0-flash-lite — 已停用
- gemini-3.1-flash-lite-preview — 已停用
- gemini-3-pro-preview — 已停用

### 模型版本命名規則

| 後綴 | 含義 |
|------|------|
| 無後綴 | 穩定版 |
| `-preview` | 預覽版 |
| 最新編號 | 最新版 |
| `-experimental` | 實驗版 |

---

## 4. API Key 取得方式

### 步驟

1. 前往 **[Google AI Studio](https://aistudio.google.com)**
2. 登入 Google 帳戶
3. 點擊「Get API key」按鈕
4. 按幾下即可完成建立
5. 或在 **[AI Studio API Key 頁面](https://aistudio.google.com/apikey)** 直接取得

### 注意事項

- API Key 綁定到專案（Project），而非個人帳戶
- 免費層級即可使用，無需信用卡
- 需要設定帳單才能升級到付費層級
- Key 應通過 `x-goog-api-key` header 傳遞，不應暴露在客戶端程式碼中

---

## 5. 已知限制

### 通用限制

1. **速率限制** — 依模型、層級不同而異；超出會返回 429 錯誤
2. **支出限制** — 防止意外費用，以滾動 10 分鐘視窗評估
3. **實驗/預覽模型** — 速率限制更嚴格
4. **OpenAI 相容層** — 仍處於 Beta 階段，部分 Gemini 特有功能需透過 `extra_body` 傳遞
5. **批次 API** — 上傳/下載相容性尚未支援 OpenAI 格式，需使用 genai SDK

### OpenAI 相容性限制

1. 僅支援 Python 和 TypeScript/JavaScript SDK
2. 部分 Gemini 特有功能（如 thinking config、cached content）需使用 `extra_body` 嵌套
3. 影片生成是異步操作，需輪詢狀態
4. 音訊檔案過大時 curl 可能遇到 "Argument list too long" 錯誤

### 推理限制

1. Gemini 2.5 Pro 和 Gemini 3 系列無法關閉思考功能
2. `reasoning_effort` 和 `thinking_level/thinking_budget` 不可同時使用

### 其他

1. 速率限制數字不保證，實際容量可能變動
2. 某些地區可能受限（Available regions 需查閱）
3. 需要遵守安全設定（Safety settings）和使用政策

---

## 6. Best Practices

### 效能優化

1. **Context Caching** — 使用快取內容減少重複 token 計費
2. **Flex / Priority Inference** — 非緊急任務用 flex 降低成本；需要低延遲用 priority
3. **Batch API** — 大批量請求使用批次 API 提高效率
4. **Token Counting** — 事前使用 `countTokens` 估算成本

### 開發實踐

1. **錯誤重試** — 實現指數退避（exponential backoff）處理 429 錯誤
2. **Streaming** — 大量回應使用流式輸出改善體驗
3. **Prompt Engineering** — 遵循官方提示工程指南
4. **Safety Settings** — 適當配置安全設定避免內容攔截

### 認證安全

1. 不要在客戶端代碼中硬編碼 API Key
2. 使用伺服器端代理保護金鑰
3. 定期輪換 API Key
4. 為不同用途建立不同的 API Key

### SDK 使用

1. Python SDK: `google-genai`
2. JavaScript SDK: `@google/genai`
3. 預設使用 v1beta 以獲得最新功能
4. 可透過 `http_options.api_version` 切換到 v1

### 多模態最佳實踐

1. 圖片/影片使用 base64 編碼嵌入（小檔案）或上傳到 Files API
2. 音訊檔案建議使用 WAV 格式
3. 結構化輸出可使用 Pydantic (Python) 或 Zod (JS) 定義 schema

---

## 7. 快速開始範例

### cURL（REST）

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent" \
  -H "x-goog-api-key: YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [{
      "parts": [{"text": "Explain how AI works in a few words"}]
    }]
  }'
```

### Python（OpenAI 相容）

```python
from openai import OpenAI

client = OpenAI(
    api_key="GEMINI_API_KEY",
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

response = client.chat.completions.create(
    model="gemini-3.5-flash",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Explain to me how AI works"}
    ]
)
print(response.choices[0].message.content)
```

### Python（原生 GenAI SDK）

```python
from google import genai

client = genai.Client(api_key="GEMINI_API_KEY")
response = client.models.generate_content(
    model="gemini-3.5-flash",
    contents="Explain how AI works"
)
print(response.text)
```

---

## 8. 參考資源

| 資源 | 連結 |
|------|------|
| 官方文檔 | https://ai.google.dev/gemini-api/docs |
| 模型清單 | https://ai.google.dev/gemini-api/docs/models |
| 速率限制 | https://ai.google.dev/gemini-api/docs/rate-limits |
| OpenAI 相容 | https://ai.google.dev/gemini-api/docs/openai |
| API 參考 | https://ai.google.dev/api |
| API 版本說明 | https://ai.google.dev/gemini-api/docs/api-versions |
| API Key 取得 | https://aistudio.google.com/apikey |
| Cookbook | https://github.com/google-gemini/cookbook |
| 開發者論壇 | https://discuss.ai.google.dev/c/gemini-api/ |
| AI Studio | https://aistudio.google.com |
