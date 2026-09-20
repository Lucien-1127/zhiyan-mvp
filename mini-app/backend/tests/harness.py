"""智研 miniapp-server 路徑注入修復作業 — 共用隔離測試夾具。

本模組在 tmp 沙箱中啟動「真實的」mini-app/backend/miniapp-server.py，
並用原始 socket 發送 HTTP 請求（可完整控制 request-target，包含未編碼的
`..` 與 NUL 位元組），用於：
  1. 真實驗證 py/path-injection 弱點（alert #1/#2/#3）
  2. 驗證修復後回歸測試

安全保證：所有可讀寫路徑（ENV_DIR / REGISTRY / SECRET_FILE /
PASSWORD_FILE / DB / STATIC_DIR）都會被重新導向到 tmp 沙箱，
**絕不觸碰生產路徑**（~/.hermes/env、/var/www/brand-site、/var/lib/docker）。
"""

import importlib.util
import json
import os
import re
import socket
import sys
import tempfile
import threading
from http.server import HTTPServer

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# 可用 ZHIYAN_SERVER_PATH 指向另一份原始碼（例如修復前的版本），
# 以便在同一棵工作樹上做「修復前／修復後」對照。
SERVER_PATH = os.environ.get(
    "ZHIYAN_SERVER_PATH",
    os.path.join(BACKEND_DIR, "miniapp-server.py"),
)
PLATFORM = "groq"
FAKE_KEY = "gsk_pathinj_dummy_key_0123456789"


def load_server_module():
    """以檔案路徑載入被測模組（檔名含 '-'，無法用 import 陳述式）。"""
    spec = importlib.util.spec_from_file_location(
        "zhiyan_miniapp_server_under_test", SERVER_PATH
    )
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    return mod


def write_text(path, text):
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


class Sandbox:
    """tmp 沙箱：env / static / outside 三個目錄。"""

    def __init__(self):
        self.root = tempfile.mkdtemp(prefix="zhiyan-pathinj-")
        self.env_dir = os.path.join(self.root, "env")
        self.static_dir = os.path.join(self.root, "static")
        self.outside_dir = os.path.join(self.root, "outside")
        for d in (self.env_dir, self.static_dir, self.outside_dir):
            os.makedirs(d)

        # 靜態站台（正常檔案 + 巢狀目錄）
        write_text(os.path.join(self.static_dir, "index.html"),
                   "<!doctype html><title>sandbox-index</title>")
        write_text(os.path.join(self.static_dir, "app.js"), "console.log('sandbox');")
        os.makedirs(os.path.join(self.static_dir, "assets"))
        write_text(os.path.join(self.static_dir, "assets", "main.js"),
                   "console.log('nested');")

        # 沙箱外哨兵檔（供越界探測／越界刪除證明）
        self.sentinel = os.path.join(self.outside_dir, "sentinel.txt")
        write_text(self.sentinel, "SENTINEL-OUTSIDE-STATIC")
        self.outside_victim = os.path.join(self.outside_dir, "victim.env")
        write_text(self.outside_victim, "DO-NOT-DELETE")


def neutralizing_dir(env_dir, platform=PLATFORM):
    """建立可「中和」檔名前綴的目錄，讓 dot-dot 逃逸可被 OS 解析。

    write_env_file 產生的檔名固定是 f"{platform}-{label}.env"，第一個路徑
    元件會被黏成 "<platform>-.."，因此只有在該目錄存在時，後續的 ".." 才會
    真正往上跳。此函式即建立該前置條件，用來證明「路徑運算式確實會逃逸」。
    """
    d = os.path.join(env_dir, f"{platform}-..")
    os.makedirs(d, exist_ok=True)
    return d


def escape_label(target_path, env_dir):
    """算出能讓 write_env_file 寫到 env_dir 之外 target_path 的 label。

    檔名固定為 "{platform}-{label}.env"，label 的第一個 ".." 會被黏進
    "<platform>-.." 這個（需已存在的）目錄元件，因此每一趟「下降再上升」
    會消耗一個 dot-dot：實測 label 內含 N 組 ".." 時，淨上跳層數為 N-2。
    要跳到 env_dir 上方 depth 層處需要 N = depth + 2。
    """
    target_dir = os.path.dirname(os.path.abspath(target_path))
    depth = len(os.path.relpath(target_dir, env_dir).split(os.sep))
    stem = os.path.basename(target_path)
    if stem.endswith(".env"):
        stem = stem[:-4]
    return "../" * (depth + 2) + stem


def resolved_env_target(env_dir, label, platform=PLATFORM):
    """回傳 write_env_file 會實際解析到的絕對路徑（供逃逸判定）。"""
    return os.path.normpath(os.path.join(env_dir, f"{platform}-{label}.env"))


def is_outside_env(env_dir, path):
    env = os.path.realpath(env_dir).rstrip(os.sep)
    p = os.path.realpath(path)
    return p != env and not p.startswith(env + os.sep)


def find_file_outside(env_dir, basename, roots):
    """在 roots 底下尋找 basename（排除 ENV_DIR 內），回傳找到的路徑清單。"""
    hits = []
    env = os.path.realpath(env_dir).rstrip(os.sep)
    for root in roots:
        if not os.path.isdir(root):
            continue
        for dirpath, _dirnames, filenames in os.walk(root):
            rp = os.path.realpath(dirpath).rstrip(os.sep)
            if rp == env or rp.startswith(env + os.sep):
                continue
            if basename in filenames:
                hits.append(os.path.join(dirpath, basename))
    return hits


class ServerHandle:
    """啟動真實伺服器 + 便利的原始 socket 請求工具。"""

    def __init__(self, sandbox):
        self.sb = sandbox
        self.mod = load_server_module()
        m = self.mod
        m.ENV_DIR = sandbox.env_dir
        m.STATIC_DIR = sandbox.static_dir
        m.REGISTRY = os.path.join(sandbox.env_dir, "keys-registry.json")
        m.SECRET_FILE = os.path.join(sandbox.env_dir, ".auth_secret")
        m.PASSWORD_FILE = os.path.join(sandbox.env_dir, ".auth_password")
        m.DB = os.path.join(sandbox.root, "no-such-db.sqlite")
        m._LOGIN_ATTEMPTS.clear()
        self.httpd = HTTPServer(("127.0.0.1", 0), m.AppHandler)
        self.port = self.httpd.server_address[1]
        self._thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self._thread.start()
        self.token = m._generate_token("admin")

    def close(self):
        try:
            self.httpd.shutdown()
        finally:
            self.httpd.server_close()

    def raw(self, request_line, headers=None, body=b"", timeout=8):
        """送原始 HTTP 請求；回傳 (status, body, raw_bytes)。status=None 表示無回應。"""
        hdrs = {"Host": "127.0.0.1", "Connection": "close"}
        hdrs.update(headers or {})
        head = request_line + "\r\n"
        head += "".join(f"{k}: {v}\r\n" for k, v in hdrs.items())
        head += "\r\n"
        payload = head.encode("latin-1") + body
        s = socket.create_connection(("127.0.0.1", self.port), timeout=timeout)
        chunks = []
        try:
            s.sendall(payload)
            while True:
                c = s.recv(65536)
                if not c:
                    break
                chunks.append(c)
        except (ConnectionResetError, BrokenPipeError, socket.timeout):
            pass
        finally:
            s.close()
        raw = b"".join(chunks)
        m = re.match(rb"HTTP/1\.[01] (\d{3})", raw)
        status = int(m.group(1)) if m else None
        _, _, body_bytes = raw.partition(b"\r\n\r\n")
        return status, body_bytes, raw

    def _auth_header(self, token):
        if token is None:
            return {"Authorization": f"Bearer {self.token}"}
        if token is False:
            return {}
        return {"Authorization": f"Bearer {token}"}

    def get(self, target, token=None):
        return self.raw(f"GET {target} HTTP/1.1", self._auth_header(token))

    def post(self, path, obj, token=None):
        body = json.dumps(obj).encode()
        h = self._auth_header(token)
        h["Content-Type"] = "application/json"
        h["Content-Length"] = str(len(body))
        return self.raw(f"POST {path} HTTP/1.1", h, body)

    def api_post(self, path, obj, token=None):
        status, body, _ = self.post(path, obj, token=token)
        try:
            return status, json.loads(body or b"{}")
        except Exception:
            return status, {}

    # ── 便利方法 ────────────────────────────────────────
    def add_key(self, label, key=FAKE_KEY, platform=PLATFORM):
        return self.api_post("/api/keys/add",
                             {"platform": platform, "key": key, "label": label})

    def replace_key(self, kid, label, key="gsk_pathinj_dummy_key_replaced_987654321"):
        return self.api_post("/api/keys/replace",
                             {"id": kid, "key": key, "label": label})

    def delete_key(self, kid):
        return self.api_post("/api/keys/delete", {"id": kid})

    def registry(self):
        path = os.path.join(self.sb.env_dir, "keys-registry.json")
        if not os.path.exists(path):
            return []
        try:
            with open(path, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def poisoned_registry(self, entries):
        """直接佈署一份（可含惡意 label 的）registry 檔，模擬已污染的註冊表。"""
        write_text(os.path.join(self.sb.env_dir, "keys-registry.json"),
                   json.dumps(entries, ensure_ascii=False, indent=2))
