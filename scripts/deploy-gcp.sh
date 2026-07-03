#!/bin/bash
# ═══════════════════════════════════════════════════════════
# 智研 AI 法律系統 — Production v1.1 Hardened Startup Script
# 適用：Debian 12 / Ubuntu 24.04 LTS on GCP e2-medium
# ═══════════════════════════════════════════════════════════

set -euo pipefail

export HOME=/root
export DEBIAN_FRONTEND=noninteractive

# ── 顏色 ──
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()   { echo -e "${RED}[ERR]${NC} $1"; }

# ═══════════════════════════════════════════════════════════
# Phase 1: 系統準備
# ═══════════════════════════════════════════════════════════

info "Phase 1: 系統更新與依賴安裝"

apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
    curl git docker.io docker-compose-v2 \
    nginx certbot python3-certbot-nginx \
    openssl iptables-persistent prometheus-node-exporter

systemctl enable docker
systemctl start docker

# ═══════════════════════════════════════════════════════════
# Phase 2: 金鑰與憑證生成（先於所有設定）
# ═══════════════════════════════════════════════════════════

info "Phase 2: 生成加密金鑰與安全憑證"

# 🔐 ENCRYPTION_KEY — FreeLLMAPI 加密層基石
# 用 openssl 而非 node，避免 shell heredoc 中執行 node 失敗
ENCRYPTION_KEY=$(openssl rand -hex 32)
echo "[SECURITY] ENCRYPTION_KEY generated: ${ENCRYPTION_KEY:0:8}... (64 chars)"

# 🔐 智研 JWT Secret
ZHIYAN_SECRET=$(openssl rand -hex 32)

# 🔐 Unified API Key（用於智研 → FreeLLMAPI 通訊）
UNIFIED_API_KEY="zhiyan-$(openssl rand -hex 16)"

# ═══════════════════════════════════════════════════════════
# Phase 3: 目錄結構
# ═══════════════════════════════════════════════════════════

info "Phase 3: 建立目錄結構"

mkdir -p /opt/zhiyan/{frontend,backend,scripts,ssl,data/rag,data/backup,logs}
cd /opt/zhiyan

# ═══════════════════════════════════════════════════════════
# Phase 4: .env 生產配置
# ═══════════════════════════════════════════════════════════

info "Phase 4: 寫入 .env"

cat > /opt/zhiyan/.env << EOF
# ══════════════════════════════════════════════════════════
# 智研 AI 法律系統 — Production v1.1 .env
# ══════════════════════════════════════════════════════════

# ── FreeLLMAPI ──
ENCRYPTION_KEY=${ENCRYPTION_KEY}
PORT=3001
HOST=127.0.0.1
HOST_BIND=127.0.0.1
NODE_ENV=production
PROXY_RATE_LIMIT_RPM=60
REQUEST_ANALYTICS_RETENTION_DAYS=30
REQUEST_ANALYTICS_MAX_ROWS=50000

# ── Provider API Keys（手動填入） ──
# 主要：Google Gemini
GOOGLE_API_KEY=
# 次要：Groq
GROQ_API_KEY=
# 備援：GitHub Models
GITHUB_TOKEN=
# 備援：NVIDIA NIM
NVIDIA_API_KEY=
# 備援：Mistral
MISTRAL_API_KEY=

# ── Provider 每日上限 ──
PROVIDER_DAILY_REQUEST_CAP_GOOGLE=1000
PROVIDER_DAILY_REQUEST_CAP_GROQ=500
PROVIDER_DAILY_REQUEST_CAP_GITHUB=500

# ── 智研後端 ──
ZHIYAN_PORT=8001
ZHIYAN_SECRET=${ZHIYAN_SECRET}
ZHIYAN_RAG_PATH=/data/rag/law.db
FREELMAPI_API_KEY=${UNIFIED_API_KEY}

# ── 監控 ──
PROMETHEUS_ENABLED=true
LOG_LEVEL=info
EOF

# ═══════════════════════════════════════════════════════════
# Phase 5: docker-compose.yml（Production Hardened）
# ═══════════════════════════════════════════════════════════

info "Phase 5: 寫入 docker-compose.yml"

cat > /opt/zhiyan/docker-compose.yml << 'DOCKERCOMPOSE'
services:
  # ── FreeLLMAPI — 多 Provider API 代理 ──
  freellmapi:
    image: ghcr.io/tashfeenahmed/freellmapi:v23.4.1
    restart: unless-stopped
    env_file: .env
    environment:
      NODE_ENV: production
      PORT: 3001
      NODE_OPTIONS: "--max-old-space-size=1024"
    # 永不暴露到外部 — 僅 localhost
    ports:
      - "127.0.0.1:3001:3001"
    volumes:
      - freellmapi-data:/app/server/data
      - ./freellmapi.config.json:/app/server/data/config.json:ro
    healthcheck:
      test: ["CMD-SHELL", "node -e \"fetch('http://127.0.0.1:3001/api/ping').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))\""]
      interval: 30s
      timeout: 10s
      start_period: 30s
      retries: 5
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # ── 智研後端 — FastAPI 法律系統 ──
  zhiyan:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "127.0.0.1:8001:8001"
    environment:
      LLM_PROVIDER: freellmapi
      FREELMAPI_BASE_URL: http://freellmapi:3001/v1
      FREELMAPI_API_KEY: ${FREELMAPI_API_KEY}
      DATABASE_PATH: /data/zhiyan.db
      RAG_DB_PATH: ${ZHIYAN_RAG_PATH:-/data/rag/law.db}
      PORT: ${ZHIYAN_PORT:-8001}
    volumes:
      - zhiyan-data:/data
      - ./data/rag:/data/rag:ro
      - ./frontend/frontend:/app/frontend:ro
    # 用 service_started 避免 healthcheck deadlock
    depends_on:
      freellmapi:
        condition: service_started
    # App-layer retry — 智研內部會重試 LLM 呼叫
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # ── Nginx — 反向代理 + SSL ──
  nginx:
    image: nginx:1.27-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./frontend/frontend:/usr/share/nginx/html:ro
    depends_on:
      zhiyan:
        condition: service_started
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # ── Prometheus Node Exporter — 基礎監控 ──
  prometheus:
    image: prom/prometheus:v2.55.0
    restart: unless-stopped
    ports:
      - "127.0.0.1:9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.retention.time=30d"
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "2"

volumes:
  freellmapi-data:
  zhiyan-data:
  prometheus-data:
DOCKERCOMPOSE

# ═══════════════════════════════════════════════════════════
# Phase 6: FreeLLMAPI declarative config（Routing: Bandit）
# ═══════════════════════════════════════════════════════════

info "Phase 6: 寫入 FreeLLMAPI declarative config"

cat > /opt/zhiyan/freellmapi.config.json << 'CONFIG'
{
  "routing": {
    "strategy": "smartest"
  },
  "fallback": [
    { "platform": "google",   "modelId": "gemini-2.5-flash",  "priority": 1 },
    { "platform": "groq",     "modelId": "llama-4.1-scout",   "priority": 2 },
    { "platform": "github",   "modelId": "openai/gpt-4.1",    "priority": 3 },
    { "platform": "nvidia",   "modelId": "moonshotai/kimi-k2.6", "priority": 4 },
    { "platform": "mistral",  "modelId": "mistral-large",     "priority": 5 }
  ]
}
CONFIG

# ═══════════════════════════════════════════════════════════
# Phase 7: Nginx 配置（含 rate limit + upstream failover）
# ═══════════════════════════════════════════════════════════

info "Phase 7: 寫入 nginx 配置"

cat > /opt/zhiyan/nginx.conf << 'NGINX'
# Rate limit zone: 每 IP 每秒 2 請求
limit_req_zone $binary_remote_addr zone=zhiyan_llm:10m rate=2r/s;

# Upstream 集群（支援多實例）
upstream zhiyan_backend {
    least_conn;
    server 127.0.0.1:8001 max_fails=3 fail_timeout=30s;
}

server {
    listen 80 default_server;
    server_name _;

    # 安全 headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 前端靜態檔案
    root /usr/share/nginx/html;
    index index.html;
    
    # 靜態檔案快取
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # API 代理
    location /api/ {
        limit_req zone=zhiyan_llm burst=5 nodelay;
        proxy_pass http://zhiyan_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 30s;
        
        # Retry on error
        proxy_next_upstream error timeout http_500 http_502 http_503;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout 10s;
    }

    # 健康檢查端點（不計入 rate limit）
    location /health {
        access_log off;
        proxy_pass http://zhiyan_backend/api/status;
        proxy_read_timeout 5s;
    }

    # 靜態頁面
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 拒絕存取隱藏檔案
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
NGINX

# ═══════════════════════════════════════════════════════════
# Phase 8: Prometheus 監控配置
# ═══════════════════════════════════════════════════════════

info "Phase 8: 寫入 Prometheus 配置"

cat > /opt/zhiyan/prometheus.yml << 'PROM'
global:
  scrape_interval: 15s
  evaluation_interval: 30s

scrape_configs:
  - job_name: 'freellmapi'
    static_configs:
      - targets: ['127.0.0.1:3001']
    metrics_path: '/api/metrics'

  - job_name: 'zhiyan'
    static_configs:
      - targets: ['127.0.0.1:8001']
    metrics_path: '/api/metrics'

  - job_name: 'node'
    static_configs:
      - targets: ['127.0.0.1:9100']
PROM

# ═══════════════════════════════════════════════════════════
# Phase 9: iptables 防火牆規則
# ═══════════════════════════════════════════════════════════

info "Phase 9: 設定 iptables 防火牆"

iptables -F INPUT
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -i lo -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -j DROP
netfilter-persistent save

# ═══════════════════════════════════════════════════════════
# Phase 10: 啟動容器
# ═══════════════════════════════════════════════════════════

info "Phase 10: 啟動所有服務"

cd /opt/zhiyan
docker compose pull
docker compose up -d --build

info "等待服務就緒..."
sleep 15

# 健康檢查
if curl -sf http://localhost:8001/api/status > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 智研後端就緒${NC}"
else
    warn "智研後端未回應，查看日誌："
    docker compose logs --tail=30 zhiyan
fi

if curl -sf http://localhost:3001/api/ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ FreeLLMAPI 就緒${NC}"
else
    warn "FreeLLMAPI 未回應，查看日誌："
    docker compose logs --tail=30 freellmapi
fi

# ═══════════════════════════════════════════════════════════
# 備份腳本
# ═══════════════════════════════════════════════════════════

cat > /opt/zhiyan/scripts/backup.sh << 'BACKUP'
#!/bin/bash
# 每日備份 — cron: 0 3 * * *

BACKUP_DIR="/opt/zhiyan/data/backup"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=90

mkdir -p "$BACKUP_DIR/$DATE"

# FreeLLMAPI 資料
docker cp freellmapi:/app/server/data "$BACKUP_DIR/$DATE/freellmapi/" 2>/dev/null || true

# 智研資料
docker cp zhiyan:/data "$BACKUP_DIR/$DATE/zhiyan/" 2>/dev/null || true

# 備份 .env（加密後）
gpg --symmetric --cipher-algo AES256 --batch --passphrase "$ENCRYPTION_KEY" \
  -o "$BACKUP_DIR/$DATE/env.gpg" /opt/zhiyan/.env 2>/dev/null || true

# 壓縮
cd "$BACKUP_DIR"
tar czf "zhiyan-backup-$DATE.tar.gz" "$DATE/"
rm -rf "$DATE"

# 清理舊備份
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "[$(date)] ✅ 備份完成：zhiyan-backup-$DATE.tar.gz"
BACKUP

chmod +x /opt/zhiyan/scripts/backup.sh

# Crontab
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/zhiyan/scripts/backup.sh >> /opt/zhiyan/logs/backup.log 2>&1") | crontab -

# ═══════════════════════════════════════════════════════════
# 更新腳本
# ═══════════════════════════════════════════════════════════

cat > /opt/zhiyan/scripts/update.sh << 'UPDATE'
#!/bin/bash
set -euo pipefail

cd /opt/zhiyan

# 備份
bash scripts/backup.sh

# Pull 最新程式碼
git -C frontend pull || true
git -C backend pull || true

# 更新 FreeLLMAPI image
docker compose pull freellmapi

# 重建並啟動
docker compose up -d --build --remove-orphans

# 清理舊 image
docker image prune -f

# 驗證
sleep 15
if curl -sf http://localhost:8001/api/status > /dev/null; then
    echo "✅ 更新成功（$(date)）"
else
    echo "❌ 更新失敗，檢查日誌"
    docker compose logs --tail=30 zhiyan
    exit 1
fi
UPDATE

chmod +x /opt/zhiyan/scripts/update.sh

# ═══════════════════════════════════════════════════════════
# 完成
# ═══════════════════════════════════════════════════════════

echo ""
info "═══════════════════════════════════════"
info "  智研 Production v1.1 部署完成"
info "═══════════════════════════════════════"
echo ""
echo "  📍 前端：     http://$(curl -s ifconfig.me 2>/dev/null || echo 'your-ip')"
echo "  📍 API：      http://localhost:8001/api/chat/ask"
echo "  📍 FreeLLMAPI：http://localhost:3001 (local only)"
echo "  📍 Dashboard：http://localhost:3001 (首次使用需設定)"
echo "  📍 監控：     http://localhost:9090 (local only)"
echo ""
echo "  請手動填入 Provider API Keys："
echo "    nano /opt/zhiyan/.env"
echo "    docker compose restart freellmapi"
echo ""
echo "  🔑 Unified API Key（智研→FreeLLMAPI）：${UNIFIED_API_KEY}"
echo "  🔐 ENCRYPTION_KEY：${ENCRYPTION_KEY:0:8}... (儲存在 .env)"
echo ""
echo "  排程任務："
echo "    ✅ 每日備份 03:00 → /opt/zhiyan/data/backup/"
echo "    ✅ 保留 90 天"
echo "    ✅ 更新腳本：bash /opt/zhiyan/scripts/update.sh"
echo ""
echo "  ⚠️ 第一次使用需設定 FreeLLMAPI Dashboard："
echo "      開瀏覽器 http://localhost:3001"
echo "      設定使用者名稱 + 密碼"
echo "      在 Dashboard 中填入 Provider API Keys"
echo ""
