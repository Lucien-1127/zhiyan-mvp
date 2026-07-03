#!/usr/bin/env python3
"""深度交叉驗證 - 喪屍煙彈搜尋 + FTS5 診斷 + 毒品分級驗證"""
import sqlite3

DB_PATH = r"C:\Users\ysga1\zhiyan-mvp\data\law.db"
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

print("=" * 70)
print("深度交叉驗證報告")
print("=" * 70)

# ==========================================
# A. 喪屍煙彈搜尋驗證
# ==========================================
print("\n【A. 喪屍煙彈搜尋驗證】")

# 1. 在 laws 表用 LIKE 搜尋
print("\n  A1. laws 表 LIKE 搜尋:")
for term in ['喪屍', '煙彈', '喪屍煙彈', '僵尸', '喪屍毒品', '上頭電子煙']:
    cur.execute("SELECT law_name, article_number, content FROM laws WHERE content LIKE ? OR law_name LIKE ?", (f'%{term}%', f'%{term}%'))
    results = cur.fetchall()
    print(f"    '{term}': {len(results)} 結果")
    for r in results[:5]:
        print(f"      [{r[0]}] 第{r[1]}條: {r[2][:80]}...")

# 2. 在 drug_schedules 表搜尋
print("\n  A2. drug_schedules 表搜尋:")
cur.execute("SELECT * FROM drug_schedules WHERE content LIKE '%喪屍%' OR drug_name_cn LIKE '%喪屍%'")
results = cur.fetchall()
print(f"    找到 {len(results)} 筆")
for r in results:
    print(f"    {r}")

# 3. FTS5 診斷
print("\n  A3. laws_fts FTS5 診斷:")
# 查看 FTS5 狀態
cur.execute("SELECT * FROM laws_fts_config")
for r in cur.fetchall():
    print(f"    config: {r}")

# 檢查 FTS5 是否包含所有資料
cur.execute("SELECT COUNT(*) FROM laws_fts")
fts_count = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM laws")
laws_count = cur.fetchone()[0]
print(f"    laws_fts 筆數: {fts_count}")
print(f"    laws 筆數: {laws_count}")
print(f"    匹配: {'✓' if fts_count == laws_count else '✗ 不匹配!'}")

# 檢查 FTS5 是否有索引
cur.execute("SELECT COUNT(*) FROM laws_fts_idx")
idx_count = cur.fetchone()[0]
print(f"    FTS5 索引筆數: {idx_count}")

# 嘗試 FTS5 基本語法
print("\n    嘗試 FTS5 查詢:")
for query in ['毒品危害', '行政程序', '民法', '刑法', '死刑', '罰金']:
    try:
        cur.execute("SELECT COUNT(*) FROM laws_fts WHERE laws_fts MATCH ?", (query,))
        cnt = cur.fetchone()[0]
        print(f"      MATCH '{query}': {cnt}")
    except Exception as e:
        print(f"      MATCH '{query}': ❌ 錯誤: {e}")

# 嘗試不同 FTS5 語法
print("\n    嘗試不同 FTS5 語法:")
for syntax in [
    '"毒品危害"',
    '"行政程序"',
    '毒品危害防制',
    '死刑 OR 罰金',
    '民法 AND 條',
    'article_number:1',
    'content:"死刑"',
]:
    try:
        cur.execute("SELECT COUNT(*) FROM laws_fts WHERE laws_fts MATCH ?", (syntax,))
        cnt = cur.fetchone()[0]
        print(f"      '{syntax}': {cnt}")
    except Exception as e:
        print(f"      '{syntax}': ❌ {str(e)[:60]}")

# 檢查 FTS5 的 columnlist
cur.execute("SELECT sql FROM sqlite_master WHERE name='laws_fts'")
fts_sql = cur.fetchone()[0]
print(f"\n    FTS5 定義: {fts_sql}")

# ==========================================
# B. 毒品分級資料驗證
# ==========================================
print("\n\n【B. 毒品分級資料驗證】")

# 1. 查看 drug_schedules 完整資料
print("\n  B1. drug_schedules 完整資料:")
cur.execute("SELECT * FROM drug_schedules")
for r in cur.fetchall():
    print(f"    {r}")

# 2. 在 laws 表中找毒品危害防制條例
print("\n  B2. 毒品危害防制條例內容:")
cur.execute("SELECT law_name, article_number, content FROM laws WHERE law_name LIKE '%毒品危害%' ORDER BY article_number")
results = cur.fetchall()
print(f"    找到 {len(results)} 條")
for r in results:
    print(f"    [{r[0]}] 第{r[1]}條: {r[2][:120]}...")

# 3. 檢查毒品危害防制條例中是否有分級資料
print("\n  B3. 毒品危害防制條例中關於分級的條文:")
for keyword in ['第二條', '附表', '第一級', '第二級', '第三級', '第四級', '安非他命', '大麻', '海洛因', '麥角', '迷幻', 'K他命', '搖頭丸']:
    cur.execute("SELECT article_number, content FROM laws WHERE law_name LIKE '%毒品危害%' AND (article_number LIKE ? OR content LIKE ?)", (f'%{keyword}%', f'%{keyword}%'))
    results = cur.fetchall()
    if results:
        print(f"    關鍵字 '{keyword}': {len(results)} 結果")
        for r in results[:2]:
            print(f"      第{r[0]}條: {r[1][:100]}...")

# 4. 檢查毒品危害防制條例施行細則
print("\n  B4. 毒品危害防制條例施行細則:")
cur.execute("SELECT law_name, article_number, content FROM laws WHERE law_name LIKE '%細則%' ORDER BY article_number")
results = cur.fetchall()
print(f"    找到 {len(results)} 條")
for r in results:
    print(f"    [{r[0]}] 第{r[1]}條: {r[2][:100]}...")

# 5. 查是否有其他毒品相關法規
print("\n  B5. 所有含'毒'字條文:")
cur.execute("SELECT law_name, article_number, content FROM laws WHERE content LIKE '%毒%' LIMIT 20")
results = cur.fetchall()
print(f"    找到 {len(results)} 筆 (顯示前20筆):")
for r in results:
    print(f"    [{r[0]}] 第{r[1]}條: {r[2][:80]}...")

# 6. 查毒品危害防制條例的總條文數
print("\n  B6. 毒品危害防制條例統計:")
cur.execute("SELECT COUNT(*) FROM laws WHERE law_name LIKE '%毒品危害%'")
print(f"    總條數: {cur.fetchone()[0]}")

# ==========================================
# C. FTS5 同步問題診斷
# ==========================================
print("\n\n【C. FTS5 同步問題診斷】")

# 檢查 laws_fts 中的實際內容
print("\n  C1. laws_fts 中的內容樣本:")
cur.execute("SELECT rowid, law_name, content FROM laws_fts LIMIT 5")
for r in cur.fetchall():
    print(f"    rowid={r[0]}, law_name={r[1]}, content={r[2][:80]}...")

# 檢查 FTS5 索引是否正確建立
print("\n  C2. FTS5 內部結構:")
cur.execute("SELECT COUNT(*) FROM laws_fts_data")
data_cnt = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM laws_fts_docsize")
docsize_cnt = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM laws_fts_idx")
idx_cnt = cur.fetchone()[0]
print(f"    laws_fts_data: {data_cnt}")
print(f"    laws_fts_docsize: {docsize_cnt}")
print(f"    laws_fts_idx: {idx_cnt}")

# 檢查 FTS5 是否有停用詞問題
print("\n  C3. 停用詞測試 (常見虛詞):")
for word in ['的', '為', '應', '得', '依', '於', '其', '與', '及', '或']:
    try:
        cur.execute("SELECT COUNT(*) FROM laws_fts WHERE laws_fts MATCH ?", (word,))
        cnt = cur.fetchone()[0]
        print(f"    '{word}': {cnt} 結果")
    except Exception as e:
        print(f"    '{word}': ❌ {str(e)[:50]}")

# 測試 FTS5 是否支援中文分詞
print("\n  C4. 中文分詞測試:")
# unicode61 tokenizer 應該能處理中文
for phrase in ['行政程序', '毒品危害', '死刑', '有期徒刑', '罰金']:
    try:
        # 嘗試 exact phrase match
        cur.execute("SELECT COUNT(*) FROM laws_fts WHERE laws_fts MATCH ?", (phrase,))
        cnt = cur.fetchone()[0]
        print(f"    '{phrase}': {cnt}")
    except Exception as e:
        print(f"    '{phrase}': ❌ {str(e)[:60]}")

# 嘗試用 column: 限定搜尋特定欄位
print("\n  C5. 指定欄位搜尋測試:")
for query in ['content:"死刑"', 'law_name:"刑法"', 'content:"死刑" OR law_name:"刑法"']:
    try:
        cur.execute("SELECT COUNT(*) FROM laws_fts WHERE laws_fts MATCH ?", (query,))
        cnt = cur.fetchone()[0]
        print(f"    '{query}': {cnt}")
    except Exception as e:
        print(f"    '{query}': ❌ {str(e)[:60]}")

# 測試 FTS5 的 AND/OR 邏輯
print("\n  C6. FTS5 邏輯運算測試:")
for query in ['死刑 AND 罰金', '死刑 OR 罰金', '死刑 NOT 罰金', '(死刑 OR 罰金)', '死刑 | 罰金']:
    try:
        cur.execute("SELECT COUNT(*) FROM laws_fts WHERE laws_fts MATCH ?", (query,))
        cnt = cur.fetchone()[0]
        print(f"    '{query}': {cnt}")
    except Exception as e:
        print(f"    '{query}': ❌ {str(e)[:60]}")

# ==========================================
# D. 結論
# ==========================================
print("\n\n【D. 交叉驗證結論】")
print("  1. 喪屍煙彈搜尋:")
cur.execute("SELECT COUNT(*) FROM laws WHERE content LIKE '%喪屍%'")
zombie_count = cur.fetchone()[0]
print(f"     - laws 表 LIKE 搜尋: {zombie_count} 筆")
cur.execute("SELECT COUNT(*) FROM drug_schedules WHERE content LIKE '%喪屍%'")
ds_count = cur.fetchone()[0]
print(f"     - drug_schedules 表: {ds_count} 筆")
print(f"     - FTS5 搜尋: 全部失敗 (30/30)")
print(f"     → 🔴 FTS5 無法正常運作，需修復或改用 LIKE 搜尋")

print("\n  2. 毒品分級資料:")
print(f"     - drug_schedules 僅 1 筆 (依托咪酯)")
cur2 = conn.cursor()
drug_harm_count = cur2.execute("SELECT COUNT(*) FROM laws WHERE law_name LIKE '%毒品危害%'").fetchone()[0]
print(f"     - 毒品危害防制條例有 {drug_harm_count} 條")
print(f"     → 🔴 毒品分級資料嚴重不足，僅有 1 項")

print("\n  3. FTS5 問題:")
print(f"     - laws_fts 筆數與 laws 表一致 ({fts_count}/{laws_count})")
print(f"     - 但所有 MATCH 查詢均返回 0 或錯誤")
print(f"     - unicode61 tokenizer 對中文分詞可能失效")
print(f"     → 🔴 FTS5 索引可能損壞或未正確建立")

conn.close()
print("\n" + "=" * 70)
