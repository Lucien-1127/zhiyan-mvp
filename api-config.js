/**
 * 智研 API 配置層
 * 統一管理所有後端 API 端點和 LLM 模型配置
 */

const API_CONFIG = {
  // 後端基礎 URL
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8001',
  
  // LLM 提供商配置（OpenAI 相容格式）
  llm: {
    provider: process.env.REACT_APP_LLM_PROVIDER || 'deepseek',
    baseURL: process.env.REACT_APP_LLM_URL || 'https://api.deepseek.com/v1',
    apiKey: process.env.REACT_APP_LLM_KEY || '',
    model: 'deepseek-chat',
    temperature: 0.3,
    maxTokens: 4096,
  },

  // OAuth 設定
  oauth: {
    google: {
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
      redirectUri: `${window.location.origin}/auth/google/callback`,
    },
    github: {
      clientId: process.env.REACT_APP_GITHUB_CLIENT_ID || '',
      redirectUri: `${window.location.origin}/auth/github/callback`,
    },
  },

  // API 端點
  endpoints: {
    // 聊天相關
    chat: {
      ask: '/api/chat/ask',
      history: '/api/chat/history',
      clear: '/api/chat/clear',
    },
    
    // 合約相關
    contract: {
      generate: '/api/contract/generate',
      templates: '/api/contract/templates',
      download: '/api/contract/download/:id',
    },
    
    // 法規監控
    monitor: {
      tracked: '/api/monitor/tracked',
      status: '/api/monitor/status',
      check: '/api/monitor/check',
      diff: '/api/monitor/diff/:pcode',
    },
    
    // 搜尋 (RAG)
    search: {
      query: '/api/search/query',
      laws: '/api/search/laws',
      cases: '/api/search/cases',
      documents: '/api/search/documents',
    },
    
    // OSINT 調查
    osint: {
      investigate: '/api/osint/investigate',
      report: '/api/osint/report/:id',
      sources: '/api/osint/sources',
    },
    
    // AI 摘要
    summary: {
      generate: '/api/summary/generate',
      history: '/api/summary/history',
    },
    
    // 使用者相關
    user: {
      profile: '/api/user/profile',
      settings: '/api/user/settings',
      logout: '/api/user/logout',
    },
  },

  // HTTP 逾時（毫秒）
  timeout: 30000,

  // 重試配置
  retry: {
    maxAttempts: 3,
    delayMs: 1000,
  },
};

/**
 * API 服務類別 — 封裝所有 HTTP 呼叫
 */
class ApiService {
  constructor(config) {
    this.config = config;
    this.token = localStorage.getItem('auth_token');
  }

  /**
   * 發送 API 請求
   */
  async request(method, endpoint, data = null, options = {}) {
    const url = `${this.config.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const fetchOptions = {
      method,
      headers,
      timeout: this.config.timeout,
    };

    if (data) {
      fetchOptions.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API 錯誤 [${method} ${endpoint}]:`, error);
      throw error;
    }
  }

  // ===== 聊天 API =====
  async askLegal(message) {
    return this.request('POST', this.config.endpoints.chat.ask, { message });
  }

  async getChatHistory() {
    return this.request('GET', this.config.endpoints.chat.history);
  }

  // ===== 合約 API =====
  async generateContract(type, params) {
    return this.request('POST', this.config.endpoints.contract.generate, { type, ...params });
  }

  async getContractTemplates() {
    return this.request('GET', this.config.endpoints.contract.templates);
  }

  // ===== 法規監控 API =====
  async getTrackedLaws() {
    return this.request('GET', this.config.endpoints.monitor.tracked);
  }

  async checkLawUpdates() {
    return this.request('POST', this.config.endpoints.monitor.check);
  }

  async getLawDiff(pcode) {
    return this.request('GET', this.config.endpoints.monitor.diff.replace(':pcode', pcode));
  }

  // ===== 搜尋 API =====
  async searchLaws(query) {
    return this.request('GET', `${this.config.endpoints.search.query}?q=${encodeURIComponent(query)}`);
  }

  async searchCases(query) {
    return this.request('GET', `${this.config.endpoints.search.cases}?q=${encodeURIComponent(query)}`);
  }

  // ===== OSINT API =====
  async investigateEntity(name, type = 'person') {
    return this.request('POST', this.config.endpoints.osint.investigate, { name, type });
  }

  async getOsintReport(reportId) {
    return this.request('GET', this.config.endpoints.osint.report.replace(':id', reportId));
  }

  // ===== 摘要 API =====
  async generateSummary(content, type = 'document') {
    return this.request('POST', this.config.endpoints.summary.generate, { content, type });
  }

  // ===== 使用者 API =====
  async getUserProfile() {
    return this.request('GET', this.config.endpoints.user.profile);
  }

  async updateUserSettings(settings) {
    return this.request('PUT', this.config.endpoints.user.settings, settings);
  }

  async logout() {
    localStorage.removeItem('auth_token');
    return this.request('POST', this.config.endpoints.user.logout);
  }
}

// 全域實例
const apiService = new ApiService(API_CONFIG);

// 匯出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_CONFIG, ApiService, apiService };
}
