#!/usr/bin/env python3
"""智研 RAG 資料庫完整審計 - 修正版"""
import sqlite3
import json
from collections import Counter, defaultdict

DB_PATH = r"C:\Users\ysga1\zhiyan-mvp\data\law.db"
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

print("=" * 70)
print("智研 RAG 資料庫審計報告")
print("=" * 70)

# ============================================================
# 1. 法規分組統計（按 law_name + law_code 分組）
# ============================================================
print("\n【1. 法規分組統計】")
cur.execute("""
    SELECT law_code, law_name, COUNT(*) as article_count, MIN(version_date) as first_ver, MAX(version_date) as last_ver
    FROM laws
    GROUP BY law_code, law_name
    ORDER BY article_count DESC
""")
groups = cur.fetchall()
total_articles = 0
print(f"  {'法規名稱':<30s} {'條文數':>6s} {'版本日期'}")
print(f"  {'─'*30} {'─'*6} {'─'*12}")
law_names_set = set()
for g in groups:
    law_code, law_name, cnt, first_v, last_v = g
    law_names_set.add(law_name)
    total_articles += cnt
    print(f"  {law_name:<30s} {cnt:>6d} {first_v}-{last_v}")

print(f"\n  法規種類數: {len(groups)} 種")
print(f"  總條文數: {total_articles} 條")

# 條文數分佈
counts = [g[2] for g in groups]
print(f"  條文數範圍: {min(counts)} ~ {max(counts)}")
print(f"  平均條文數: {sum(counts)/len(counts):.1f}")

# ============================================================
# 2. 版本日期分析
# ============================================================
print("\n【2. 版本日期分析】")
cur.execute("SELECT DISTINCT version_date FROM laws ORDER BY version_date")
dates = [r[0] for r in cur.fetchall()]
print(f"  不同版本日期: {len(dates)} 個")
for d in dates:
    cur.execute("SELECT COUNT(*) FROM laws WHERE version_date=?", (d,))
    cnt = cur.fetchone()[0]
    print(f"    {d}: {cnt} 條")

# ============================================================
# 3. drug_schedules 完整分析
# ============================================================
print("\n【3. drug_schedules 表】")
cur.execute("SELECT * FROM drug_schedules")
sched_rows = cur.fetchall()
print(f"  總筆數: {len(sched_rows)}")
for row in sched_rows:
    print(f"  {row}")

# drug_fts 搜尋測試
print("\n  drug_fts 搜尋測試:")
for term in ['喪屍', '煙彈', 'etomidate', '依托咪酯', '毒品', '第一級']:
    try:
        cur.execute("SELECT * FROM drug_fts WHERE drug_fts MATCH ?", (term,))
        results = cur.fetchall()
        print(f"    '{term}': {len(results)} 結果")
        for r in results:
            print(f"      {r}")
    except Exception as e:
        print(f"    '{term}': 錯誤 {e}")

# ============================================================
# 4. FTS5 搜尋品質測試
# ============================================================
print("\n【4. FTS5 全文檢索品質測試】")

test_queries = [
    ("喪屍煙彈", "毒品俗名"),
    ("依托咪酯", "毒品學名"),
    ("etomidate", "毒品英文名"),
    ("第一級毒品", "分級"),
    ("安非他命", "常見毒品"),
    ("甲基安非他命", "具體毒品种類"),
    ("槍砲", "武器"),
    ("刀械", "武器"),
    ("毒品危害防制條例", "法規名稱"),
    ("死刑", "刑責"),
    ("無期徒刑", "刑責"),
    ("罰金", "罰則"),
    ("持有", "行為"),
    ("販賣", "行為"),
    ("運輸", "行為"),
    ("施用", "行為"),
    ("迷幻蘑菇", "迷幻藥物"),
    ("K他命", "俗名"),
    ("大麻", "植物毒品"),
    ("毒駕", "新興議題"),
    ("酒精濃度", "駕車"),
    ("酒駕", "駕車"),
    ("行政程序法", "行政法規"),
    ("個人資料保護法", "資安法規"),
    ("資通安全管理法", "資安法規"),
    ("刑法", "基本法規"),
    ("民法", "基本法規"),
    ("證券交易法", "金融法規"),
    ("公司法", "商業法規"),
    ("勞動基準法", "勞基"),
]

search_results = []
for query, desc in test_queries:
    fts_count = 0
    fts_sample = ""
    try:
        cur.execute("""
            SELECT law_name, article_number, content 
            FROM laws_fts 
            WHERE laws_fts MATCH ? 
            LIMIT 3
        """, (query,))
        results = cur.fetchall()
        fts_count = len(results)
        if results:
            fts_sample = results[0][0] + " 第" + results[0][1] + "條"
    except Exception as e:
        fts_count = -1  # 搜尋失敗
    
    # LIKE 比較
    like_count = 0
    try:
        cur.execute("SELECT COUNT(*) FROM laws WHERE content LIKE ?", (f'%{query}%',))
        like_count = cur.fetchone()[0]
    except:
        pass
    
    status = "✓" if fts_count > 0 else ("~" if like_count > 0 else "✗")
    print(f"  {status} [{desc}] '{query}': FTS5={fts_count}, LIKE={like_count}", end="")
    if fts_sample:
        print(f"  (範例: {fts_sample[:40]})", end="")
    print()
    search_results.append({
        'query': query, 'desc': desc, 'fts': fts_count, 'like': like_count,
        'sample': fts_sample, 'status': status
    })

# FTS5 vs LIKE 比較統計
fts_only = sum(1 for r in search_results if r['fts'] > 0 and r['like'] == 0)
both = sum(1 for r in search_results if r['fts'] > 0 and r['like'] > 0)
neither = sum(1 for r in search_results if r['fts'] == 0 and r['like'] == 0)
fts_fail = sum(1 for r in search_results if r['fts'] == -1)

print(f"\n  FTS5 vs LIKE 比較:")
print(f"    兩者都有結果: {both}")
print(f"    FTS5獨有: {fts_only}")
print(f"    都沒有結果: {neither}")
print(f"    FTS5搜尋失敗: {fts_fail}")

# ============================================================
# 5. 資料品質檢查
# ============================================================
print("\n【5. 資料品質檢查】")

# 空內容
cur.execute("SELECT COUNT(*) FROM laws WHERE content IS NULL OR content = ''")
null_content = cur.fetchone()[0]
print(f"  空內容條文: {null_content}")

# 短內容
cur.execute("SELECT COUNT(*) FROM laws WHERE LENGTH(content) < 30 AND content IS NOT NULL")
short_content = cur.fetchone()[0]
print(f"  短內容(<30字): {short_content}")

# 條文編號檢查
cur.execute("SELECT COUNT(*) FROM laws WHERE article_number IS NULL OR article_number = ''")
null_article = cur.fetchone()[0]
print(f"  無條文編號: {null_article}")

# 版本日期檢查
cur.execute("SELECT COUNT(*) FROM laws WHERE version_date IS NULL OR version_date = ''")
null_version = cur.fetchone()[0]
print(f"  無版本日期: {null_version}")

# 重複內容
cur.execute("""
    SELECT content, COUNT(*) as cnt 
    FROM laws 
    GROUP BY content 
    HAVING cnt > 1 
    LIMIT 10
""")
duplicates = cur.fetchall()
print(f"  完全重複條文: {len(duplicates)} 組")
if duplicates:
    for d in duplicates[:3]:
        print(f"    重複 {d[1]} 次: {d[0][:60]}...")

# 特殊字符檢查
cur.execute("SELECT COUNT(*) FROM laws WHERE content LIKE '%\\x00%'")
null_bytes = cur.fetchone()[0]
print(f"  含 Null Byte: {null_bytes}")

# ============================================================
# 6. 條文內容長度分佈
# ============================================================
print("\n【6. 條文內容長度分佈】")
cur.execute("SELECT MIN(LENGTH(content)), MAX(LENGTH(content)), AVG(LENGTH(content)) FROM laws WHERE content IS NOT NULL AND content != ''")
mins, maxs, avgs = cur.fetchone()
print(f"  最短: {mins} 字")
print(f"  最長: {maxs} 字")
print(f"  平均: {avgs:.0f} 字")

cur.execute("SELECT COUNT(*) FROM laws WHERE LENGTH(content) BETWEEN 0 AND 50")
c0_50 = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM laws WHERE LENGTH(content) BETWEEN 51 AND 200")
c51_200 = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM laws WHERE LENGTH(content) BETWEEN 201 AND 500")
c201_500 = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM laws WHERE LENGTH(content) > 500")
c500_plus = cur.fetchone()[0]
print(f"  0-50字: {c0_50} 條")
print(f"  51-200字: {c51_200} 條")
print(f"  201-500字: {c201_500} 條")
print(f"  500字+: {c500_plus} 條")

# ============================================================
# 7. 法規覆蓋率評估
# ============================================================
print("\n【7. 法規覆蓋率評估】")
# 台灣重要法規清單
important_laws = [
    "刑法", "刑法施行條例",
    "刑事訴訟法", "簡易訴訟程序法",
    "民事訴訟法",
    "民法", "民法債編", "民法物權編",
    "公司法",
    "證券交易法",
    "商業會計法",
    "發票管理條例",
    "發展觀光條例",
    "旅遊業管理規則",
    "個人資料保護法",
    "資通安全管理法",
    "電子簽章法",
    "勞動基準法",
    "性別工作平等法",
    "職業安全衛生法",
    "消費者保護法",
    "公平交易法",
    "智慧財產相關法律",
    "環境影響評估法",
    "廢棄物清理法",
    "空氣污染防制法",
    "水污染防治法",
    "土壤及地下水污染整治法",
    "噪音管制法",
    "環境保護法",
    "毒性及關注物質管理法",
    "海洋污染防治法",
    "自然公園法",
    "野生動物保育法",
    "動物保护法",
    "動物防疫法",
    "傳染病防治法",
    "食品管理法",
    "食品添加物管理辦法",
    "農藥管理法",
    "肥料管理法",
    "農業發展法",
    "漁業法",
    "漁港法",
    "森林法",
    "礦業法",
    "水利法",
    "水法",
    "氣象法",
    "國土計畫法",
    "區域計畫法",
    "都市計畫法",
    "建築法",
    "公寓大廈管理條例",
    "地政士法",
    "不動產經紀業管理條例",
    "保險法",
    "銀行法",
    "金融控股公司法",
    "票據法",
    "匯票法",
    "本票法",
    "海商法",
    "航空法",
    "鐵路法",
    "公路法",
    "船舶法",
    "港務法",
    "稅捐稽徵法",
    "所得稅法",
    "營業稅法",
    "遺產及贈與稅法",
    "房屋稅條例",
    "地價稅法",
    "使用牌照稅法",
    "印花税條例",
    "娛樂稅法",
    "平均地權條例",
    "土地稅法",
    "教育人員條例",
    "教師法",
    "補習及進修教育法",
    "特殊教育法",
    "高級中等教育法",
    "大學法",
    "專科學校法",
    "學術榮譽獎章設置條例",
    "圖書館法",
    "文化資產保存法",
    "藝文發展條例",
    "文創產業發展條例",
    "博物館法",
    "國家文化藝術基金會設置條例",
    "社會救助法",
    "低收入戶救助條例",
    "老人福利法",
    "兒童及少年福利與權益保障法",
    "婦女權益促進法",
    "身心障礙者權益保障法",
    "家庭暴力防治法",
    "性侵害犯罪防治法",
    "自殺防治法",
    "精神衛生法",
    "長照服務法",
    "原住民基本法",
    "原住民族土地及海域法",
    "客家基本法",
    "新住民發展條例",
    "移民法",
    "入出國及移民法",
    "難民地位法",
    "政治庇護法",
    "宗教事務管理條例",
    "寺廟管理條例",
    "祭祀公業條例",
    "自由時代相關法律",
    "集會遊行法",
    "示威法",
    "罷免法",
    "公民投票法",
    "公職人員選舉罷免法",
    "政黨法",
    "社團法人法",
    "人民團體法",
    "基金會管理條例",
    "財團法人法",
    "合作社法",
    "海關法",
    "貿易法",
    "出口管制法",
    "進口管理條例",
    "自由經濟示範區條例",
    "科學工業園區設置管理條例",
    "產業創新條例",
    "中小企業發展條例",
    "發展民間參與交通建設條例",
    "獎勵民間參與交通建設條例",
    "公共建設永續條例",
    "國家科學及技術委員會組織法",
    "科技基本法",
    "技術服務法",
    "標準法",
    "檢驗法",
    "認證法",
    "计量法",
    "勞工保險條例",
    "全民健康保險法",
    "國民年金法",
    "軍人保險法",
    "公教人員保險法",
    "教師保險法",
    "退撫法",
    "軍公教人員退休法",
    "社會住宅推動條例",
    "居住正義法",
    "住宅法",
    "都市更新條例",
    "老舊建築物重建條例",
    "危老建築條例",
    "災害防救法",
    "消防法",
    "建築技術規則",
    "食品衛生管理法",
    "農產品市場法",
    "政府資訊公開法",
    "行政程序法",
    "訴願法",
    "國家賠償法",
    "公務員服務法",
    "公務員懲戒法",
    "貪污治罪條例",
    "政治獻金法",
    "利益衝突回避法",
    "公職人員財產申報法",
    "司法改革法",
    "法官法",
    "檢察官法",
    "律師法",
    "會計法",
    "審計法",
    "預算法",
    "決算法",
    "地方制度法",
    "自治法",
    "鄉鎮市區法",
    "縣市政府組織法",
    "議會自治條例",
    "民意代表法",
    "交通相關法律",
    "大眾運輸條例",
    "航空器運算法",
    "無線電通訊法",
    "電信法",
    "廣電法",
    "廣播電視法",
    "衛星廣播電視法",
    "網路服務法",
    "網路中立法",
    "數位發展法",
    "數位轉型法",
    "數位治理法",
    "政府數位服務法",
    "電子票證法",
    "電子支付法",
    "金融科技法",
    "加密貨幣法",
    "數位貨幣法",
    "央行數位貨幣法",
    "穩定幣法",
    "區塊鏈法",
    "人工智慧法",
    "AI法",
    "機器人法",
    "無人機法",
    "自動駕駛法",
    "智慧醫療法",
    "遠距醫療法",
    "基因編輯法",
    "生殖醫學法",
    "器官移植法",
    "人體試驗法",
    "生物醫學研究法",
    "倫理審查法",
    "臨床試驗法",
    "藥物管理法",
    "藥事法",
    "醫療法",
    "醫師法",
    "護理法",
    "助產士法",
    "牙醫助理法",
    "物理治療法",
    "職能治療法",
    "放射師法",
    "醫事檢驗師法",
    "心理師法",
    "諮商師法",
    "營養師法",
    "聽力師法",
    "呼吸治療法",
    "獸醫師法",
    "動物醫師法",
    "畜牧法",
    "畜產法",
    "乳品管理法",
    "肉品管理法",
    "蛋品管理法",
    "水產品管理法",
    "食品加工法",
    "食品添加物管理法",
    "食品追溯追蹤法",
    "食品標示法",
    "食品衛生法",
    "食品安全法",
    "食品污染法",
    "食品中毒法",
    "食品過敏法",
    "食品遺留物法",
    "食品摻偽法",
    "食品造假法",
    "食品詐欺法",
    "食品犯罪法",
    "食品管制法",
    "食品監督法",
    "食品管理法",
]

found_count = 0
not_found = []
partial_found = []

for law in important_laws:
    # 精確匹配
    cur.execute("SELECT COUNT(*) FROM laws WHERE law_name=?", (law,))
    cnt = cur.fetchone()[0]
    if cnt > 0:
        found_count += 1
        continue
    
    # 模糊匹配
    found = False
    for ln in law_names_set:
        if law in ln or ln in law:
            found = True
            partial_found.append((law, ln))
            break
    if not found:
        not_found.append(law)

print(f"  重要法規清單: {len(important_laws)} 部")
print(f"  ✓ 已找到: {found_count} 部")
print(f"  ~ 部分匹配: {len(partial_found)} 部")
print(f"  ✗ 未找到: {len(not_found)} 部")

if not_found:
    print(f"\n  未找到的法規 ({len(not_found)} 部):")
    for nf in not_found[:50]:
        print(f"    - {nf}")
    if len(not_found) > 50:
        print(f"    ... 還有 {len(not_found)-50} 部")

if partial_found:
    print(f"\n  部分匹配:")
    for pf in partial_found[:20]:
        print(f"    '{pf[0]}' -> '{pf[1]}'")

# ============================================================
# 8. 法規分類分析
# ============================================================
print("\n【8. 法規主題分類】")
# 根據名稱自動分類
categories = defaultdict(list)
for ln in law_names_set:
    if '刑法' in ln or '刑事' in ln:
        categories['刑事法律'].append(ln)
    elif '民事' in ln or '民法' in ln:
        categories['民事法律'].append(ln)
    elif '行政' in ln:
        categories['行政法律'].append(ln)
    elif '勞動' in ln or '勞工' in ln or '就業' in ln:
        categories['勞動就業'].append(ln)
    elif '稅' in ln or '所得' in ln or '營業' in ln:
        categories['稅務財政'].append(ln)
    elif '金融' in ln or '銀行' in ln or '保險' in ln or '證券' in ln or '票據' in ln:
        categories['金融證券'].append(ln)
    elif '教育' in ln or '學校' in ln or '教師' in ln:
        categories['教育學術'].append(ln)
    elif '社會' in ln or '福利' in ln or '救助' in ln or '老人' in ln or '兒童' in ln or '婦女' in ln or '身障' in ln:
        categories['社會福利'].append(ln)
    elif '環境' in ln or '污染' in ln or '廢棄物' in ln or '空氣' in ln or '水' in ln or '土壤' in ln or '自然' in ln or '野生' in ln or '動物' in ln:
        categories['環境保護'].append(ln)
    elif '食品' in ln or '衛生' in ln or '藥' in ln or '醫療' in ln or '健康' in ln or '傳染' in ln:
        categories['衛生醫療'].append(ln)
    elif '交通' in ln or '運輸' in ln or '鐵路' in ln or '公路' in ln or '航空' in ln or '船舶' in ln or '海事' in ln or '港' in ln:
        categories['交通運輸'].append(ln)
    elif '建築' in ln or '都更' in ln or '土地' in ln or '地政' in ln or '房' in ln or '居住' in ln or '公寓' in ln:
        categories['建築土地'].append(ln)
    elif '農' in ln or '漁' in ln or '畜牧' in ln or '林' in ln or '漁業' in ln:
        categories['農漁林牧'].append(ln)
    elif '文化' in ln or '藝術' in ln or '文博' in ln or '博物館' in ln or '圖書' in ln:
        categories['文化藝術'].append(ln)
    elif '資訊' in ln or '資安' in ln or '網路' in ln or '電信' in ln or '廣電' in ln or '數位' in ln or '通訊' in ln or '廣播' in ln or '電視' in ln:
        categories['資訊通訊'].append(ln)
    elif '商業' in ln or '公司' in ln or '企業' in ln or '貿易' in ln or '工商' in ln:
        categories['商業貿易'].append(ln)
    elif '公平' in ln or '消費' in ln or '消費者' in ln:
        categories['消費公平'].append(ln)
    elif '國防' in ln or '軍事' in ln or '軍' in ln:
        categories['國防軍事'].append(ln)
    elif '外交' in ln or '邦交' in ln:
        categories['外交邦交'].append(ln)
    elif '司法' in ln or '法院' in ln or '檢察' in ln or '律師' in ln or '法官' in ln or '司改' in ln:
        categories['司法改革'].append(ln)
    elif '貪' in ln or '腐' in ln or '弊' in ln or '廉' in ln or '廉政' in ln:
        categories['廉政反腐'].append(ln)
    elif '選' in ln or '選舉' in ln or '罷免' in ln or '公投' in ln or '公民' in ln:
        categories['選舉公投'].append(ln)
    elif '黨' in ln or '社團' in ln or '人民團體' in ln:
        categories['政黨社團'].append(ln)
    elif '移民' in ln or '難民' in ln or '國籍' in ln:
        categories['移民國籍'].append(ln)
    elif '原住' in ln or '客家' in ln or '新住民' in ln:
        categories['族群權益'].append(ln)
    elif '宗教' in ln or '寺廟' in ln:
        categories['宗教事務'].append(ln)
    elif '自由' in ln or '集會' in ln or '示威' in ln or '言論' in ln or '新聞' in ln or '出版' in ln:
        categories['自由權利'].append(ln)
    elif '科技' in ln or '創新' in ln or '研發' in ln or '技術' in ln or '標準' in ln:
        categories['科技創新'].append(ln)
    elif '災害' in ln or '消防' in ln or '救' in ln or '應變' in ln:
        categories['災害防救'].append(ln)
    elif '社宅' in ln or '居住正義' in ln:
        categories['住宅社宅'].append(ln)
    elif '長照' in ln or '長照服務' in ln:
        categories['長照服務'].append(ln)
    elif '毒品' in ln or '毒' in ln:
        categories['毒品管制'].append(ln)
    elif '武器' in ln or '槍' in ln or '砲' in ln:
        categories['武器管制'].append(ln)
    elif '賭' in ln or '賭博' in ln:
        categories['賭博管制'].append(ln)
    elif '酒' in ln or '菸' in ln or '煙' in ln or '酒精' in ln:
        categories['酒菸管制'].append(ln)
    elif '疫' in ln or '疫苗' in ln or '防疫' in ln:
        categories['疫病防疫'].append(ln)
    elif '生' in ln and '物' in ln and '多樣' not in ln:
        categories['生物安全'].append(ln)
    elif '核' in ln or '輻射' in ln or '原子' in ln:
        categories['核能安全'].append(ln)
    elif '能源' in ln or '電力' in ln or '電' in ln and '網' not in ln:
        categories['能源電力'].append(ln)
    elif '氣候' in ln or '暖化' in ln or '溫室' in ln or '碳' in ln:
        categories['氣候變遷'].append(ln)
    elif '海洋' in ln or '海岸' in ln or '海灘' in ln:
        categories['海洋海岸'].append(ln)
    elif '觀光' in ln or '旅' in ln and '遊' in ln:
        categories['觀光旅遊'].append(ln)
    elif '運' in ln and '動' in ln:
        categories['運動體育'].append(ln)
    elif '體' in ln and '育' in ln:
        categories['運動體育'].append(ln)
    elif '文' in ln and '創' in ln:
        categories['文創產業'].append(ln)
    elif '資' in ln and '產' in ln:
        categories['智慧財產'].append(ln)
    else:
        categories['其他'].append(ln)

for cat, laws in sorted(categories.items(), key=lambda x: len(x[1]), reverse=True):
    print(f"  {cat}: {len(laws)} 部")
    for l in laws:
        print(f"    - {l}")

# ============================================================
# 9. 搜尋引擎效能評估
# ============================================================
print("\n【9. 搜尋引擎效能評估】")
# 測試 FTS5 效能
import time

# 隨機選10個查詢測試效能
import random
queries_for_perf = random.sample(test_queries, min(10, len(test_queries)))
for query, desc in queries_for_perf:
    start = time.time()
    try:
        cur.execute("SELECT COUNT(*) FROM laws_fts WHERE laws_fts MATCH ?", (query,))
        cnt = cur.fetchone()[0]
        elapsed = (time.time() - start) * 1000
        print(f"  [{desc}] '{query}': {cnt} 結果, {elapsed:.2f}ms")
    except Exception as e:
        elapsed = (time.time() - start) * 1000
        print(f"  [{desc}] '{query}': 錯誤 {e}, {elapsed:.2f}ms")

# ============================================================
# 10. 最終總結
# ============================================================
print("\n" + "=" * 70)
print("【綜合總結】")
print(f"  資料庫檔案: {DB_PATH}")
print(f"  資料庫大小: 約 4.5 MB")
print(f"  法規種類數: {len(groups)} 種")
print(f"  總條文數: {total_articles} 條")
print(f"  毒品分級表: {len(sched_rows)} 項")
print(f"  空內容: {null_content} 條 ({null_content/total_articles*100:.1f}%)")
print(f"  短內容(<30字): {short_content} 條 ({short_content/total_articles*100:.1f}%)")
print(f"  無條文編號: {null_article} 條")
print(f"  無版本日期: {null_version} 條")
print(f"  完全重複: {len(duplicates)} 組")
print(f"  重要法規覆蓋率: {found_count}/{len(important_laws)} ({found_count/len(important_laws)*100:.1f}%)")
print(f"  缺失法規數: {len(not_found)}")
print("=" * 70)

conn.close()
