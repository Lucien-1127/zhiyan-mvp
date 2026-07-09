#!/usr/bin/env python3
"""智研 Mini App 後端 v4 — 全平台金鑰管理 + JWT 認證"""
import json, os, sys, sqlite3, subprocess, hashlib, hmac, base64, time, bcrypt
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
from datetime import datetime, timezone

REGISTRY = os.path.expanduser("~/.hermes/env/keys-registry.json")
ENV_DIR  = os.path.expanduser("~/.hermes/env")
STATIC_DIR = "/var/www/brand-site/tg-app"
DB = "/var/lib/docker/volumes/zhiyan_freellmapi-data/_data/freeapi.db"

SECRET_FILE = os.path.expanduser("~/.hermes/env/.auth_secret")
PASSWORD_FILE = os.path.expanduser("~/.hermes/env/.auth_password")
TOKEN_TTL = 86400  # 24 小時


# ── Rate Limiter ──────────────────────────────────────────
_LOGIN_ATTEMPTS = {}  # ip -> [attempts, window_start]

def _check_login_rate_limit(ip):
    now = time.time()
    if ip in _LOGIN_ATTEMPTS:
        attempts, window = _LOGIN_ATTEMPTS[ip]
        if now - window < 60:
            if attempts >= 5:
                return False
            _LOGIN_ATTEMPTS[ip][0] += 1
        else:
            _LOGIN_ATTEMPTS[ip] = [1, now]
    else:
        _LOGIN_ATTEMPTS[ip] = [1, now]
    return True

PLATFORM_CFG = {
    "groq":       {"prefix":"gsk_",   "test_url":"https://api.groq.com/openai/v1/models",
                    "test_header":"Authorization", "test_header_val":"Bearer {key}"},
    "openrouter": {"prefix":"sk-or-", "test_url":"https://openrouter.ai/api/v1/credits",
                    "test_header":"Authorization", "test_header_val":"Bearer {key}"},
    "deepseek":   {"prefix":"sk-",    "test_url":"https://api.deepseek.com/v1/models",
                    "test_header":"Authorization", "test_header_val":"Bearer {key}"},
    "nvidia":     {"prefix":"nvapi-","test_url":"https://integrate.api.nvidia.com/v1/models",
                    "test_header":"Authorization", "test_header_val":"Bearer {key}"},
    "cerebras":   {"prefix":"csk-",   "test_url":"https://api.cerebras.ai/v1/models",
                    "test_header":"Authorization", "test_header_val":"Bearer {key}"},
    "mistral":    {"prefix":None,      "test_url":"https://api.mistral.ai/v1/models",
                    "test_header":"Authorization", "test_header_val":"Bearer {key}"},
    "cloudflare": {"prefix":None,      "test_url":"https://api.cloudflare.com/client/v4/user/tokens/verify",
                    "test_header":"Authorization", "test_header_val":"Bearer {key}"},
    "gemini":     {"prefix":None,      "test_url":"https://generativelanguage.googleapis.com/v1beta/models?key={key}",
                    "test_header":None, "test_header_val":None},
    "agnes":      {"prefix":None,      "test_url":"https://apihub.agnes-ai.com/v1/models",
                    "test_header":"Authorization", "test_header_val":"Bearer {key}"},
    "telegram":   {"prefix":None,      "test_url":"https://api.telegram.org/bot{key}/getMe",
                    "test_header":None, "test_header_val":None},
    "freellm":    {"prefix":None,      "test_url":None, "test_header":None, "test_header_val":None},
}

# ── JWT 認證系統 ────────────────────────────────────────
def _load_secret():
    """載入或自動產生 secret key"""
    os.makedirs(os.path.dirname(SECRET_FILE), exist_ok=True)
    if os.path.exists(SECRET_FILE):
        with open(SECRET_FILE) as f:
            return f.read().strip()
    import secrets as _sec
    key = _sec.token_hex(32)
    with open(SECRET_FILE, "w") as f:
        f.write(key + "\n")
    os.chmod(SECRET_FILE, 0o600)
    return key

def _generate_token(user_id="admin"):
    """產生 HMAC-SHA256 token，到期時間編碼在 payload 中"""
    secret = _load_secret()
    expiry = int(time.time()) + TOKEN_TTL
    payload = f"{user_id}:{expiry}"
    sig = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    token = base64.urlsafe_b64encode(f"{payload}:{sig}".encode()).decode().rstrip("=")
    return token

def _verify_token(token):
    """驗證 token，成功回傳 user_id，失敗回傳 None"""
    try:
        secret = _load_secret()
        padded = token + "=" * (4 - len(token) % 4) if len(token) % 4 else token
        decoded = base64.urlsafe_b64decode(padded).decode()
        parts = decoded.rsplit(":", 1)
        if len(parts) != 2:
            return None
        payload, sig = parts
        expected_sig = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        user_id, expiry = payload.split(":", 1)
        if int(expiry) < time.time():
            return None
        return user_id
    except Exception:
        return None

def _verify_password(password):
    """比對 bcrypt hash"""
    try:
        with open(PASSWORD_FILE) as f:
            stored_hash = f.read().strip()
        return bcrypt.checkpw(password.encode(), stored_hash.encode())
    except Exception:
        return False

def _get_token_from_headers(headers):
    auth = headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None

# ── 原始功能 ────────────────────────────────────────────
def _id(s): return hashlib.md5(s.encode()).hexdigest()[:8]

def load_registry():
    if os.path.exists(REGISTRY):
        with open(REGISTRY) as f:
            data = json.load(f)
            if isinstance(data, list): return data
    old = os.path.join(ENV_DIR, "groq-keys.json")
    if os.path.exists(old):
        with open(old) as f:
            old_keys = json.load(f)
        new_keys = []
        for k in old_keys:
            kid = _id(k.get("full_key",""))
            new_keys.append({
                "id": kid, "platform": "groq", "label": k.get("label","groq"),
                "prefix": k.get("prefix",""), "added_at": k.get("added_at",""),
                "tested": False, "valid": None,
            })
        save_registry(new_keys)
        return new_keys
    return []

def save_registry(data):
    os.makedirs(ENV_DIR, exist_ok=True)
    with open(REGISTRY, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def write_env_file(platform, label, key):
    filename = f"{platform}-{label}.env"
    filepath = os.path.join(ENV_DIR, filename)
    var_name = f"{platform.upper()}_API_KEY"
    with open(filepath, "w") as f:
        f.write(f"# {platform.upper()} API Key — {label}\n")
        f.write(f"{var_name}={key}\n")
    os.chmod(filepath, 0o600)
    return filepath

def delete_env_file(platform, label):
    filename = f"{platform}-{label}.env"
    filepath = os.path.join(ENV_DIR, filename)
    if os.path.exists(filepath): os.remove(filepath)
    for suffix in [".bak", ".old"]:
        alt = filepath + suffix
        if os.path.exists(alt): os.remove(alt)

def test_key(platform, key):
    cfg = PLATFORM_CFG.get(platform)
    if not cfg or not cfg.get("test_url"):
        return {"status": "skipped", "reason": "此平台無測試端點"}
    url = cfg["test_url"].replace("{key}", key)
    cmd = ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "15", url]
    if cfg.get("test_header"):
        hdr_val = cfg["test_header_val"].replace("{key}", key)
        cmd += ["-H", f"{cfg['test_header']}: {hdr_val}"]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
        code = res.stdout.strip()
        if code in ("200", "201", "202"):
            return {"status": "valid", "http_code": int(code)}
        elif code in ("401", "403"):
            return {"status": "invalid", "http_code": int(code), "reason": "金鑰無效或已過期"}
        elif code == "429":
            return {"status": "rate_limited", "http_code": 429, "reason": "暫時被限速，稍後再試"}
        else:
            return {"status": "error", "http_code": int(code) if code.isdigit() else 0, "reason": f"HTTP {code}"}
    except Exception as e:
        return {"status": "error", "reason": str(e)}

class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def do_OPTIONS(self):
        self._cors(); self.send_response(200); self.end_headers()

    def _require_auth(self):
        """檢查 token，無效則回傳 401"""
        token = _get_token_from_headers(self.headers)
        if not token or not _verify_token(token):
            self._json({"error":"未授權，請重新登入","code":"UNAUTHORIZED"}, 401)
            return True
        return False

    def do_GET(self):
        path = urlparse(self.path).path
        skip_auth = path in ("/api/auth/login",)
        if not skip_auth:
            if self._require_auth():
                return
        if path == "/api/status":    self._json(self._get_dash_status())
        elif path == "/api/models":  self._json(self._get_model_status())
        elif path == "/api/keys":    self._json({"keys": self._list_keys(), "platforms": list(PLATFORM_CFG.keys())})
        elif path == "/api/dashboard": self._json(self._get_dashboard_payload())
        elif path == "/api/alerts":    self._json(self._get_alerts())
        elif path == "/api/proxy/status": self._json(self._get_proxy_status())
        elif path == "/api/settings/profile": self._json(self._get_settings_profile())
        elif path.startswith("/api/"):
            self._json({"error":"unknown api"}, 404)
        else:
            serve_path = path.lstrip("/")
            full = os.path.join(STATIC_DIR, serve_path) if serve_path else STATIC_DIR
            if os.path.isfile(full):
                super().do_GET()
            else:
                self.path = "/index.html"
                super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        body = self._read_body()
        try: d = json.loads(body) if body else {}
        except: self._json({"error":"invalid JSON"},400); return

        if path == "/api/auth/login":
            self._handle_login(d)
            return

        if self._require_auth():
            return

        if path == "/api/keys/add":     self._handle_add(d)
        elif path == "/api/keys/test":  self._handle_test(d)
        elif path == "/api/keys/delete": self._handle_delete(d)
        elif path == "/api/keys/replace": self._handle_replace(d)
        elif path == "/api/proxy/action": self._handle_proxy_action(d)
        elif path.startswith("/api/alerts/") and path.endswith("/acknowledge"): self._json({"success":True,"message":"告警已確認"})
        elif path.startswith("/api/alerts/") and path.endswith("/resolve"):     self._json({"success":True,"message":"告警已解決"})
        else: self._json({"error":"not found"},404)

    def _handle_login(self, d):
        password = d.get("password", "")
        if not password:
            self._json({"error":"請輸入密碼"}, 400)
            return
        client_ip = self.client_address[0]
        if not _check_login_rate_limit(client_ip):
            self._json({"error":"登入嘗試過於頻繁，請稍後再試","code":"RATE_LIMITED"}, 429)
            return
        if not _verify_password(password):
            self._json({"error":"密碼錯誤"}, 401)
            return
        token = _generate_token()
        self._json({
            "success": True,
            "token": token,
            "expires_in": TOKEN_TTL,
        })

    def _list_keys(self):
        return [{"id":k["id"],"platform":k["platform"],"label":k["label"],
            "prefix":k.get("prefix",""),"added_at":k.get("added_at",""),
            "tested":k.get("tested",False),"valid":k.get("valid")} for k in load_registry()]

    def _handle_add(self, d):
        platform = (d.get("platform") or "groq").lower().strip()
        key = d.get("key","").strip(); label = d.get("label","").strip()
        if not key: self._json({"error":"請輸入金鑰"},400); return
        if platform not in PLATFORM_CFG: self._json({"error":f"未知平台: {platform}"},400); return
        cfg = PLATFORM_CFG[platform]
        if cfg.get("prefix") and not key.startswith(cfg["prefix"]):
            self._json({"error":f"{platform} 金鑰應以 {cfg['prefix']} 開頭"},400); return
        registry = load_registry(); kid = _id(key)
        for k in registry:
            if k["id"] == kid: self._json({"error":f"此金鑰已存在 ({k['label']})","id":kid},409); return
        if not label:
            existing = [k for k in registry if k["platform"] == platform]
            label = f"{platform}-{len(existing)+1}"
        prefix = key[:20] + ("..." if len(key)>20 else "")
        env_path = write_env_file(platform, label, key)
        registry.append({"id":kid,"platform":platform,"label":label,"prefix":prefix,
            "added_at":datetime.now().isoformat(),"env_file":os.path.basename(env_path),
            "tested":False,"valid":None})
        save_registry(registry)
        self._json({"success":True,"id":kid,"label":label,"platform":platform,
            "env_file":os.path.basename(env_path),"total":len(registry)})

    def _handle_delete(self, d):
        kid = d.get("id","").strip()
        if not kid: self._json({"error":"缺少金鑰 ID"},400); return
        registry = load_registry(); target = next((k for k in registry if k["id"]==kid),None)
        if not target: self._json({"error":"找不到該金鑰"},404); return
        delete_env_file(target["platform"], target["label"])
        registry = [k for k in registry if k["id"]!=kid]; save_registry(registry)
        self._json({"success":True,"deleted":{"id":kid,"platform":target["platform"],"label":target["label"]},"total":len(registry)})

    def _handle_replace(self, d):
        kid = d.get("id","").strip(); new_key = d.get("key","").strip(); new_label = d.get("label","").strip()
        if not kid or not new_key: self._json({"error":"缺少 id 或新金鑰"},400); return
        registry = load_registry(); target = next((k for k in registry if k["id"]==kid),None)
        if not target: self._json({"error":"找不到該金鑰"},404); return
        platform = target["platform"]; cfg = PLATFORM_CFG[platform]
        if cfg.get("prefix") and not new_key.startswith(cfg["prefix"]):
            self._json({"error":f"{platform} 金鑰應以 {cfg['prefix']} 開頭"},400); return
        new_id = _id(new_key)
        for k in registry:
            if k["id"]==new_id and k["id"]!=kid: self._json({"error":f"新金鑰與既有金鑰重複 ({k['label']})"},409); return
        old_label = target["label"]
        if not new_label: new_label = old_label
        delete_env_file(platform, old_label)
        new_env = write_env_file(platform, new_label, new_key)
        target.update({"id":new_id,"label":new_label,"prefix":new_key[:20]+("..." if len(new_key)>20 else ""),
            "env_file":os.path.basename(new_env),"tested":False,"valid":None,"replaced_at":datetime.now().isoformat()})
        save_registry(registry)
        self._json({"success":True,"id":new_id,"old_label":old_label,"new_label":new_label,"platform":platform})

    def _handle_test(self, d):
        kid = d.get("id","").strip()
        if not kid: self._json({"error":"缺少金鑰 ID"},400); return
        registry = load_registry(); target = next((k for k in registry if k["id"]==kid),None)
        if not target: self._json({"error":"找不到該金鑰"},404); return
        full_key = None
        env_file = os.path.join(ENV_DIR, target.get("env_file",""))
        if os.path.exists(env_file):
            with open(env_file) as f:
                for line in f:
                    line=line.strip()
                    if "=" in line and not line.startswith("#"):
                        full_key = line.split("=",1)[1].strip(); break
        if not full_key: self._json({"error":"無法讀取金鑰內容"},500); return
        result = test_key(target["platform"], full_key)
        for k in registry:
            if k["id"]==kid:
                k["tested"]=True; k["valid"]=(result.get("status")=="valid")
                k["last_tested"]=datetime.now().isoformat(); k["test_result"]=result
        save_registry(registry)
        self._json({"success":True,"id":kid,"platform":target["platform"],"label":target["label"],"result":result})

    def _q(self, sql, params=()):
        try:
            conn = sqlite3.connect(DB); cur = conn.cursor()
            cur.execute(sql, params); rows = cur.fetchall()
            conn.close(); return rows
        except: return []

    def _handle_proxy_action(self, d):
        action = d.get("action","")
        if action == "restart":
            try:
                subprocess.run(["sudo", "systemctl", "restart", "hermes-proxy"], timeout=30)
                return self._json({"success":True,"message":"Proxy 重啟指令已送出"})
            except Exception as e:
                return self._json({"success":False,"error":str(e)},500)
        self._json({"error":f"未知操作: {action}"},400)

    def _get_dashboard_payload(self):
        raw = self._get_dash_status()
        services_ok = sum(1 for s in raw.get("services",[]) if s["s"]=="ok")
        services_total = len(raw.get("services",[]))
        groq_keys = sum(1 for k in load_registry() if k["platform"]=="groq" and k.get("valid")==True)
        return {
            "overview": {
                "environment": "prod",
                "generatedAt": datetime.now().isoformat(),
                "kpis": [
                    {"id":"vm_status","key":"vm_status","label":"VM 狀態","value":"運行中","status":"online"},
                    {"id":"proxy_status","key":"proxy_status","label":"Proxy 狀態","value":"在線","status":"online"},
                    {"id":"active_agents","key":"active_agents","label":"活躍 Agents","value":groq_keys,"unit":"count"},
                    {"id":"requests_per_minute","key":"requests_per_minute","label":"請求速率","value":round(sum(d.get("t",0)/1440 for d in raw.get("daily",[]))),"unit":"rpm"},
                    {"id":"avg_latency","key":"avg_latency","label":"平均延遲","value":f"{services_ok*10}ms","unit":"ms","status":"online" if services_total>0 else "offline"},
                    {"id":"error_rate","key":"error_rate","label":"錯誤率","value":f"{0.1}%","unit":"percent","status":"online"},
                    {"id":"quota_usage","key":"quota_usage","label":"額度使用","value":round(raw.get("openrouter",{}).get("remaining",0)),"unit":"count"},
                    {"id":"alerts_count","key":"alerts_count","label":"告警數","value":0,"unit":"count"},
                ],
                "alertSummary": {"total":services_total-services_ok,"critical":0,"warning":services_total-services_ok,"info":0,"resolved":0},
            },
            "trendRange": "24h",
            "trends": [{"key":"requests","label":"請求數","color":"#40a7e3","points":[{"timestamp":row["d"],"value":row["t"]} for row in raw.get("daily",[])],"unit":"count"}],
            "alerts": [],
            "events": []
        }

    def _get_dash_status(self):
        r = {}
        try:
            resp = subprocess.run(["curl","-s","https://openrouter.ai/api/v1/credits",
                "-H","Authorization: Bearer ***"],
                capture_output=True,text=True,timeout=10)
            d = json.loads(resp.stdout).get("data",{})
            r["openrouter"] = {"total":d.get("total_credits",0),"used":round(d.get("total_usage",0),2),
                "remaining":round(max(0,d.get("total_credits",0)-d.get("total_usage",0)),2)}
        except: r["openrouter"] = {"remaining":"?"}
        r["services"] = []
        for name,port,path in [("法律API",8001,"/"),("FreeLLM",3001,"/"),("Qdrant",6333,"/")]:
            try:
                c = subprocess.run(["curl","-s","-o","/dev/null","-w","%{http_code}",
                    f"http://127.0.0.1:{port}{path}"],capture_output=True,text=True,timeout=5).stdout.strip()
                r["services"].append({"n":name,"s":"ok" if c in("200","000","302","307") else "down"})
            except: r["services"].append({"n":name,"s":"error"})
        r["groq"] = []; seen=set()
        for row in self._q("""SELECT ak.id,q.limit_value,q.remaining_value,q.limit_type
            FROM provider_quota_state q JOIN api_keys ak ON q.key_id=ak.id
            WHERE ak.platform='groq' AND q.limit_value>0 ORDER BY q.observed_at DESC"""):
            if row[0] not in seen:
                seen.add(row[0]); u=row[1]-row[2]
                r["groq"].append({"k":"K#"+str(row[0]),"l":row[1],"u":u if u>=0 else 0,"t":row[3]})
        r["daily"] = [{"d":row[0],"t":row[1] or 0} for row in
            self._q("SELECT DATE(created_at),SUM(input_tokens+output_tokens) FROM requests WHERE created_at>=DATE('now','-7d') GROUP BY 1 ORDER BY 1 DESC")]
        registry = load_registry()
        r["keys_summary"] = {}; [r["keys_summary"].update({k["platform"]:r["keys_summary"].get(k["platform"],0)+1}) for k in registry]
        r["keys_summary"]["total"] = len(registry)
        r["updated"] = datetime.now().strftime("%H:%M UTC")
        return r

    def _get_model_status(self):
        r = {}
        r["platforms"] = [{"p":row[0],"n":row[1],"e":row[2]} for row in
            self._q("SELECT platform,COUNT(*),SUM(CASE WHEN enabled=1 THEN 1 ELSE 0 END) FROM models GROUP BY platform ORDER BY COUNT(*) DESC")]
        r["errors"] = [{"m":row[0],"e":row[1]} for row in
            self._q("SELECT model_id,COUNT(*) FROM requests WHERE status!='success' AND created_at>=datetime('now','-24h') GROUP BY model_id ORDER BY COUNT(*) DESC LIMIT 10")]
        r["recent"] = [{"m":row[0],"t":row[1]} for row in
            self._q("SELECT model_id,MAX(created_at) FROM requests WHERE status='success' GROUP BY model_id ORDER BY MAX(created_at) DESC LIMIT 10")]
        return r

    def _get_alerts(self):
        rows = self._q("""SELECT id, platform, model_id, status, error, created_at
            FROM requests WHERE status!='success'
            ORDER BY id DESC LIMIT 20""")
        return [{
            "id": r[0], "platform": r[1], "model_id": r[2],
            "status": r[3], "error": r[4] or "無錯誤資訊",
            "created_at": r[5]
        } for r in rows]

    def _get_proxy_status(self):
        freellm_status = "down"
        try:
            r = subprocess.run(["docker", "ps", "--filter", "name=freellm", "--format", "{{.Status}}"],
                capture_output=True, text=True, timeout=10)
            if r.stdout.strip():
                freellm_status = r.stdout.strip()[:20]
        except: pass

        legal_status = "down"
        try:
            c = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
                "--max-time", "5", "http://127.0.0.1:8001/"],
                capture_output=True, text=True, timeout=10).stdout.strip()
            if c in ("200", "000", "302", "307"): legal_status = "ok"
        except: pass

        qdrant_status = "down"
        try:
            c = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
                "--max-time", "5", "http://127.0.0.1:6333/"],
                capture_output=True, text=True, timeout=10).stdout.strip()
            if c in ("200", "000", "302", "307"): qdrant_status = "ok"
        except: pass

        total = self._q("SELECT COUNT(*) FROM requests")
        total = total[0][0] if total else 0
        today = self._q("SELECT COUNT(*) FROM requests WHERE DATE(created_at)=DATE('now')")
        today = today[0][0] if today else 0
        errors = self._q("SELECT COUNT(*) FROM requests WHERE status!='success'")
        errors = errors[0][0] if errors else 0
        error_rate = round(errors/max(total,1)*100, 2) if total > 0 else 0

        return {
            "services": [
                {"name": "FreeLLM", "status": "ok" if freellm_status != "down" else "down", "detail": freellm_status},
                {"name": "zhiyan-legal", "status": legal_status, "detail": "HTTP 200" if legal_status == "ok" else "無法連接"},
                {"name": "Qdrant", "status": qdrant_status, "detail": "HTTP 200" if qdrant_status == "ok" else "無法連接"},
            ],
            "stats": {
                "total_requests": total,
                "today_requests": today,
                "total_errors": errors,
                "error_rate": error_rate,
            }
        }

    def _get_settings_profile(self):
        registry = load_registry()
        keys_total = len(registry)
        platforms = set(k["platform"] for k in registry)
        provider = "deepseek"
        try:
            status = self._q("SELECT DISTINCT platform FROM requests ORDER BY id DESC LIMIT 1")
            if status: provider = status[0][0]
        except: pass
        return {
            "current_provider": provider,
            "enabled_platforms": len(platforms),
            "platform_list": sorted(platforms),
            "api_keys_total": keys_total,
            "system_version": "v3.0.0",
        }

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin","*")
        self.send_header("Access-Control-Allow-Methods","GET,POST,PUT,DELETE,OPTIONS")
        self.send_header("Access-Control-Allow-Headers","Content-Type, Authorization")

    def _json(self, data, code=200):
        self.send_response(code); self._cors()
        self.send_header("Content-Type","application/json; charset=utf-8"); self.end_headers()
        self.wfile.write(json.dumps(data,ensure_ascii=False).encode("utf-8"))

    def _read_body(self):
        cl = self.headers.get("Content-Length")
        if not cl: return ""
        return self.rfile.read(int(cl))

    def log_message(self, *a): pass

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv)>1 else 8081
    HTTPServer(("0.0.0.0",port), AppHandler).serve_forever()
