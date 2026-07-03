# Mistral AI API 研究報告

## 1. API 端點

### 基礎 URL
```
https://api.mistral.ai/v1/
```

### 主要 API 端點（OpenAPI 3.1.0 規範）

#### 核心聊天 / 補全
| 端點 | 方法 | 說明 |
|------|------|------|
| `/v1/chat/completions` | POST | 聊天補全（主要入口） |
| `/v1/fim/completions` | POST | Fill-in-the-middle 程式碼補全 |
| `/v1/agents/completions` | POST | Agent 補全 |

#### 嵌入 / 分類
| 端點 | 方法 | 說明 |
|------|------|------|
| `/v1/embeddings` | POST | 文字嵌入 |
| `/v1/moderations` | POST | 內容審核 |
| `/v1/classifications` | POST | 分類 |
| `/v1/chat/moderations` | POST | 聊天內容審核 |
| `/v1/chat/classifications` | POST | 聊天分類 |

#### 音訊
| 端點 | 方法 | 說明 |
|------|------|------|
| `/v1/audio/transcriptions` | POST | 語音轉文字 |
| `/v1/audio/speech` | POST | 文字轉語音 (TTS) |
| `/v1/audio/voices` | GET/POST | 語音列表/建立 |

#### 檔案 / OCR
| 端點 | 方法 | 說明 |
|------|------|------|
| `/v1/files` | POST | 檔案上傳 |
| `/v1/ocr` | POST | OCR 文件識別 |

#### 模型管理
| 端點 | 方法 | 說明 |
|------|------|------|
| `/v1/models` | GET | 列出可用模型 |
| `/v1/models/{model_id}` | GET | 取得模型詳情 |

#### Batch / 微調
| 端點 | 方法 | 說明 |
|------|------|------|
| `/v1/batch/jobs` | POST | 批次處理任務 |
| `/v1/batch/jobs/{job_id}` | GET | 查詢批次狀態 |
| `/v1/fine_tuning/jobs` | POST | 微調任務 |

#### Agent / 對話
| 端點 | 方法 | 說明 |
|------|------|------|
| `/v1/agents` | POST | 建立 Agent |
| `/v1/agents/{agent_id}` | GET/PUT/DELETE | Agent 管理 |
| `/v1/conversations` | POST | 建立對話 |

#### RAG / 向量搜尋
| 端點 | 方法 | 說明 |
|------|------|------|
| `/v1/libraries` | POST | 建立 Library（向量資料庫） |
| `/v1/rag/indexes` | POST | RAG 索引 |

#### Workflows
| 端點 | 方法 | 說明 |
|------|------|------|
| `/v1/workflows` | POST | 建立 Workflow |
| `/v1/workflows/executions/{execution_id}` | GET | 執行狀態 |
| `/v1/workflows/runs` | POST | 執行 Run |

#### 觀察性 / 管理
| 端點 | 方法 | 說明 |
|------|------|------|
| `/v1/observability/chat-completion-events/search` | POST | 聊天事件搜尋 |
| `/v1/observability/traces/search` | POST | Trace 搜尋 |
| `/v1/connectors` | POST | Connector 管理 |

---

## 2. 免費 Tier / 定價

### Vibe 產品（個人用戶）
| Plan | 價格 | 說明 |
|------|------|------|
| **Free** | 免費 | 受限訊息數量、受限網路搜尋、受限程式碼會話、影像生成 |
| **Pro** | $14.99/月 | 完整存取、更多訊息和搜尋、全天候程式碼編輯 |
| **Team** | $24.99/使用者/月 | 協作工作區、最多 30GB 儲存 |
| **Education** | $5.99 | 學生優惠（12個月） |

### API 計費模式（按用量付費，無免費額度）
- **按 token 計費**：輸入 / 輸出分別計價
- **Batch 處理**：50% 折扣
- **Leanstral（Labs）**：目前免費（限定期間收集回饋）
- **Enterprise API**：需聯繫銷售團隊，含區域資料控制、SLA、更高速率限制

### 速率限制
- 預設速率限制適用
- Enterprise 方案可獲得更高的速率限制

---

## 3. 可用模型

### 旗艦模型（Frontier）
| 模型 | 版本 | 類型 | 定價 (輸入/輸出) |
|------|------|------|------------------|
| **Mistral Medium 3.5** | 26.04 | Open, 多模態 | $1.5 / $7.5 per M tokens |
| **Mistral Small 4** | 26.03 | Open, 多模態 | $0.15 / $0.6 per M tokens |
| **Mistral Large 3** | 25.12 | Open, 多模態 | $0.5 / $1.5 per M tokens |

### 輕量模型（Lightweight / Edge）
| 模型 | 版本 | 定價 |
|------|------|------|
| **Ministral 3 14B** | 25.12 | $0.2 / $0.2 |
| **Ministral 3 8B** | 25.12 | $0.15 / $0.15 |
| **Ministral 3 3B** | 25.12 | $0.1 / $0.1 |

### 專業模型（Specialist）
| 模型 | 類型 | 定價 |
|------|------|------|
| **Devstral 2** | 程式碼 Agent | $0.4 / $2 |
| **Codestral** | 程式碼補全 | $0.3 / $0.9 |
| **OCR 4** | 文件識別 | $4/1000頁 (Batch: $2) |
| **Voxtral TTS** | 文字轉語音 | $0.016/1k字元 |
| **Voxtral Mini Transcribe** | 語音轉文字 | $0.003/分鐘 |
| **Mistral Embed** | 嵌入模型 | $0.1 per M tokens |
| **Mistral Moderation 2** | 內容審核 | $0.1 per M tokens |

### 其他模型
| 模型 | 定價 |
|------|------|
| **Mixtral 8x22B** | $2 / $6 per M tokens |
| **Mixtral 8x7B** | $0.7 / $0.7 per M tokens |
| **Open Mistral NeMo** | $0.15 / $0.15 per M tokens |
| **Leanstral** (Labs) | 免費 |

### 模型別名
- `mistral-medium-latest` → 最新 Medium 版本
- `mistral-small-latest` → 最新 Small 版本
- `mistral-large-latest` → 最新 Large 版本
- `devstral-medium-latest` → 最新 Devstral 版本

---

## 4. OpenAI 相容性

### ✅ 高度相容
Mistral API 與 OpenAI API **高度相容**，具體表現：

1. **API 結構相同**：
   - 端點路徑格式一致：`/v1/chat/completions`
   - 請求/回應格式幾乎相同
   - 支援 streaming（SSE 事件流）
   - 相同的 `temperature`, `top_p`, `frequency_penalty`, `presence_penalty` 等參數

2. **SDK 相容**：
   - 提供官方 `@mistralai/mistralai` (TypeScript) SDK
   - 提供官方 `mistralai` (Python) SDK
   - Python SDK 使用方式與 OpenAI SDK 幾乎一致：
     ```python
     from mistralai.client import Mistral
     # 與 openai.OpenAI 的使用方式非常相似
     ```

3. **認證方式相同**：
   - Bearer Token：`Authorization: Bearer YOUR_API_KEY`
   - 相同 Header 格式

4. **JSON Mode**：支援 `response_format: { "type": "json_object" }` 和 `json_schema`

5. **Tool Calling**：支援函式呼叫（function calling），包括平行工具呼叫

6. **額外功能**（超出 OpenAI）：
   - `prompt_cache_key`：提示詞快取（降低 90% token 成本）
   - `parallel_tool_calls`：平行工具呼叫
   - `guardrails`：安全护栏
   - `prediction`：預測補全
   - `reasoning_effort`：推理強度控制
   - 內建工具：Web 搜尋、程式碼執行、影像生成、文件庫

### ⚠️ 差異注意事項
- Base URL 不同：`api.mistral.ai` vs `api.openai.com`
- 模型 ID 命名不同（`mistral-small-latest` vs `gpt-4o`）
- 部分進階參數為 Mistral 特有（`prompt_mode`, `reasoning_effort` 等）
- 回應物件中的 `object` 欄位值為 `chat.completion`（與 OpenAI 一致）

---

## 5. 快速開始

### 取得 API Key
前往 [console.mistral.ai](https://console.mistral.ai) 註冊並產生 API Key

### cURL 範例
```bash
curl https://api.mistral.ai/v1/chat/completions \
  -X POST \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "mistral-small-latest",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Python SDK
```python
from mistralai.client import Mistral
import os

client = Mistral(api_key=os.getenv("MISTRAL_API_KEY"))
response = client.chat.complete(
    model="mistral-small-latest",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)
```

### TypeScript SDK
```typescript
import { Mistral } from "@mistralai/mistralai";

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
const result = await mistral.chat.complete({
  model: "mistral-small-latest",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(result);
```

---

## 6. 文件資源

| 資源 | URL |
|------|-----|
| 官方文檔 | https://docs.mistral.ai |
| API 參考 | https://docs.mistral.ai/api |
| OpenAPI Spec | https://docs.mistral.ai/openapi.yaml |
| 模型總覽 | https://docs.mistral.ai/models/overview |
| 定價頁面 | https://mistral.ai/pricing/api |
| Studio 控制台 | https://console.mistral.ai |
| Cookbooks | https://docs.mistral.ai/resources/cookbooks |
