# NVIDIA NIM API 研究報告

## 1. API 端點

| 項目 | 值 |
|------|-----|
| **Base URL** | `https://integrate.api.nvidia.com/v1` |
| **Chat Completions** | `POST https://integrate.api.nvidia.com/v1/chat/completions` |
| **認證方式** | Bearer Token (`Authorization: Bearer <API_KEY>`) |
| **API Key 取得** | https://build.nvidia.com/settings |
| **OpenAI 相容性** | 完全相容 OpenAI Chat Completions API |
| **官方文件** | https://docs.api.nvidia.com |
| **模型目錄** | https://build.nvidia.com/models |

### 請求範例
```bash
curl https://integrate.api.nvidia.com/v1/chat/completions \
  -H "Authorization: Bearer $NVIDIA_API_KEY" \
  -d '{"model":"moonshotai/kimi-k2.6","messages":[{"role":"user","content":"Hello"}],"max_tokens":16384}'
```

---

## 2. 免費 Tier 限制

### 整體政策
- **所有模型均提供免費試用層**，無需信用卡即可使用
- 登入 build.nvidia.com 即可產生 API Key
- 受 [NVIDIA API Trial Terms of Service](https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf) 規範
- 商業使用受 [NVIDIA Open Model Agreement](https://www.nvidia.com/en-us/agreements/enterprise-software/nvidia-open-model-agreement/) 規範

### 具體限制
- **未公開明確的 RPM/TPM 限額** — 官方文檔未公布具體的免費 tier rate limit 數字
- 實際使用中會遇到 rate limiting（頁面中有 69 次提及 "rate"、16 次 "limit"）
- 付費企業方案有更高限額
- 免費端點標示為 "Free Endpoint: Available"

---

## 3. 可用模型（主要 LLM）

### 大型語言模型（文本生成）
| 模型 | 發布商 | 說明 |
|------|--------|------|
| **moonshotai/kimi-k2.6** | Moonshot AI | 1T MoE (32B active)，多模態，256K 上下文 |
| **deepseek-ai/deepseek-v4-flash** | DeepSeek | 284B MoE，1M 上下文 |
| **deepseek-ai/deepseek-v4-pro** | DeepSeek | 1M 上下文，MoE 架構 |
| **meta/llama-3.1-70b-instruct** | Meta | 經典 70B LLM |
| **meta/llama-3.1-8b-instruct** | Meta | 輕量 8B LLM |
| **meta/llama-3.3-70b-instruct** | Meta | 進階推理、數學、函數呼叫 |
| **meta/llama-4-maverick-17b-128e-instruct** | Meta | 17B 參數 128 MoE 多模態 |
| **qwen/qwen3-235b-a22b** | Alibaba | 235B MoE |
| **qwen/qwen3-coder-480b-a35b-instruct** | Alibaba | 480B 程式碼專項 |
| **qwen/qwen3.5-397b-a17b** | Alibaba | 400B MoE VLM |
| **qwen/qwen3.5-122b-a10b** | Alibaba | 122B MoE (10B active) |
| **qwen/qwen3-next-80b-a3b-thinking** | Alibaba | 超長上下文推理 |
| **qwen/qwen3-next-80b-a3b-instruct** | Alibaba | 超長上下文 AI |
| **mistralai/mistral-large-3-675b-instruct-2512** | Mistral | 675B MoE VLM |
| **mistralai/mistral-medium-3.5-128b** | Mistral | 128B 高性能 |
| **mistralai/mistral-small-4-119b-2603** | Mistral | 119B 混合 MoE，256K 上下文 |
| **minimax-ai/minimax-m2.7** | MiniMax | 230B 文本模型 |
| **minimax-ai/minimax-m3** | MiniMax | 多模態 MoE VLM |
| **google/gemma-4-31b-it** | Google | 31B 密集模型 |
| **google/gemma-3n-e4b-it** | Google | 邊緣運算模型 |
| **google/gemma-3n-e2b-it** | Google | 資源受限環境 |
| **01-ai/yi-lightning** | 01.AI | 大型語言模型 |
| **stepfun-ai/step-3.5-flash** | StepFun | 200B 稀疏 MoE |
| **stepfun-ai/step-3.7-flash** | StepFun | 稀疏 MoE 多模態 |
| **openai/gpt-oss-120b** | OpenAI | 80GB GPU 內的 MoE |
| **openai/gpt-oss-20b** | OpenAI | 小型 MoE |
| **bigscience/bloom** | BigScience | 多語言模型 |
| **aisingapore/sea-lion** | Singapore | SEA 地區優化 |
| **ibm/granite-33-8b-instruct** | IBM | 企業級 8B |
| **microsoft/phi-4-multimodal-instruct** | Microsoft | 多模態 |
| **microsoft/phi-4-mini-instruct** | Microsoft | 輕量多語言 |
| **THUDM/glm-5.2** | Zhipu AI | 旗艦 LLM |

### 多模態模型（Kimi K2.6 詳細資訊）
| 屬性 | 值 |
|------|-----|
| 總參數 | 1 Trillion (1T) |
| 活躍參數 | 32B |
| 架構 | MoE (384 experts, 每 token 選 8) |
| 上下文長度 | 256K tokens |
| 輸入類型 | 文字、圖片 (JPEG/PNG/WebP)、影片 (MP4/MOV/WebM) |
| 視覺編碼器 | MoonViT (400M) |
| Function Calling | ✅ 支援 |
| Structured Output | ❌ 不支援 |
| Reasoning | ❌ 不支援（頁面上標示 Not supported） |
| 最大輸出 tokens | 16,384（可設至 65,536） |
| 溫度範圍 | 0 ~ 1.0 |
| Top-p | 0 ~ 1.0 |
| 播放園限制 | 圖片最多 5 張，影片最多 1 部 |

### 其他類型模型
- **圖像生成**: FLUX.1-dev, FLUX.1-schnell, FLUX.2-klein-4b, Stable Diffusion 3.5 Large
- **嵌入模型**: NV-Embed-v1, NV-EmbedCode-7B-v1, Llama-Nemotron-Embed-1B-v2
- **Reranking**: NV-RerankQA-Mistral-4B, Llama-Nemotron-Rerank-1B-v2
- **OCR**: Nemoretriever-OCR, Nemotron-OCR v1/v2, PaddleOCR
- **ASR/TTS**: Canary-1B-ASR, Magpie-TTS, Nemotron-ASR-Streaming
- **安全**: Llama-3.1-Nemoguard, Nemotron-3-Content-Safety, Llama-Guard-4-12B

---

## 4. API 參數（OpenAI 相容）

### 支援的請求參數
| 參數 | 型別 | 預設值 | 說明 |
|------|------|--------|------|
| `model` | string | 必填 | 模型名稱，如 `"moonshotai/kimi-k2.6"` |
| `messages` | array | 必填 | 對話訊息列表 |
| `max_tokens` / `max_completion_tokens` | integer | 16384 | 最大輸出 tokens (1~65536) |
| `temperature` | number | 1.0 | 採樣溫度 (0~1) |
| `top_p` | number | 1.0 | Nucleus sampling (0~1) |
| `stream` | boolean | false | 是否使用 SSE 串流 |
| `stream_options` | object | null | OpenAI 相容串流選項（如 `include_usage`） |
| `seed` | integer | 0 | 隨機種子 (±9007199254740991) |
| `tools` | array | null | 函數定義列表 |
| `tool_choice` | string/object | null | 工具選擇 |
| `chat_template_kwargs` | object | null | 聊天模板參數（如 `{"thinking": true}`） |

### `tool_choice` 選項
- `"none"` — 不呼叫函數
- `"auto"` — 自動決定（預設）
- `"required"` — 必須呼叫函數
- 或指定 NamedToolChoice 物件：`{"type": "function", "function": {"name": "func_name"}}`

### ⚠️ forceSingleToolCall 限制
**NVIDIA NIM API 不支援 `force_single_tool_call` 或 `forceSingleToolCall` 參數。**
- 此參數是 Anthropic API 特有的
- NVIDIA NIM 僅支援 OpenAI 標準的 `tool_choice` 參數
- 可用的 tool_choice 選項只有: `"none"`, `"auto"`, `"required"`
- 無法強制指定「某個特定函數」以外的更多細粒度控制

---

## 5. 已知問題與注意事項

### Kimi K2.6 特別注意
1. **即將停用**: 該模型的免費 API 端點將於 **2026/07/07** 停用，之後不再支援
2. 建議轉移至其他模型或使用 NGC 自託管
3. 頁面上顯示警告橫幅："This API will be deprecated on 07/07/2026"

### 模型能力限制
1. **Kimi K2.6 不支援**: Structured Output、Reasoning（根據頁面上標示）
2. 播放園中圖片和影片功能互斥（啟用圖片則停用影片，反之亦然）
3. LangChain 目前支援圖片輸入但不支援影片輸入

### 通用限制
1. 免費 tier 的具體 rate limit 數字未公開
2. 某些模型需要接受許可協議才能使用
3. 部分模型僅在特定區域可用
4. 需要 NVIDIA 帳戶和 API Key 才能使用
5. 所有模型都運行在 NVIDIA GPU 上（Blackwell/Hopper 架構）

### 技術細節
1. 最大 max_tokens 為 65,536
2. 支援 SSE 串流回應
3. 錯誤回應格式: `{"object":"error","message":"...","type":"...","param":"...","code":422}`
4. 函數呼叫結果可能返回 202 狀態碼，需輪詢 `/status/{requestId}` 獲取結果

---

## 6. 参考連結

| 項目 | URL |
|------|-----|
| API 目錄 | https://build.nvidia.com/models |
| 純文本模型列表 | https://build.nvidia.com/models.md |
| 官方 API 文件 | https://docs.api.nvidia.com |
| Kimi K2.6 頁面 | https://build.nvidia.com/moonshotai/kimi-k2.6 |
| Kimi K2.6 API 參考 | https://docs.api.nvidia.com/nim/reference/moonshotai-kimi-k2-6 |
| API 試用條款 | https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf |
| 開放模型協議 | https://www.nvidia.com/en-us/agreements/enterprise-software/nvidia-open-model-agreement/ |
| 取得 API Key | https://build.nvidia.com/settings |
| NGC 容器目錄 | https://catalog.ngc.nvidia.com/orgs/nim/teams |
