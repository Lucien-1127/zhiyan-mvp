/**
 * 智研 OAuth 驗證層
 * 支援 Google 和 GitHub 登入
 */

class OAuthService {
  constructor(config) {
    this.config = config;
    this.token = localStorage.getItem('auth_token');
    this.user = JSON.parse(localStorage.getItem('user_profile') || '{}');
  }

  /**
   * Google OAuth 登入流程
   */
  initiateGoogleLogin() {
    const params = new URLSearchParams({
      client_id: this.config.oauth.google.clientId,
      redirect_uri: this.config.oauth.google.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
    });
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    window.location.href = authUrl;
  }

  /**
   * GitHub OAuth 登入流程
   */
  initiateGithubLogin() {
    const params = new URLSearchParams({
      client_id: this.config.oauth.github.clientId,
      redirect_uri: this.config.oauth.github.redirectUri,
      scope: 'user:email',
      state: this.generateState(),
    });
    
    const authUrl = `https://github.com/login/oauth/authorize?${params}`;
    window.location.href = authUrl;
  }

  /**
   * 處理 OAuth 回調
   */
  async handleCallback(provider, code, state = null) {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/auth/${provider}/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state }),
      });

      const data = await response.json();
      
      if (data.token) {
        this.setToken(data.token);
        this.setUserProfile(data.user);
        return data;
      } else {
        throw new Error(data.message || '驗證失敗');
      }
    } catch (error) {
      console.error(`${provider} 驗證錯誤:`, error);
      throw error;
    }
  }

  /**
   * 設定認證 Token
   */
  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  /**
   * 設定用戶檔案
   */
  setUserProfile(user) {
    this.user = user;
    localStorage.setItem('user_profile', JSON.stringify(user));
  }

  /**
   * 取得目前登入用戶
   */
  getCurrentUser() {
    return this.user || null;
  }

  /**
   * 檢查是否已登入
   */
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  /**
   * 登出
   */
  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_profile');
    this.token = null;
    this.user = null;
  }

  /**
   * 生成隨機 State 值
   */
  generateState() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}

// 全域實例
const oauthService = new OAuthService(API_CONFIG);
