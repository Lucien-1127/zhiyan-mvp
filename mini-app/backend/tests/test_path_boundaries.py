"""Additional path and credential-preservation regressions; sandbox only."""
import os
import unittest
from pathlib import Path

from test_path_injection_regression import PathInjectionTestBase


class AdditionalPathChecks(PathInjectionTestBase):
    def test_encoded_symlink_does_not_read_outside(self):
        os.symlink(self.sb.sentinel, os.path.join(self.sb.static_dir, "leak.txt"))
        _status, body, _ = self.srv.get("/%6ceak.txt")
        self.assertNotIn(b"SENTINEL-OUTSIDE-STATIC", body)

    def test_fallback_index_symlink_does_not_read_outside(self):
        index = Path(self.sb.static_dir) / "index.html"
        index.unlink()
        index.symlink_to(self.sb.sentinel)
        _status, body, _ = self.srv.get("/unknown-route")
        self.assertNotIn(b"SENTINEL-OUTSIDE-STATIC", body)

    def test_failed_replace_preserves_original_key(self):
        status, record = self.srv.add_key("original")
        self.assertEqual(status, 200)
        original = Path(self.sb.env_dir) / "groq-original.env"
        before = original.read_bytes()
        (Path(self.sb.env_dir) / "groq-unsafe.env").symlink_to(self.sb.sentinel)
        status, _body = self.srv.replace_key(record["id"], "unsafe")
        self.assertEqual(status, 400)
        self.assertTrue(original.exists(), "Rejected replacement deleted the original key")
        self.assertEqual(original.read_bytes(), before)


if __name__ == "__main__":
    unittest.main()
