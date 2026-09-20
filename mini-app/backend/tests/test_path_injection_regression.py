#!/usr/bin/env python3
"""回歸測試：py/path-injection (GitHub code-scanning alert #1/#2/#3)。

對應三條告警：
  alert #1  mini-app/backend/miniapp-server.py:150  open(filepath,"w")   ← write_env_file
  alert #2  mini-app/backend/miniapp-server.py:153  os.chmod(filepath)   ← write_env_file
  alert #3  mini-app/backend/miniapp-server.py:220  os.path.isfile(full) ← do_GET 靜態檔

測試全部走真實 HTTP（原始 socket）與真實檔案系統，並在 tmp 沙箱內執行。

執行：
    python3 -m unittest discover -s mini-app/backend/tests -p 'test_*.py' -v
"""

import os
import shutil
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import harness  # noqa: E402


class PathInjectionTestBase(unittest.TestCase):
    def setUp(self):
        self.sb = harness.Sandbox()
        self.srv = harness.ServerHandle(self.sb)
        self.addCleanup(self._teardown)

    def _teardown(self):
        try:
            self.srv.close()
        finally:
            shutil.rmtree(self.sb.root, ignore_errors=True)

    # ── 輔助斷言 ────────────────────────────────────────────
    def assert_not_exist_outside_env(self):
        """ENV_DIR 之外不得出現 .env 檔（用沙箱外的哨兵目錄判斷）。"""
        self.assertFalse(
            os.path.exists(self.sb.outside_victim),
            f"沙箱外檔案被刪除：{self.sb.outside_victim}",
        )


# ══════════════════════════════════════════════════════════════
# alert #3：靜態檔案路徑（do_GET）
# ══════════════════════════════════════════════════════════════
class StaticPathInjectionTests(PathInjectionTestBase):

    def test_handler_never_stats_outside_static_dir(self):
        """存在性 oracle：越界且存在 vs 越界且不存在，回應必須一致。"""
        existing, _, _ = self.srv.get("/../outside/sentinel.txt")
        missing, _, _ = self.srv.get("/../outside/missing_zzz.txt")
        self.assertEqual(
            existing, missing,
            f"可區分 STATIC_DIR 外檔案是否存在（{existing} vs {missing}）→ 存在性 oracle",
        )

    def test_handler_does_not_probe_system_files(self):
        """對作業系統檔案（/etc/passwd）不得產生可觀察差異。"""
        real_sys, _, _ = self.srv.get("/../../../../etc/passwd")
        fake_sys, _, _ = self.srv.get("/../../../../etc/zhiyan_no_such_zzz")
        self.assertEqual(
            real_sys, fake_sys,
            f"可探測 /etc/passwd 是否存在（{real_sys} vs {fake_sys}）",
        )

    def test_nul_byte_in_path_does_not_crash_server(self):
        """路徑含 NUL 不得造成未捕捉例外（連線中斷 / 無回應）。"""
        status, _, _ = self.srv.raw(
            "GET /a\x00b.html HTTP/1.1",
            {"Host": "127.0.0.1", "Connection": "close",
             "Authorization": f"Bearer {self.srv.token}"},
        )
        self.assertIsNotNone(status, "NUL 位元組造成伺服器未回應（未處理例外）")
        self.assertIn(status, (200, 400),
                      f"NUL 路徑回應異常：HTTP {status}")

    def test_unauthenticated_static_request_still_401(self):
        status, _, _ = self.srv.get("/index.html", token=False)
        self.assertEqual(status, 401, "未帶 token 的靜態請求仍須 401")

    def test_symlink_inside_static_dir_cannot_leak_outside_file(self):
        """防禦深度：STATIC_DIR 內的 symlink 指向外部檔案時不得外洩內容。"""
        link = os.path.join(self.sb.static_dir, "leak.txt")
        try:
            os.symlink(self.sb.sentinel, link)
        except (OSError, NotImplementedError):
            self.skipTest("此環境不支援 symlink")
        status, body, _ = self.srv.get("/leak.txt")
        self.assertNotIn(
            b"SENTINEL-OUTSIDE-STATIC", body,
            f"symlink 造成 STATIC_DIR 外檔案內容外洩（HTTP {status}）",
        )

    def test_normal_static_serving_unaffected(self):
        """功能不回歸：正常檔案、巢狀路徑、未知路徑 fallback。"""
        for target, needle in (
            ("/index.html", b"sandbox-index"),
            ("/app.js", b"sandbox"),
            ("/assets/main.js", b"nested"),
        ):
            status, body, _ = self.srv.get(target)
            self.assertEqual(status, 200, f"{target} 應回 200")
            self.assertIn(needle, body, f"{target} 內容不符")
        status, body, _ = self.srv.get("/no-such-page.html")
        self.assertEqual(status, 200, "未知路徑應 fallback index.html")
        self.assertIn(b"sandbox-index", body)


# ══════════════════════════════════════════════════════════════
# alert #1 / #2：金鑰 env 檔路徑（write_env_file 的 open / chmod）
# ══════════════════════════════════════════════════════════════
class EnvFilePathInjectionTests(PathInjectionTestBase):

    TRAVERSAL_LABELS = [
        "../../../../tmp/zhiyan_pathinj_probe",
        "../escape",
        "..",
        "a/../../b",
        "sub/dir/name",
        "/etc/passwd",
        "\\..\\..\\windows\\system32\\evil",
        "..%2f..%2fescape",
        "x\x00y",
        "A" * 300,
    ]

    def test_add_key_rejects_unsafe_labels(self):
        """alert #1/#2：含分隔符／dot-dot／NUL／超長 label 一律 400。"""
        for label in self.TRAVERSAL_LABELS:
            with self.subTest(label=label):
                status, body = self.srv.add_key(label)
                self.assertEqual(
                    status, 400,
                    f"label={label!r} 竟被接受 (HTTP {status}, body={body})",
                )
                self.assertIn("error", body)

    def test_add_key_does_not_write_outside_env_dir(self):
        """越界寫入不得發生：惡意 label 之後 ENV_DIR 外不得出現新檔。"""
        before = set(os.listdir(self.sb.outside_dir))
        for label in self.TRAVERSAL_LABELS:
            self.srv.add_key(label)
        after = set(os.listdir(self.sb.outside_dir))
        self.assertEqual(before, after, f"沙箱外目錄出現新檔：{after - before}")

    def test_add_key_cannot_escape_even_when_prefix_is_neutralizable(self):
        """即使 ENV_DIR 下存在 'groq-..' 目錄（中和檔名前綴），仍不得逃逸。"""
        harness.neutralizing_dir(self.sb.env_dir)
        import tempfile
        escaped = tempfile.mktemp(prefix="zhiyan_pathinj_escape_", suffix=".env")
        self.addCleanup(lambda: os.path.exists(escaped) and os.remove(escaped))
        label = harness.escape_label(escaped, self.sb.env_dir)
        status, body = self.srv.add_key(label)
        self.assertFalse(
            os.path.exists(escaped),
            f"檔案被寫入 ENV_DIR 之外：{escaped}（HTTP {status}, body={body}）",
        )

    def test_replace_key_rejects_unsafe_label(self):
        """alert #1：/api/keys/replace 的 new_label 同樣可污染路徑。"""
        status, body = self.srv.add_key("legit-label")
        self.assertEqual(status, 200, f"正常新增應成功: {body}")
        kid = body.get("id")
        for label in ("../../../../tmp/zhiyan_pathinj_replace", "a/b", ".."):
            with self.subTest(label=label):
                status, resp = self.srv.replace_key(kid, label)
                self.assertEqual(
                    status, 400,
                    f"replace label={label!r} 竟被接受 (HTTP {status}, {resp})",
                )

    def test_delete_refuses_unsafe_label_from_poisoned_registry(self):
        """alert #1/#2：registry 被寫入惡意 label 時，delete 不得刪 ENV_DIR 外的檔。"""
        import tempfile
        harness.neutralizing_dir(self.sb.env_dir)
        victim = tempfile.mktemp(prefix="zhiyan_pathinj_victim_", suffix=".env")
        harness.write_text(victim, "DO-NOT-DELETE")
        self.addCleanup(lambda: os.path.exists(victim) and os.remove(victim))
        poisoned_label = harness.escape_label(victim, self.sb.env_dir)
        self.srv.poisoned_registry([{
            "id": "deadbeef", "platform": harness.PLATFORM, "label": poisoned_label,
            "prefix": "gsk_...", "added_at": "2026-01-01T00:00:00",
            "env_file": "x.env", "tested": False, "valid": None,
        }])
        status, body = self.srv.delete_key("deadbeef")
        self.assertTrue(
            os.path.exists(victim),
            f"ENV_DIR 外的檔案被刪除：{victim}（HTTP {status}, {body}）",
        )

    def test_legit_labels_still_work(self):
        """功能不回歸：一般標籤（含中文、空白、括號）仍可新增/取代/刪除。"""
        for i, label in enumerate(["groq-main", "我的 Groq 金鑰", "team (prod) key_1"]):
            with self.subTest(label=label):
                key = f"gsk_pathinj_legit_{i}_0123456789"
                status, body = self.srv.add_key(label, key=key)
                self.assertEqual(status, 200, f"label={label!r} 應可新增: {body}")
                self.assertEqual(body.get("label"), label)
                self.assertEqual(
                    body.get("env_file"), f"{harness.PLATFORM}-{label}.env"
                )
                # 檔案必須落在 ENV_DIR 內且權限 0600
                p = os.path.join(self.sb.env_dir, f"{harness.PLATFORM}-{label}.env")
                self.assertTrue(os.path.isfile(p), f"env 檔未建立：{p}")
                self.assertEqual(os.stat(p).st_mode & 0o777, 0o600)
                status, _ = self.srv.delete_key(body["id"])
                self.assertEqual(status, 200, "正常刪除應成功")
                self.assertFalse(os.path.exists(p))

    def test_empty_label_uses_safe_generated_name(self):
        status, body = self.srv.add_key("")
        self.assertEqual(status, 200, body)
        self.assertRegex(body.get("label"), r"^groq-\d+$")
        reg = self.srv.registry()
        self.assertTrue(reg and reg[0]["env_file"].startswith("groq-"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
