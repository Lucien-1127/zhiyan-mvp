import { useCallback } from 'react';
import { useTelegramBackButton, useTelegramPopup } from '../../hooks/telegram/index';

/* ───────── Types ───────── */

interface FileItem {
  id: string;
  name: string;
  size: string;
  date: string;
  type: 'document' | 'image' | 'code' | 'other';
}

/* ───────── Mock Data ───────── */

const MOCK_FILES: FileItem[] = [
  { id: '1', name: 'API 架構設計提案.pdf', size: '2.4 MB', date: '2026-07-08', type: 'document' },
  { id: '2', name: '系統監控儀表板.png', size: '856 KB', date: '2026-07-07', type: 'image' },
  { id: '3', name: 'prompt-templates.json', size: '124 KB', date: '2026-07-06', type: 'code' },
  { id: '4', name: 'Hermes 部署指南.md', size: '48 KB', date: '2026-07-05', type: 'document' },
  { id: '5', name: '模型路由設定.yaml', size: '16 KB', date: '2026-07-04', type: 'code' },
  { id: '6', name: '用戶回饋彙整.xlsx', size: '1.2 MB', date: '2026-07-03', type: 'document' },
];

const FILE_ICONS: Record<FileItem['type'], string> = {
  document: '📄',
  image: '🖼️',
  code: '📝',
  other: '📁',
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
  uploadBtn: {
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
  content: {
    padding: '16px',
    flex: 1,
  },
  fileList: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '10px',
  },
  fileItem: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '12px',
    padding: '12px 14px',
    background: 'var(--tg-theme-secondary-bg-color, #1e293b)',
    border: '1px solid rgba(148, 163, 184, 0.08)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  fileIcon: {
    fontSize: '24px',
    flexShrink: 0,
  },
  fileInfo: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--tg-theme-text-color, #e2e8f0)',
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  },
  fileMeta: {
    display: 'flex' as const,
    gap: '12px',
    marginTop: '4px',
    fontSize: '11px',
    color: 'var(--tg-theme-hint-color, #94a3b8)',
  },
};

/* ───────── Component ───────── */

export default function DocumentsPage({ onBack }: { onBack: () => void }) {
  const { openPopup } = useTelegramPopup();

  useTelegramBackButton(true, onBack);

  const handleFileClick = useCallback(
    async (file: FileItem) => {
      await openPopup(
        file.name,
        `大小：${file.size}\n日期：${file.date}\n\n檔案預覽功能即將上線。`,
        [{ id: 'ok', type: 'default', text: '知道了' }],
      );
    },
    [openPopup],
  );

  const handleUpload = useCallback(async () => {
    await openPopup(
      '上傳檔案',
      '請從裝置中選擇檔案上傳。\n支援格式：PDF、圖片、程式碼等。',
      [{ id: 'ok', type: 'default', text: '知道了' }],
    );
  }, [openPopup]);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>文件管理</span>
        <button style={styles.uploadBtn} onClick={handleUpload}>
          ↑ 上傳
        </button>
      </div>

      {/* File List */}
      <div style={styles.content}>
        <div style={styles.fileList}>
          {MOCK_FILES.map((file) => (
            <div
              key={file.id}
              style={styles.fileItem}
              onClick={() => handleFileClick(file)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleFileClick(file);
              }}
            >
              <span style={styles.fileIcon}>{FILE_ICONS[file.type]}</span>
              <div style={styles.fileInfo}>
                <div style={styles.fileName}>{file.name}</div>
                <div style={styles.fileMeta}>
                  <span>{file.size}</span>
                  <span>{file.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
