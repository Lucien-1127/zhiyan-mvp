# OpenRouter API 研究報告

## 1. API 端點

### 主要端點
- **Base URL**: `https://openrouter.ai/api/v1`
- **Chat Completions**: `POST /api/v1/chat/completions`
- **Models List**: `GET /api/v1/models`
- **Embeddings**: `POST /api/v1/embeddings`
- **Audio Speech**: `POST /api/v1/audio/speech`
- **Audio Transcription**: `POST /api/v1/audio/transcriptions`
- **Responses API (Beta)**: `POST /api/v1/responses`

### 認證方式
- 使用 Bearer Token 進行認證
- Header: `Authorization: Bearer YOUR_API_KEY`

### 回應標頭
- `X-Request-Id`: 請求識別碼
- `X-Generation-Id`: 生成識別碼
- `X-Token-Cost`: 使用的 token 數量
- `Retry-After`: 當遇到速率限制時的等待時間

## 2. 免費模型

OpenRouter 提供 **26 個免費模型**，包括：

### 主要免費模型
- `openrouter/free` - OpenRouter 綜合免費模型
- `poolside/laguna-xs-2.1:free` - 262K 上下文
- `cohere/north-mini-code:free` - 256K 上下文
- `nvidia/nemotron-3-ultra-550b-a55b:free` - 1M 上下文
- `nvidia/nemotron-3-super-120b-a12b:free`
- `nvidia/nemotron-3-nano-30b-a3b-reasoning:free`
- `nvidia/nemotron-3-nano-30b-a3b:free`
- `nvidia/nemotron-nano-12b-v2-vl:free`
- `nvidia/nemotron-nano-9b-v2:free`
- `nvidia/nemotron-3.5-content-safety:free`
- `google/gemma-4-26b-a4b-it:free`
- `google/gemma-4-31b-it:free`
- `liquid/lfm-2.5-1.2b-thinking:free`
- `liquid/lfm-2.5-1.2b-instruct:free`
- `qwen/qwen3-next-80b-a3b-instruct:free`
- `qwen/qwen3-coder:free`
- `openai/gpt-oss-120b:free`
- `openai/gpt-oss-20b:free`
- `cognitivecomputations/dolphin-mistral-24b-venice-edition:free`
- `meta-llama/llama-3.3-70b-instruct:free`
- `meta-llama/llama-3.2-3b-instruct:free`
- `nousresearch/hermes-3-llama-3.1-405b:free`

### 特殊免費模型
- `google/lyria-3-pro-preview` - Google Lyria 3 Pro 預覽版
- `google/lyria-3-clip-preview` - Google Lyria 3 Clip 預覽版

## 3. 收費模型費率

OpenRouter 提供 **310 個付費模型**，費率範例：

### 頂級模型
- `anthropic/claude-sonnet-5`: prompt=$0.000002/token, completion=$0.00001/token
- `anthropic/claude-opus-4.8`: prompt=$0.000005/token, completion=$0.000025/token
- `anthropic/claude-opus-4.8-fast`: prompt=$0.00001/token, completion=$0.00005/token
- `anthropic/claude-opus-4.7-fast`: prompt=$0.00003/token, completion=$0.00015/token
- `~anthropic/claude-fable-latest`: prompt=$0.00001/token, completion=$0.00005/token

### Google 模型
- `google/gemini-3.5-flash`: prompt=$0.0000015/token, completion=$0.000009/token
- `google/gemini-3.1-flash-lite`: prompt=$0.00000025/token, completion=$0.0000015/token
- `google/gemini-3.1-flash-lite-image`: prompt=$0.00000025/token, completion=$0.0000015/token
- `google/gemini-3.1-flash-image`: prompt=$0.0000005/token, completion=$0.000003/token
- `google/gemini-3-pro-image`: prompt=$0.000002/token, completion=$0.000012/token

### OpenAI 模型
- `openai/gpt-chat-latest`: prompt=$0.000005/token, completion=$0.00003/token
- `openai/gpt-5.5-pro`: prompt=$0.00003/token, completion=$0.00018/token
- `openai/gpt-5.5`: prompt=$0.000005/token, completion=$0.00003/token

### 其他熱門模型
- `qwen/qwen3.7-plus`: prompt=$0.00000032/token, completion=$0.00000128/token
- `qwen/qwen3.7-max`: prompt=$0.00000125/token, completion=$0.00000375/token
- `z-ai/glm-5.2`: prompt=$0.00000093/token, completion=$0.000003/token
- `x-ai/grok-4.3`: prompt=$0.00000125/token, completion=$0.0000025/token
- `minimax/minimax-m3`: prompt=$0.0000003/token, completion=$0.0000012/token
- `stepfun/step-3.7-flash`: prompt=$0.0000002/token, completion=$0.00000115/token

## 4. Rate Limit

根據 OpenRouter 官方文檔，API 速率限制包括：

- **一般 API 呼叫**: 基於信用額度和帳戶層級的限製
- **Benchmarks API**: 每分鐘 30 次請求，每天 500 次請求
- **Classifications API**: 每分鐘 30 次請求，每天 500 次請求
- **錯誤代碼**: 
  - 429 Too Many Requests - 超過速率限制
  - 5xx - 伺服器錯誤

## 5. 與 FreeLLMAPI 的整合方式

OpenRouter 作為一個模型路由平台，可以作為 FreeLLMAPI 的後端服務：

### 整合方式
1. **API 相容性**: OpenRouter 的 API 端點與 OpenAI 的 Chat Completions API 相容
2. **模型路由**: 可以根據需求自動路由到不同的模型提供者
3. **免費模型支援**: 提供 26 個免費模型可用於低成本或免費的 AI 服務
4. **認證機制**: 使用 Bearer Token 進行簡單的身份驗證

### 優勢
- 單一 API 端點可訪問數百個模型
- 透明的計費系統
- 支援流式回應
- 提供詳細的使用統計和日誌

## 6. 總結

OpenRouter 是一個強大的 AI 模型路由平台，提供：
- 340+ 個模型選擇
- 26 個免費模型
- 與 OpenAI API 相容的介面
- 透明的計費系統
- 完善的速率限制機制

對於需要多模型支援或成本效益的應用來說，是一個優秀的選擇。
