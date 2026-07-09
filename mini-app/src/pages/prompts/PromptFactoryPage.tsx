import { useCallback, useState } from 'react';
import { useTelegramBackButton, useTelegramPopup } from '../../hooks/telegram/index';

/* ───────── Types ───────── */

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  model: string;
  usageCount: number;
}

/* ───────── Mock Data ───────── */

const MOCK_TEMPLATES: PromptTemplate[] = [
  {
    id: '1',
    name: '程式碼審查專家',
    description: '對程式碼進行全面審查，找出潛在的 bug、安全漏洞與效能瓶頸',
    category: '開發',
    model: 'DeepSeek V4',
    usageCount: 342,
  },
  {
    id: '2',
    name: '文案生成器',
    description: '根據產品特點與目標受眾，生成吸引人的行銷文案',
    category: '行銷',
    model: 'Claude 4 Sonnet',
    usageCount: 215,
  },
  {
    id: '3',
    name: '技術文件翻譯',
    description: '將技術文件翻譯為繁體中文，保留專業術語準確性',
    category: '翻譯',
    model: 'Gemini 2.5 Pro',
    usageCount: 189,
  },
  {
    id: '4',
    name: '系統架構分析師',
    description: '分析系統架構設計，提出最佳化建議與潛在風險',
    category: '架構',
    model: 'GPT-4.1',
    usageCount: 156,
  },
  {
    id: '5',
    name: '法律條文解釋',
    description: '用白話解釋法律條文，協助非法律專業人士理解',
    category: '法律',
    model: 'DeepSeek V4',
    usageCount: 98,
  },
  {
    id: '6',
    name: 'SQL 查詢最佳化',
    description: '將自然語言轉換為最佳化的 SQL 查詢，或對現有 SQL 進行最佳化',
    category: '開發',
    model: 'Kimi K2',
    usageCount: 134,
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  '開發': '#40a7e3',
  '行銷': '#f59e0b',
  '翻譯': '#22c55e',
  '架構': '#6366f1',
  '法律': '#ef4444',
};

/* ───────── Styles ───────── */

const styles = {
  page: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    minHeight: '100vh',
    background: 'var(--tg-theme-bg-color, #1a1a2e)',
    color: 'var(--tg-theme-text-color, #e2e8f0)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  header: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: '12px 16px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
    background: 'var(--tg-theme-secondary-bg-color, #1e293b)',
  },
  headerTitle: {
    fontSize: '17px',
    fontWeight: 600,
    color: 'var(--tg-theme-text-color, #e2e8f0)',
  },
  createBtn: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '20px',
    border: 'none',
    background: 'var(--tg-theme-button-color, #40a7e3)',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'opacity 0.15s ease',
  },
  searchBar: {
    margin: '12px 16px 0',
    padding: '10px 14px',
    borderRadius: '12px',
    border: '1px solid rgba(148, 163, 184, 0.15)',
    background: 'var(--tg-theme-secondary-bg-color, #1e293b)',
    color: 'var(--tg-theme-text-color, #e2e8f0)',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    width: 'auto',
  },
  content: {
    padding: '12px 16px 16px',
    flex: 1,
  },
  templateList: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '10px',
  },
  templateCard: {
    padding: '14px',
    background: 'var(--tg-theme-secondary-bg-color, #1e293b)',
    borderRadius: '12px',
    border: '1px solid rgba(148, 163, 184, 0.08)',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  templateTop: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: '6px',
  },
  templateName: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--tg-theme-text-color, #e2e8f0)',
  },
  categoryBadge: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#fff',
    borderRadius: '6px',
    padding: '2px 8px',
    flexShrink: 0,
  },
  templateDesc: {
    fontSize: '12px',
    color: 'var(--tg-theme-hint-color, #94a3b8)',
    lineHeight: 1.4,
    marginBottom: '8px',
  },
  templateMeta: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    fontSize: '11px',
    color: 'var(--tg-theme-hint-color, #94a3b8)',
  },
  modelTag: {
    color: 'var(--tg-theme-button-color, #40a7e3)',
    fontWeight: 500,
  },
};

/* ───────── Component ───────── */

export default function PromptFactoryPage({ onBack }: { onBack: () => void }) {
  const [search, setSearch] = useState('');
  const { openPopup } = useTelegramPopup();

  useTelegramBackButton(true, onBack);

  const filteredTemplates = MOCK_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.includes(search),
  );

  const handleTemplateClick = useCallback(
    async (template: PromptTemplate) => {
      await openPopup(
        template.name,
        `類別：${template.category}\n模型：${template.model}\n使用次數：${template.usageCount}\n\n${template.description}`,
        [
          { id: 'use', type: 'default', text: '使用此提示詞' },
          { id: 'close', type: 'cancel', text: '關閉' },
        ],
      );
    },
    [openPopup],
  );

  const handleCreateClick = useCallback(async () => {
    await openPopup(
      '建立新提示詞',
      '輸入提示詞名稱、描述與內容，即可建立自訂提示詞範本。\n\n功能即將上線，敬請期待！',
      [{ id: 'ok', type: 'default', text: '知道了' }],
    );
  }, [openPopup]);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>提示詞工廠</span>
        <button style={styles.createBtn} onClick={handleCreateClick}>
          ＋ 新增
        </button>
      </div>

      {/* Search */}
      <input
        style={styles.searchBar}
        placeholder="搜尋提示詞⋯"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Template List */}
      <div style={styles.content}>
        <div style={styles.templateList}>
          {filteredTemplates.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--tg-theme-hint-color, #94a3b8)',
                padding: '32px 0',
                fontSize: '14px',
              }}
            >
              找不到符合的提示詞
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                style={styles.templateCard}
                onClick={() => handleTemplateClick(template)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleTemplateClick(template);
                }}
              >
                <div style={styles.templateTop}>
                  <span style={styles.templateName}>{template.name}</span>
                  <span
                    style={{
                      ...styles.categoryBadge,
                      background: CATEGORY_COLORS[template.category] || '#94a3b8',
                    }}
                  >
                    {template.category}
                  </span>
                </div>
                <div style={styles.templateDesc}>{template.description}</div>
                <div style={styles.templateMeta}>
                  <span>
                    使用 <strong>{template.usageCount}</strong> 次
                  </span>
                  <span style={styles.modelTag}>{template.model}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
