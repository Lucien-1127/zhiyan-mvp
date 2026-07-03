# GitHub Models API 研究報告

> 研究日期: 2026-07-03
> 資料來源: https://docs.github.com/en/github-models

---

## 1. API 端點與認證

### 端點
- **Chat Completions**: `https://models.github.ai/inference/chat/completions`
- **REST API Base**: 遵循 OpenAI-compatible 格式
- **API Version Header**: `X-GitHub-Api-Version: 2022-11-28`
- **Accept Header**: `application/vnd.github+json`

### 認證方式
- 需要 **GitHub Personal Access Token (PAT)**
- Token 需要 `models` scope（或細粒度的 `models:read` 權限）
- 認證方式: `Authorization: Bearer <TOKEN>`
- Playground 無需額外設定，登入 GitHub 即可使用

### cURL 範例
```bash
curl -L \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_GITHUB_PAT" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -H "Content-Type: application/json" \
  https://models.github.ai/inference/chat/completions \
  -d '{"model":"openai/gpt-4.1","messages":[{"role":"user","content":"What is the capital of France?"}]}'
```

### GitHub Actions 整合
- Workflow 需設定 `permissions: models: read`
- 使用內建 `GITHUB_TOKEN` 自動認證
- 不需額外設定 API Key

---

## 2. 可用模型列表

| 模型 | 輸入倍率 | 快取輸入倍率 | 輸出倍率 | 輸入價格 (每百萬 token) | 輸出價格 (每百萬 token) |
|------|---------|-------------|---------|----------------------|----------------------|
| **OpenAI GPT-4o** | 0.25 | 0.125 | 1.0 | $2.50 | $10.00 |
| **OpenAI GPT-4o mini** | 0.015 | 0.0075 | 0.06 | $0.15 | $0.60 |
| **OpenAI GPT-4.1-mini** | 0.04 | 0.01 | 0.16 | $0.40 | $1.60 |
| **OpenAI GPT-4.1** | 0.2 | 0.05 | 0.8 | $2.00 | $8.00 |
| **Phi-4** | 0.0125 | N/A | 0.05 | $0.13 | $0.50 |
| **Phi-4-mini-instruct** | 0.0075 | N/A | 0.03 | $0.08 | $0.30 |
| **Phi-4-multimodal-instruct** | 0.008 | N/A | 0.032 | $0.08 | $0.32 |
| **DeepSeek-R1** | 0.135 | N/A | 0.54 | $1.35 | $5.40 |
| **DeepSeek-R1-0528** | 0.135 | N/A | 0.54 | $1.35 | $5.40 |
| **DeepSeek-V3-0324** | 0.114 | N/A | 0.456 | $1.14 | $4.56 |
| **MAI-DS-R1** | 0.135 | N/A | 0.54 | $1.35 | $5.40 |
| **Grok 3 Mini** | 0.025 | N/A | 0.127 | $0.25 | $1.27 |
| **Grok 3** | 0.3 | N/A | 1.5 | $3.00 | $15.00 |
| **Llama 4 Maverick 17B** | 0.025 | N/A | 0.1 | $0.25 | $1.00 |
| **Llama-3.3-70B-Instruct** | 0.071 | N/A | 0.071 | $0.71 | $0.71 |

### 模型供應商
- **OpenAI**: GPT-4o, GPT-4o mini, GPT-4.1, GPT-4.1-mini
- **Microsoft/Anthropic**: Phi-4 系列
- **DeepSeek**: R1, R1-0528, V3-0324
- **xAI**: Grok 3, Grok 3 Mini
- **Meta**: Llama 4 Maverick, Llama-3.3-70B

### 特殊模型限制
- **Azure OpenAI o1-preview / o1 / o3 / gpt-5**: 僅限 Copilot Pro/Business/Enterprise
- **DeepSeek-R1 系列**: 免費 tier 僅 1 RPM, 8 RPD, 1 concurrent
- **xAI Grok-3**: 免費 tier 僅 1 RPM, 15 RPD

---

## 3. 免費 Tier 限制

### 適用條件
- **所有 GitHub 帳號**（含免費帳號）皆可使用
- 無需綁定付款方式
- Playground 和 API 皆適用

### 限制等級

#### Low 模型（大多數模型）
| 指標 | Copilot Free | Copilot Pro | Copilot Business | Copilot Enterprise |
|-----|-------------|------------|-----------------|-------------------|
| Requests/min | 15 | 15 | 15 | 20 |
| Requests/day | 150 | 150 | 150 | 300 |
| Tokens/request | 8K in / 4K out | 8K in / 4K out | 8K in / 4K out | 8K in / 8K out |
| Concurrent | 5 | 5 | 5 | 8 |

#### High 模型（較昂貴模型）
| 指標 | Copilot Free | Copilot Pro | Copilot Business | Copilot Enterprise |
|-----|-------------|------------|-----------------|-------------------|
| Requests/min | 10 | 10 | 10 | 15 |
| Requests/day | 50 | 50 | 50 | 100 |
| Tokens/request | 8K in / 4K out | 8K in / 4K out | 8K in / 4K out | 16K in / 8K out |
| Concurrent | 2 | 2 | 2 | 4 |

#### Embedding 模型
| 指標 | 所有方案 |
|-----|---------|
| Requests/min | 15-20 |
| Requests/day | 150-450 |
| Tokens/request | 64,000 |
| Concurrent | 5-8 |

#### DeepSeek-R1 / Grok-3 等特殊模型
- 嚴格限制：1-2 RPM, 8-30 RPD, 4K in/out tokens, 1 concurrent

---

## 4. Token Scope 需求

### 必要權限
| 用途 | Scope |
|-----|-------|
| API 呼叫 | `models` (完整) 或 `models:read` (細粒度) |
| GitHub Actions | `models: read` (在 workflow permissions 中設定) |
| Playground | 無需 token（瀏覽器登入狀態即可） |

### Token 建立方式
- 一般 PAT: https://github.com/settings/tokens
- 細粒度 PAT: https://github.com/settings/personal-access-tokens/new

---

## 5. Rate Limit 政策

### 免費 Tier
- 按模型類型區分：Low / High / Embedding / 特殊模型
- 超過限制後需等待重置（每分鐘或每天重置）
- 回應 HTTP 429 時會包含 `Retry-After` header

### 付費 Tier（需 opt-in）
- 啟用付費後，速率限制提升為 **production grade**
- 參考: [Microsoft Foundry Models quotas and limits](https://learn.microsoft.com/en-us/azure/ai-foundry/model-inference/quotas-limits)
- 所有使用量皆計費（無免費配額）

### 自訂模型 (BYOK)
- 速率限制由 **模型提供者** 設定與執行
- GitHub 不介入限制

---

## 6. 計費機制

### Token Units
- 費用 = Token Units × $0.00001 / token unit
- Token Units = (輸入 tokens × 輸入倍率) + (輸出 tokens × 輸出倍率)

### 定價範例 (GPT-4o)
| 項目 | 價格 |
|-----|-----|
| 輸入倍率 | 0.25 ($2.50 / 百萬 tokens) |
| 快取輸入倍率 | 0.125 ($1.25 / 百萬 tokens) |
| 輸出倍率 | 1.0 ($10.00 / 百萬 tokens) |

### 最便宜的模型
- **Phi-4-mini-instruct**: 輸入 $0.08/M, 輸出 $0.30/M
- **GPT-4o mini**: 輸入 $0.15/M, 輸出 $0.60/M

---

## 7. 功能特色

| 功能 | 說明 |
|-----|-----|
| Playground | 線上即時測試模型、調整參數、比較輸出 |
| Prompt Editor | 單輪 prompt 測試與優化 |
| Comparisons | 多模型並列比較同一 prompt |
| Evaluators | 內建 similarity / relevance / groundedness 評分 |
| .prompt.yml | 將 prompt 儲存為版本控制檔案 |
| Presets | 儲存與分享 playground 設定 |
| VS Code Extension | AI Toolkit 延伸模組支援 |
| GitHub Actions | 在 CI/CD 中直接呼叫模型 |

---

## 8. 重要注意事項

1. **公開預覽階段**: GitHub Models 仍處於 public preview，規格可能變更
2. **OpenAI 模型限制**: OpenAI 模型存取目前也在 public preview
3. **組織管理**: Enterprise 擁有者可啟用/禁用模型，組織擁有者可管控允許使用的模型清單
4. **BYOK 支援**: 目前僅支援 OpenAI 和 AzureAI 兩種自訂 API Key
5. **Billing 獨立**: GitHub Models 計費與 Copilot 計費分開

---

## 9. 相關連結

- 官方文檔: https://docs.github.com/en/github-models
- 模型目錄: https://github.com/marketplace/models
- REST API 參考: https://docs.github.com/en/rest/models
- 計費參考: https://docs.github.com/en/billing/reference/models-multipliers-and-costs
- 意見回饋: https://github.com/orgs/community/discussions/159087
