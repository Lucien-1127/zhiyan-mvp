#!/usr/bin/env python3
"""智研 RAG 資料庫結構探索"""
import sqlite3

DB_PATH = r"C:\Users\ysga1\zhiyan-mvp\data\law.db"
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

print("=== 所有表格 ===")
cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = cur.fetchall()
for t in tables:
    print(f"  {t[0]}")

print("\n=== laws 表結構 ===")
cur.execute("PRAGMA table_info(laws)")
for col in cur.fetchall():
    print(f"  {col}")

print("\n=== laws 表樣本資料 ===")
cur.execute("SELECT * FROM laws LIMIT 5")
for row in cur.fetchall():
    print(f"  {row}")

print("\n=== laws 總數 ===")
cur.execute("SELECT COUNT(*) FROM laws")
print(f"  {cur.fetchone()[0]}")

print("\n=== laws_fts 結構 ===")
cur.execute("SELECT sql FROM sqlite_master WHERE name='laws_fts'")
print(f"  {cur.fetchone()[0]}")

print("\n=== laws_fts 樣本 ===")
cur.execute("SELECT rowid, * FROM laws_fts LIMIT 3")
for row in cur.fetchall():
    print(f"  {row}")

print("\n=== drugs 表結構 ===")
try:
    cur.execute("PRAGMA table_info(drugs)")
    for col in cur.fetchall():
        print(f"  {col}")
    cur.execute("SELECT * FROM drugs LIMIT 5")
    for row in cur.fetchall():
        print(f"  {row}")
except Exception as e:
    print(f"  錯誤: {e}")

print("\n=== drug_fts 結構 ===")
try:
    cur.execute("SELECT sql FROM sqlite_master WHERE name='drug_fts'")
    print(f"  {cur.fetchone()[0]}")
    cur.execute("SELECT rowid, * FROM drug_fts LIMIT 3")
    for row in cur.fetchall():
        print(f"  {row}")
except Exception as e:
    print(f"  錯誤: {e}")

print("\n=== drug_schedules 表 ===")
try:
    cur.execute("PRAGMA table_info(drug_schedules)")
    for col in cur.fetchall():
        print(f"  {col}")
    cur.execute("SELECT * FROM drug_schedules")
    for row in cur.fetchall():
        print(f"  {row}")
except Exception as e:
    print(f"  錯誤: {e}")

print("\n=== sqlite_sequence ===")
cur.execute("SELECT * FROM sqlite_sequence")
for row in cur.fetchall():
    print(f"  {row}")

conn.close()
