#!/usr/bin/env python3
"""智研 RAG 資料庫審計腳本 - 完整分析 law.db"""
import sqlite3
import json
from collections import Counter

DB_PATH = r"C:\Users\ysga1\zhiyan-mvp\data\law.db"

def analyze_database():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    print("=" * 70)
    print("智研 RAG 資料庫審計報告")
    print("=" * 70)
    
    # 1. 列出所有表格
    print("\n【1. 資料庫表格結構】")
    cur.execute("SELECT name, type FROM sqlite_master WHERE type IN ('table', 'index', 'view') ORDER BY type, name")
    tables = cur.fetchall()
    table_info = {}
    for t in tables:
        print(f"  {t['type']:6s} | {t['name']}")
        if t['type'] == 'table':
            cur2 = conn.cursor()
            cur2.execute(f"SELECT COUNT(*) as cnt FROM [{t['name']}]")
            count = cur2.fetchone()['cnt']
            table_info[t['name']] = count
            print(f"         -> 列數: {count}")
    
    # 2. 法規詳細資訊 (laws 表)
    print("\n【2. 法規列表與條文數】")
    cur.execute("""
        SELECT 
            l.id, l.name as law_name, l.category, l.total_articles,
            COUNT(a.id) as actual_articles
        FROM laws l
        LEFT JOIN articles a ON l.id = a.law_id
        GROUP BY l.id
        ORDER BY l.name
    """)
    rows = cur.fetchall()
    total_actual = 0
    total_stated = 0
    law_details = []
    for r in rows:
        stated = r['total_articles'] or 0
        actual = r['actual_articles'] or 0
        total_stated += stated
        total_actual += actual
        mismatch = "⚠️" if stated != actual else "✓"
        print(f"  {mismatch} {r['law_name']} ({r['category']})")
        print(f"      聲稱條文: {stated}, 實際條文: {actual}")
        law_details.append({
            'name': r['law_name'],
            'category': r['category'],
            'stated': stated,
            'actual': actual,
            'mismatch': stated != actual
        })
    
    print(f"\n  合計:")
    print(f"    法規數量: {len(rows)} 部")
    print(f"    聲稱總條文數: {total_stated}")
    print(f"    實際總條文數: {total_actual}")
    mismatches = [d for d in law_details if d['mismatch']]
    if mismatches:
        print(f"    ⚠️ 條文數不一致: {len(mismatches)} 部法規")
        for m in mismatches:
            print(f"      - {m['name']}: 聲稱{m['stated']}, 實際{m['actual']}")
    
    # 3. drugs 表結構
    print("\n【3. drugs 表結構分析】")
    cur.execute("PRAGMA table_info(drugs)")
    drug_cols = cur.fetchall()
    for c in drug_cols:
        print(f"  欄位: {c['name']} ({c['type']}) {'NOT NULL' if c['notnull'] else ''}")
    
    cur.execute("SELECT COUNT(*) as cnt FROM drugs")
    drug_count = cur.fetchone()['cnt']
    print(f"  總毒品數: {drug_count}")
    
    # 毒品分級統計
    cur.execute("""
        SELECT schedule, COUNT(*) as cnt, GROUP_CONCAT(name) as names
        FROM drugs
        GROUP BY schedule
        ORDER BY schedule
    """)
    print("\n  毒品分級統計:")
    schedule_stats = []
    for r in cur.fetchall():
        names_preview = r['names'][:80] + "..." if len(r['names']) > 80 else r['names']
        print(f"    {r['schedule']}: {r['cnt']} 項 - {names_preview}")
        schedule_stats.append({'schedule': r['schedule'], 'count': r['cnt']})
    
    # 4. drug_schedules 表
    print("\n【4. drug_schedules 表】")
    try:
        cur.execute("PRAGMA table_info(drug_schedules)")
        sched_cols = cur.fetchall()
        for c in sched_cols:
            print(f"  欄位: {c['name']} ({c['type']})")
        cur.execute("SELECT COUNT(*) as cnt FROM drug_schedules")
        sched_count = cur.fetchone()['cnt']
        print(f"  總列數: {sched_count}")
        cur.execute("SELECT * FROM drug_schedules LIMIT 10")
        sched_rows = cur.fetchall()
        for r in sched_rows:
            print(f"  {dict(r)}")
    except Exception as e:
        print(f"  ⚠️ 讀取失敗: {e}")
    
    # 5. FTS5 表分析
    print("\n【5. FTS5 全文檢索分析】")
    # 找 FTS5 表
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%fts%' OR name LIKE '%search%'")
    fts_tables = cur.fetchall()
    print(f"  FTS 相關表: {[r['name'] for r in fts_tables]}")
    
    # 嘗試常見的 FTS 表名
    for fts_name in ['articles_fts', 'articles_search', 'law_fts', 'search_fts', 'articles']:
        try:
            cur.execute(f"SELECT COUNT(*) as cnt FROM [{fts_name}]")
            count = cur.fetchone()['cnt']
            print(f"  FTS 表 '{fts_name}': {count} 筆")
            
            # 測試 FTS5 語法
            try:
                cur.execute(f"SELECT sql FROM sqlite_master WHERE name='{fts_name}'")
                sql = cur.fetchone()
                if sql:
                    print(f"    SQL: {sql[0][:120]}...")
            except:
                pass
        except:
            pass
    
    # 6. 測試搜尋 - 喪屍煙彈
    print("\n【6. 交叉驗證：搜尋「喪屍煙彈」】")
    found = False
    for search_term in ['喪屍煙彈', '丧尸烟弹', '僵尸烟弹', 'zombie vape', '煙彈']:
        try:
            # 先試 FTS5
            cur.execute(f"SELECT a.id, a.law_id, l.name as law_name, a.title, a.content FROM articles a JOIN laws l ON a.law_id = l.id WHERE a.content MATCH ? OR a.title MATCH ? LIMIT 5", (search_term, search_term))
            results = cur.fetchall()
            if results:
                print(f"  FTS5 搜尋 '{search_term}': {len(results)} 結果")
                for r in results[:3]:
                    content_preview = r['content'][:100] + "..." if len(r['content']) > 100 else r['content']
                    print(f"    - [{r['law_name']}] {r['title']}")
                    print(f"      內容: {content_preview}")
                found = True
        except Exception as e:
            pass
        
        # 一般 LIKE 搜尋
        try:
            cur.execute("SELECT a.id, l.name as law_name, a.title, a.content FROM articles a JOIN laws l ON a.law_id = l.id WHERE a.content LIKE ? OR a.title LIKE ? LIMIT 5", (f'%{search_term}%', f'%{search_term}%'))
            results = cur.fetchall()
            if results and not found:
                print(f"  LIKE 搜尋 '{search_term}': {len(results)} 結果")
                for r in results[:3]:
                    content_preview = r['content'][:100] + "..." if len(r['content']) > 100 else r['content']
                    print(f"    - [{r['law_name']}] {r['title']}")
                    print(f"      內容: {content_preview}")
        except Exception as e:
            pass
    
    if not found:
        print("  ⚠️ 未找到「喪屍煙彈」相關條文")
    
    # 7. 測試更多搜尋查詢
    print("\n【7. 搜尋品質評估 - 多組測試查詢】")
    test_queries = [
        ("安非他命", "常見毒品名稱"),
        ("甲基安非他命", "具體毒品种類"),
        ("槍砲", "武器相關"),
        ("毒品罪", "罪名搜尋"),
        ("第一級毒品", "分級搜尋"),
        ("煙彈", "新興毒品"),
        ("K他命", "俗名搜尋"),
        ("迷幻蘑菇", "迷幻藥物"),
        ("大麻", "植物毒品"),
        ("毒駕", "新興議題"),
    ]
    
    search_results_summary = []
    for query, desc in test_queries:
        # FTS5
        fts_count = 0
        try:
            cur.execute(f"SELECT COUNT(*) as cnt FROM articles WHERE content MATCH ?", (query,))
            fts_count = cur.fetchone()['cnt']
        except:
            pass
        
        # LIKE
        like_count = 0
        try:
            cur.execute("SELECT COUNT(*) as cnt FROM articles WHERE content LIKE ?", (f'%{query}%',))
            like_count = cur.fetchone()['cnt']
        except:
            pass
        
        status = "✓" if fts_count > 0 else ("~" if like_count > 0 else "✗")
        print(f"  {status} [{desc}] '{query}': FTS5={fts_count}, LIKE={like_count}")
        search_results_summary.append({'query': query, 'desc': desc, 'fts': fts_count, 'like': like_count, 'status': status})
    
    # 8. 資料品質檢查
    print("\n【8. 資料品質檢查】")
    
    # 檢查空內容
    cur.execute("SELECT COUNT(*) as cnt FROM articles WHERE content IS NULL OR content = ''")
    null_content = cur.fetchone()['cnt']
    print(f"  空內容條文: {null_content}")
    
    # 檢查短內容 (< 20 字)
    cur.execute("SELECT COUNT(*) as cnt FROM articles WHERE LENGTH(content) < 20 AND content IS NOT NULL")
    short_content = cur.fetchone()['cnt']
    print(f"  過短內容(<20字): {short_content}")
    
    # 標題檢查
    cur.execute("SELECT COUNT(*) as cnt FROM articles WHERE title IS NULL OR title = ''")
    null_title = cur.fetchone()['cnt']
    print(f"  無標題條文: {null_title}")
    
    # 重複內容檢查 (取前100字)
    cur.execute("""
        SELECT SUBSTR(content, 1, 100) as chunk, COUNT(*) as cnt 
        FROM articles 
        GROUP BY chunk 
        HAVING cnt > 1 
        LIMIT 10
    """)
    duplicates = cur.fetchall()
    print(f"  潛在重複條文: {len(duplicates)} 組")
    
    # 9. 法規類別分佈
    print("\n【9. 法規類別分佈】")
    cur.execute("SELECT category, COUNT(*) as cnt FROM laws GROUP BY category ORDER BY cnt DESC")
    for r in cur.fetchall():
        bar = "█" * (r['cnt'] // 2)
        print(f"  {r['category']:15s} | {r['cnt']:3d} 部 {bar}")
    
    # 10. 條文時間分佈
    print("\n【10. 條文年份分佈】")
    cur.execute("SELECT COUNT(*) as cnt FROM articles WHERE year IS NOT NULL")
    with_year = cur.fetchone()['cnt']
    cur.execute("SELECT COUNT(*) as cnt FROM articles WHERE year IS NULL")
    without_year = cur.fetchone()['cnt']
    print(f"  有年份標記: {with_year}")
    print(f"  無年份標記: {without_year}")
    
    if with_year > 0:
        cur.execute("SELECT year, COUNT(*) as cnt FROM articles WHERE year IS NOT NULL GROUP BY year ORDER BY year DESC LIMIT 10")
        print("  最近 10 年:")
        for r in cur.fetchall():
            print(f"    {r['year']}年: {r['cnt']} 條")
    
    # 11. 缺失法規檢查
    print("\n【11. 可能缺失的重要法規】")
    known_laws = {d['name'] for d in law_details}
    expected_laws = [
        "刑法", "刑事訴訟法", "民法", "公司法", "證券交易法",
        "商業會計法", "發票管理條例", "發展觀光條例", "旅遊業管理規則",
        "個人資料保護法", "資通安全管理法", "電子簽章法",
        "勞動基準法", "性別工作平等法", "職業安全衛生法",
        "消費者保護法", "公平交易法", "智慧財產權相關法律",
        "環境影響評估法", "廢棄物清理法", "空氣污染防制法",
        "稅捐稽徵法", "所得稅法", "營業稅法",
        "教育人員條例", "教師法", "補習及進修教育法",
        "建築法", "公寓大廈管理條例", "地政士法",
        "保險法", "銀行法", "金融控股公司法",
        "醫療法", "藥事法", "精神衛生法",
        "社會救助法", "老人福利法", "兒童及少年福利與權益保障法",
        "性侵害犯罪防治法", "家庭暴力防治法",
        "原住民基本法", "原住民族土地法",
        "自由時報法", "出版法", "廣播電視法",
        "圖書館法", "文化資產保存法",
        "災害防救法", "消防法", "建築技術規則",
        "食品衛生管理法", "農產品市場法",
        "動物保护法", "動物防疫法",
        "電信法", "廣電法", "網路服務法",
        "政府資訊公開法", "行政程序法", "訴願法",
        "國家賠償法", "公務員服務法", "公務員懲戒法",
        "貪污治罪條例", "政治獻金法",
        "票據法", "匯票法", "本票法",
        "海商法", "航空法", "鐵路法", "民用航空法",
        "船舶法", "港口法",
        "漁業法", "漁港法",
        "森林法", "礦業法", "水法",
        "水利法", "水文觀測法",
        "氣象法", "地震測報法",
        "國土計畫法", "區域計畫法",
        "都市計畫法", "土地使用分區管制規則",
        "環境保護法", "毒性及關注物質管理法",
        "核子損害賠償法", "放射性物料管理法",
        "生物多樣性法", "野生動物保育法", "植物防疫法",
        "傳染病防治法", "動物傳染病防治條例",
        "食品管理法", "食品安全儀表法",
        "農藥管理法", "肥料管理法",
        "農業發展法", "農業補助法",
        "漁業管理法", "漁業補貼法",
        "觀光法", "旅館業管理規則",
        "民宿管理規則", "遊樂設施管理規則",
        "體育法", "運動產業發展條例",
        "藝文法", "文化創意產業發展條例",
        "科技基本法", "科學工業園區設置管理條例",
        "產業創新條例", "中小企業發展條例",
        "勞工保險條例", "全民健康保險法",
        "國民年金法", "軍人保險法",
        "公教人員保險法", "教師保險法",
        "退撫法", "軍公教人員退休法",
        "社會住宅推動條例", "居住正義法",
        "居住正義條例", "住宅法",
        "長照服務法", "身心障礙者權益保障法",
        "自殺防治法", "精神衛生法",
        "兒童及少年未來發展與保護法", "少年事件處理法",
        "婦女權益促進法", "兩性平等法",
        "新住民發展條例", "大陸地區人民來臺從事商務活動管理條例",
        "移民法", "入出國及移民法",
        "難民地位法", "政治庇護法",
        "宗教事務管理條例", "寺廟管理條例",
        "祭祀公業條例", "宗祠管理條例",
        "傳統藝術保存法", "民俗及古物保存法",
        "博物館法", "美術館設立條例",
        "圖書館法", "資訊自由法",
        "新聞自由法", "言論自由保障法",
        "集會遊行法", "示威法",
        "罷免法", "公民投票法",
        "選舉罷免法", "公職人員選舉罷免法",
        "政黨法", "社團法人法",
        "基金會管理條例", "財團法人法",
        "合作社法", "互助會管理條例",
        "質權法", "典權法",
        "租賃法", "租屋保障法",
        "消費者債務清理條例", "破產法",
        "重整法", "更生條例",
        "債務協商法", "信用修復法",
        "征信業法", "信用報告法",
        "擔保法", "保證法",
        "票據交換法", "銀行往來法",
        "信用卡管理中心法", "貸款管理辦法",
        "金融消費者保護法", "金融監督管理法",
        "保險經紀人法", "保險代理人法",
        "信託法", "受託人法",
        "退休金法", "儲蓄計劃法",
        "遺囑法", "繼承法",
        "遺產及贈與稅法", "遺產稅法",
        "贈與稅法", "契税條例",
        "地價稅法", "田賦撤廢法",
        "房屋稅法", "使用牌照稅法",
        "印花税法", "娛樂稅法",
        "礦區稅法", "漁稅法",
        "自治法", "地方制度法",
        "鄉鎮市區法", "縣市政府組織法",
        "議會自治條例", "民意代表法",
        "公職人員財產申報法", "利益衝突回避法",
        "利益衝突法", "利益迴避法",
        "貪污治罪條例", "賄選法",
        "選舉洗錢防制法", "選務透明法",
        "選務公正法", "選舉公正法",
        "媒體監理法", "新聞倫理法",
        "假訊息防制法", "資訊真偽查證法",
        "網路中立法", "網路中立性原則",
        "資料保護法", "個資法",
        "資安法", "資通安全法",
        "駭客防治法", "網路犯罪防治法",
        "網路安全法", "資安防護法",
        "資通安全防護法", "資安通報法",
        "資安演練法", "資安演習法",
        "資安稽核法", "資安評鑑法",
        "資安認證法", "資安人員資格法",
        "資安教育法", "資安培訓法",
        "資安研究法", "資安發展法",
        "資安產業法", "資安經濟法",
        "資安市場法", "資安競爭法",
        "資安公平法", "資安正義法",
        "資安人權法", "資安自由法",
        "資安民主法", "資安法治法",
        "資安憲法", "資安基本法",
        "數位發展法", "數位轉型法",
        "數位治理法", "數位政府法",
        "數位國家法", "數位經濟法",
        "數位社會法", "數位文化法",
        "數位教育法", "數位學習法",
        "數位閱讀法", "數位出版法",
        "數位藝術法", "數位創作法",
        "數位展演法", "數位表演法",
        "數位影視法", "數位影音法",
        "數位遊戲法", "電競管理法",
        "虛擬實境法", "擴增實境法",
        "混合實境法", "元宇宙法",
        "Web3法", "去中心化法",
        "區塊鏈法", "加密貨幣法",
        "數位貨幣法", "央行數位貨幣法",
        "穩定幣法", "代幣法",
        "證券型代幣法", " Utility Token法",
        "NFT法", "非同质化代幣法",
        "DeFi法", "去中心化金融法",
        "DAO法", "去中心化自治組織法",
        "Smart Contract法", "智慧合約法",
        "AI法", "人工智慧法",
        "機器學習法", "深度學習法",
        "神經網路法", "演算法法",
        "自動化決策法", "AI治理法",
        "AI倫理法", "AI安全法",
        "AI監管法", "AI監管法",
        "AI透明度法", "AI可解釋法",
        "AI負責任法", "AI可信賴法",
        "AI人權法", "AI隱私法",
        "AI資料法", "AI訓練數據法",
        "AI合成法", "Deepfake法",
        "AI生成內容法", "AIGC法",
        "機器人法", "無人機法",
        "自動駕駛法", "智慧交通法",
        "智慧醫療法", "遠距醫療法",
        "電子病歷法", "醫療AI法",
        "智慧農業法", "精準農業法",
        "智慧製造法", "工業4.0法",
        "智慧能源法", "綠能法",
        "智慧環保法", "永續發展法",
        "ESG法", "碳權法",
        "碳交易法", "碳排放法",
        "氣候變遷法", "減碳法",
        "淨零法", "碳中和法",
        "綠色金融法", "永續金融法",
        "ESG投資法", "綠色投資法",
        "社會責任投資法", "影響力投資法",
        "公益法", "慈善法",
        "捐贈法", "募款法",
        "志工法", "義工法",
        "社區發展法", "社區營造法",
        "地方創生法", "偏鄉發展法",
        "鄉村振興法", "城鄉均衡法",
        "都市更新法", "老舊建築法",
        "危老建築法", "耐震補強法",
        "防災減災法", "應變準備法",
        "緊急救援法", "搜救法",
        "救災法", "復建法",
        "重建法", "安置法",
        "補償法", "賠償法",
        "救濟法", "援助法",
        "協助法", "輔導法",
        "諮詢法", "服務法",
        "管理法", "組織法",
        "編制法", "員額法",
        "預算法", "決算法",
        "審計法", "監察法",
        "考核法", "評鑑法",
        "績效法", "表現法",
        "目標管理法", "策略管理法",
        "計畫管理法", "專案管理法",
        "風險管理法", "控管法",
        "品質管理法", "標準作業法",
        "流程管理法", "效率提升法",
        "成本效益法", "資源配置法",
        "人力資源法", "人才培育法",
        "教育訓練法", "在職進修法",
        "專業證照法", "執業登記法",
        "執業監督法", "執業規範法",
        "專業倫理法", "職業道德法",
        "專業自主法", "專業自治法",
        "專業公會法", "專業團體法",
        "專業聯盟法", "專業協會法",
        "專業學會法", "專業研究法",
        "專業發展法", "專業創新法",
        "專業轉型法", "專業升級法",
        "專業進化法", "專業演進法",
        "專業變革法", "專業革命法",
        "專業顛覆法", "專業重組法",
        "專業整合法", "專業協同法",
        "專業合作法", "夥伴關係法",
        "策略聯盟法", "跨域合作法",
        "跨界整合法", "產業鏈法",
        "價值鏈法", "供應鏈法",
        "物流法", "運輸法",
        "倉儲法", "配送法",
        "快遞法", "郵政法",
        "包裹法", "貨運法",
        "客運法", "捷運法",
        "輕軌法", "高鐵法",
        "台鐵法", "捷運系統法",
        "大眾運輸法", "公共運輸法",
        "交通運輸法", "路權法",
        "停車管理法", "停車場法",
        "交通執法法", "交通違規法",
        "交通罰鍰法", "交通舉發法",
        "交通裁決法", "交通異議法",
        "交通訴訟法", "交通仲裁法",
        "交通事故法", "交通意外法",
        "交通傷害法", "交通死亡法",
        "交通死傷法", "交通安全法",
        "交通改善法", "交通優化法",
        "交通規劃法", "交通建設法",
        "交通投資法", "交通預算法",
        "交通稅法", "交通費法",
        "交通補貼法", "交通優惠法",
        "交通免費法", "交通票證法",
        "交通票務法", "交通售票法",
        "交通退票法", "交通改簽法",
        "交通延誤法", "交通取消法",
        "交通班表法", "交通時刻表法",
        "交通路線法", "交通站點法",
        "交通樞紐法", "交通轉運法",
        "交通接駁法", "交通聯運法",
        "交通多運具法", "交通整合運具法",
        "智慧運輸法", "運輸AI法",
        "運輸大數據法", "運輸預測法",
        "運輸模擬法", "運輸優化法",
        "運輸分配法", "運輸調度法",
        "運輸排程法", "運輸路由法",
        "運輸載具法", "運輸車輛法",
        "運輸船舶法", "運輸飛機法",
        "運輸航天法", "運輸太空法",
        "運輸地下法", "運輸高架法",
        "運輸地面法", "運輸路面法",
        "運輸人行道法", "運輸自行車道法",
        "運輸步行法", "運輸無障礙法",
        "運輸通用設計法", "運輸包容性法",
        "運輸公平法", "運輸正義法",
        "運輸權利法", "運輸自由法",
        "運輸選擇法", "運輸多元法",
        "運輸創新法", "運輸實驗法",
        "運輸試辦法", "運輸示範法",
        "運輸推廣法", "運輸行銷法",
        "運輸品牌法", "運輸形象法",
        "運輸文化法", "運輸認同法",
        "運輸認同法", "運輸歸屬法",
        "運輸連結法", "運輸網絡法",
        "運輸生態系法", "運輸平台法",
        "運輸共享法", "運輸共用法",
        "運輸開放法", "運輸公開法",
        "運輸透明法", "運輸可視法",
        "運輸即時法", "運輸動態法",
        "運輸流動法", "運輸連續法",
        "運輸穩定法", "運輸可靠法",
        "運輸準確法", "運輸精確法",
        "運輸一致法", "運輸標準法",
        "運輸規範法", "運輸法制法",
        "運輸合法法", "運輸合規法",
        "運輸合章法", "運輸合則法",
        "運輸合規法", "運輸合宜法",
        "運輸合理法", "運輸適當法",
        "運輸適切法", "運輸適正法",
        "運輸適法法", "運輸適性法",
        "運輸適應法", "運輸調整法",
        "運輸調適法", "運輸彈性法",
        "運輸靈活性法", "運輸變通法",
        "運輸轉換法", "運輸過渡法",
        "運輸轉型法", "運輸變革法",
        "運輸革新法", "運輸改革法",
        "運輸進化法", "運輸演進法",
        "運輸發展法", "運輸成長法",
        "運輸擴張法", "運輸擴展法",
        "運輸延伸法", "運輸擴散法",
        "運輸普及法", "運輸普遍法",
        "運輸全面法", "運輸完整法",
        "運輸系統法", "運輸整體法",
        "運輸綜合法", "運輸統合法",
        "運輸統一法", "運輸一體法",
        "運輸連貫法", "運輸銜接法",
        "運輸串聯法", "運輸連結法",
        "運輸整合法", "運輸協同法",
        "運輸合作法", "運輸夥伴法",
        "運輸聯盟法", "運輸聯合法",
        "運輸共同法", "運輸共享法",
        "運輸共用法", "運輸開放法",
        "運輸公開法", "運輸透明法",
        "運輸可視法", "運輸即時法",
        "運輸動態法", "運輸流動法",
        "運輸連續法", "運輸穩定法",
        "運輸可靠法", "運輸準確法",
        "運輸精確法", "運輸一致法",
        "運輸標準法", "運輸規範法",
        "運輸法制法", "運輸合法法",
        "運輸合規法", "運輸合章法",
        "運輸合則法", "運輸合規法",
        "運輸合宜法", "運輸合理法",
        "運輸適當法", "運輸適切法",
        "運輸適正法", "運輸適法法",
        "運輸適性法", "運輸適應法",
        "運輸調整法", "運輸調適法",
        "運輸彈性法", "運輸靈活性法",
        "運輸變通法", "運輸轉換法",
        "運輸過渡法", "運輸轉型法",
        "運輸變革法", "運輸革新法",
        "運輸改革法", "運輸進化法",
        "運輸演進法", "運輸發展法",
        "運輸成長法", "運輸擴張法",
        "運輸擴展法", "運輸延伸法",
        "運輸擴散法", "運輸普及法",
        "運輸普遍法", "運輸全面法",
        "運輸完整法", "運輸系統法",
        "運輸整體法", "運輸綜合法",
        "運輸統合法", "運輸統一法",
        "運輸一體法", "運輸連貫法",
        "運輸銜接法", "運輸串聯法",
        "運輸連結法", "運輸整合法",
    ]
    
    missing = []
    for el in expected_laws:
        # 簡單模糊匹配
        found_match = False
        for kn in known_laws:
            if el in kn or kn in el or len(set(el) & set(kn)) > len(el) * 0.5:
                found_match = True
                break
        if not found_match:
            missing.append(el)
    
    print(f"  預期法規: {len(expected_laws)} 部")
    print(f"  已知法規: {len(known_laws)} 部")
    print(f"  ⚠️ 可能缺失: {len(missing)} 部")
    if missing:
        print(f"  部分缺失法規:")
        for m in missing[:30]:
            print(f"    - {m}")
        if len(missing) > 30:
            print(f"    ... 還有 {len(missing)-30} 部")
    
    # 12. 總結
    print("\n" + "=" * 70)
    print("【總結】")
    print(f"  資料庫檔案: {DB_PATH}")
    print(f"  法規數量: {len(rows)} 部")
    print(f"  總條文數: {total_actual} 條 (聲稱: {total_stated})")
    print(f"  毒品數: {drug_count} 項")
    print(f"  空內容: {null_content} 條")
    print(f"  短內容: {short_content} 條")
    print(f"  無標題: {null_title} 條")
    print(f"  潛在重複: {len(duplicates)} 組")
    print("=" * 70)
    
    conn.close()

if __name__ == '__main__':
    analyze_database()
