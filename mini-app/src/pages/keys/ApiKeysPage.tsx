import { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { useTelegramPopup, useTelegramBackButton } from '../../hooks/telegram/index';
import type { KeyItem } from '../../types/keys';
import { apiFetch } from '../../hooks/useApi';

interface ApiKeysPageProps {
  onBack: () => void;
}

const PLATFORMS: string[] = [
  'groq', 'openrouter', 'deepseek', 'nvidia', 'cerebras',
  'mistral', 'cloudflare', 'gemini', 'agnes', 'telegram', 'freellm',
];

const API_BASE = '';

/* ───────── Status color helpers ───────── */

function statusColor(tested: boolean, valid: boolean | null): string {
  if (!tested) return 'var(--tg-theme-hint-color, #999)';
  if (valid === true) return '#34c759';
  if (valid === false) return '#ff3b30';
  return '#ff9500';
}

function statusLabel(tested: boolean, valid: boolean | null): string {
  if (!tested) return '未測試';
  if (valid === true) return '有效';
  if (valid === false) return '無效';
  return '不明';
}

/* ───────── Platform accent colors ───────── */

const PLATFORM_COLORS: Record<string, string> = {
  groq: '#f97316',
  openrouter: '#8b5cf6',
  deepseek: '#0ea5e9',
  nvidia: '#76b900',
  cerebras: '#6366f1',
  mistral: '#ec4899',
  cloudflare: '#f6821f',
  gemini: '#4285f4',
  agnes: '#e11d48',
  telegram: '#0088cc',
  freellm: '#14b8a6',
};

function platformColor(p: string): string {
  return PLATFORM_COLORS[p] ?? 'var(--tg-theme-hint-color, #999)';
}

/* ───────── Inline styles ───────── */

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
  borderBottom: '1px solid var(--tg-theme-hint-color, #ccc)',
  background: 'var(--tg-theme-bg-color, #fff)',
};

const backButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: 20,
  cursor: 'pointer',
  padding: '4px 8px',
  marginRight: 12,
  color: 'var(--tg-theme-button-color, #40a7e3)',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--tg-theme-secondary-bg-color, #efeff4)',
  borderRadius: 12,
  padding: 12,
  marginBottom: 10,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  fontSize: 16,
  border: '1px solid var(--tg-theme-hint-color, #ccc)',
  borderRadius: 10,
  background: 'var(--tg-theme-bg-color, #fff)',
  color: 'var(--tg-theme-text-color, #000)',
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'auto',
};

const btnPrimaryStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  fontSize: 16,
  fontWeight: 600,
  border: 'none',
  borderRadius: 10,
  background: 'var(--tg-theme-button-color, #40a7e3)',
  color: 'var(--tg-theme-button-text-color, #fff)',
  cursor: 'pointer',
};

const btnDangerStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  fontSize: 16,
  fontWeight: 600,
  border: 'none',
  borderRadius: 10,
  background: '#ff3b30',
  color: '#fff',
  cursor: 'pointer',
};

const btnOutlineStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 14,
  fontWeight: 500,
  border: '1px solid var(--tg-theme-button-color, #40a7e3)',
  borderRadius: 8,
  background: 'transparent',
  color: 'var(--tg-theme-button-color, #40a7e3)',
  cursor: 'pointer',
};

const btnDangerOutlineStyle: React.CSSProperties = {
  ...btnOutlineStyle,
  borderColor: '#ff3b30',
  color: '#ff3b30',
};

const successDotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  display: 'inline-block',
  marginRight: 4,
  flexShrink: 0,
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 22,
  height: 22,
  padding: '0 8px',
  borderRadius: 11,
  background: 'var(--tg-theme-button-color, #40a7e3)',
  color: 'var(--tg-theme-button-text-color, #fff)',
  fontSize: 12,
  fontWeight: 700,
  marginLeft: 8,
};

const platformBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 8px',
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 600,
  color: '#fff',
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
  marginRight: 8,
  flexShrink: 0,
};

const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginTop: 8,
  justifyContent: 'flex-end',
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--tg-theme-hint-color, #999)',
  marginBottom: 4,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

/* ───────── Component ───────── */

export default function ApiKeysPage({ onBack }: ApiKeysPageProps) {
  const [keys, setKeys] = useState<KeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState<'none' | 'add' | 'edit'>('none');
  const [editTarget, setEditTarget] = useState<KeyItem | null>(null);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ── Form state ── */
  const [formPlatform, setFormPlatform] = useState(PLATFORMS[0]);
  const [formLabel, setFormLabel] = useState('');
  const [formKey, setFormKey] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { openPopup } = useTelegramPopup();
  useTelegramBackButton(showForm !== 'none', handleBack);

  /* ── Fetch keys ── */
  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${API_BASE}/api/keys`);
      const data = await res.json();
      if (data.keys) setKeys(data.keys);
      if (data.platforms) setPlatforms(data.platforms);
    } catch {
      // silently fail — user will see empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  /* ── Back / cancel ── */
  function handleBack() {
    if (showForm !== 'none') {
      setShowForm('none');
      setEditTarget(null);
      resetForm();
    } else {
      onBack();
    }
  }

  function resetForm() {
    setFormPlatform(PLATFORMS[0]);
    setFormLabel('');
    setFormKey('');
  }

  /* ── Open add form ── */
  function openAddForm() {
    resetForm();
    setEditTarget(null);
    setShowForm('add');
  }

  /* ── Open edit form ── */
  function openEditForm(key: KeyItem) {
    setEditTarget(key);
    setFormLabel(key.label);
    setFormKey('');
    setShowForm('edit');
    setExpandedId(null);
  }

  /* ── Add key ── */
  async function handleAdd() {
    if (!formLabel.trim() || !formKey.trim()) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/keys/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: formPlatform, label: formLabel.trim(), key: formKey.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        await openPopup('✅ 新增成功', `已新增 ${data.platform} 金鑰`, [
          { id: 'ok', type: 'default' as const, text: '確定' },
        ]);
        setShowForm('none');
        resetForm();
        await fetchKeys();
      }
    } catch {
      await openPopup('❌ 新增失敗', '無法連線至伺服器，請稍後再試', [
        { id: 'ok', type: 'default' as const, text: '確定' },
      ]);
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Edit / replace key ── */
  async function handleReplace() {
    if (!editTarget) return;
    if (!formLabel.trim()) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { id: editTarget.id, label: formLabel.trim() };
      if (formKey.trim()) body.key = formKey.trim();
      const res = await apiFetch(`${API_BASE}/api/keys/replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        await openPopup('✅ 更新成功', `已更新 ${data.platform} 金鑰`, [
          { id: 'ok', type: 'default' as const, text: '確定' },
        ]);
        setShowForm('none');
        setEditTarget(null);
        resetForm();
        await fetchKeys();
      }
    } catch {
      await openPopup('❌ 更新失敗', '無法連線至伺服器，請稍後再試', [
        { id: 'ok', type: 'default' as const, text: '確定' },
      ]);
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Delete key ── */
  async function handleDelete() {
    if (!editTarget) return;
    const confirm = await openPopup('⚠️ 刪除金鑰', `確定要刪除 ${editTarget.platform} / ${editTarget.label} 嗎？此操作無法復原。`, [
      { id: 'cancel', type: 'default' as const, text: '取消' },
      { id: 'confirm', type: 'destructive' as const, text: '刪除' },
    ]);
    if (!confirm || confirm.id !== 'confirm') return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/keys/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editTarget.id }),
      });
      const data = await res.json();
      if (data.success) {
        await openPopup('🗑️ 已刪除', `已刪除 ${editTarget.platform} 金鑰`, [
          { id: 'ok', type: 'default' as const, text: '確定' },
        ]);
        setShowForm('none');
        setEditTarget(null);
        resetForm();
        await fetchKeys();
      }
    } catch {
      await openPopup('❌ 刪除失敗', '無法連線至伺服器，請稍後再試', [
        { id: 'ok', type: 'default' as const, text: '確定' },
      ]);
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Test key ── */
  async function handleTestKey(id: string) {
    setSubmitting(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/keys/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.result) {
        const httpCode = data.result.http_code ? ` (HTTP ${data.result.http_code})` : '';
        await openPopup('🧪 測試結果', `狀態: ${data.result.status}${httpCode}`, [
          { id: 'ok', type: 'default' as const, text: '確定' },
        ]);
        await fetchKeys();
      }
    } catch {
      await openPopup('❌ 測試失敗', '無法連線至伺服器', [
        { id: 'ok', type: 'default' as const, text: '確定' },
      ]);
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Key row expand toggle ── */
  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  /* ── Resolve available platforms ── */
  const availablePlatforms = platforms.length > 0 ? platforms : [...PLATFORMS];

  /* ══════════════════ RENDER ══════════════════ */

  /* ── Add Form ── */
  if (showForm === 'add') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={headerStyle}>
          <button onClick={handleBack} style={backButtonStyle} aria-label="返回">←</button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>新增金鑰</h1>
        </div>
        <PageContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Platform */}
            <div>
              <div style={sectionLabelStyle}>平台</div>
              <select
                value={formPlatform}
                onChange={(e) => setFormPlatform(e.target.value)}
                style={selectStyle}
              >
                {availablePlatforms.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Label */}
            <div>
              <div style={sectionLabelStyle}>標籤</div>
              <input
                placeholder="例如：主要金鑰、測試用"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Key */}
            <div>
              <div style={sectionLabelStyle}>API 金鑰</div>
              <input
                placeholder="請輸入完整金鑰"
                value={formKey}
                onChange={(e) => setFormKey(e.target.value)}
                style={inputStyle}
                type="password"
              />
              <p style={{ fontSize: 12, color: 'var(--tg-theme-hint-color, #999)', marginTop: 4 }}>
                金鑰將安全儲存於伺服器，不會在 UI 中完整顯示
              </p>
            </div>

            {/* Submit */}
            <button
              onClick={handleAdd}
              disabled={submitting || !formLabel.trim() || !formKey.trim()}
              style={{
                ...btnPrimaryStyle,
                opacity: submitting || !formLabel.trim() || !formKey.trim() ? 0.5 : 1,
              }}
            >
              {submitting ? '送出中…' : '新增金鑰'}
            </button>
          </div>
        </PageContainer>
      </div>
    );
  }

  /* ── Edit Form ── */
  if (showForm === 'edit' && editTarget) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={headerStyle}>
          <button onClick={handleBack} style={backButtonStyle} aria-label="返回">←</button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>編輯金鑰</h1>
        </div>
        <PageContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Platform (readonly) */}
            <div>
              <div style={sectionLabelStyle}>平台</div>
              <div
                style={{
                  ...inputStyle,
                  background: 'var(--tg-theme-secondary-bg-color, #efeff4)',
                  opacity: 0.7,
                  cursor: 'not-allowed',
                }}
              >
                {editTarget.platform}
              </div>
            </div>

            {/* Key prefix (readonly) */}
            <div>
              <div style={sectionLabelStyle}>當前金鑰前綴</div>
              <div
                style={{
                  ...inputStyle,
                  background: 'var(--tg-theme-secondary-bg-color, #efeff4)',
                  opacity: 0.7,
                  cursor: 'not-allowed',
                  fontFamily: 'monospace',
                }}
              >
                {editTarget.prefix}••••••••••
              </div>
            </div>

            {/* Label */}
            <div>
              <div style={sectionLabelStyle}>標籤</div>
              <input
                placeholder="金鑰標籤"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Key (optional replace) */}
            <div>
              <div style={sectionLabelStyle}>新金鑰（選填）</div>
              <input
                placeholder="留空則保留當前金鑰"
                value={formKey}
                onChange={(e) => setFormKey(e.target.value)}
                style={inputStyle}
                type="password"
              />
              <p style={{ fontSize: 12, color: 'var(--tg-theme-hint-color, #999)', marginTop: 4 }}>
                僅在需要更換金鑰時填寫新的值
              </p>
            </div>

            {/* Replace button */}
            <button
              onClick={handleReplace}
              disabled={submitting || !formLabel.trim()}
              style={{
                ...btnPrimaryStyle,
                opacity: submitting || !formLabel.trim() ? 0.5 : 1,
              }}
            >
              {submitting ? '送出中…' : '更新金鑰'}
            </button>

            {/* Test key button */}
            <button
              onClick={() => handleTestKey(editTarget.id)}
              disabled={submitting}
              style={{
                ...btnOutlineStyle,
                width: '100%',
                textAlign: 'center',
                opacity: submitting ? 0.5 : 1,
              }}
            >
              🧪 測試金鑰
            </button>

            {/* Divider */}
            <div style={{ borderTop: '1px solid var(--tg-theme-hint-color, #ccc)', marginTop: 8 }} />

            {/* Delete danger button */}
            <button
              onClick={handleDelete}
              disabled={submitting}
              style={{
                ...btnDangerStyle,
                opacity: submitting ? 0.5 : 1,
              }}
            >
              🗑️ 刪除此金鑰
            </button>
          </div>
        </PageContainer>
      </div>
    );
  }

  /* ══════════════════ LIST VIEW ══════════════════ */

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={headerStyle}>
        <button onClick={handleBack} style={backButtonStyle} aria-label="返回">←</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          API 金鑰管理
          <span style={badgeStyle}>{keys.length}</span>
        </h1>
      </div>

      <PageContainer>
        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div
              style={{
                width: 32,
                height: 32,
                border: '3px solid var(--tg-theme-hint-color, #ccc)',
                borderTopColor: 'var(--tg-theme-button-color, #40a7e3)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 12px',
              }}
            />
            <p style={{ color: 'var(--tg-theme-hint-color, #999)', fontSize: 14 }}>載入中…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Empty state */}
        {!loading && keys.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <p style={{ fontSize: 40, marginBottom: 8, opacity: 0.4 }}>🔑</p>
            <p style={{ color: 'var(--tg-theme-hint-color, #999)', fontSize: 15, marginBottom: 12 }}>
              尚未新增任何 API 金鑰
            </p>
            <button onClick={openAddForm} style={btnOutlineStyle}>
              立即新增
            </button>
          </div>
        )}

        {/* Key list */}
        {!loading && keys.length > 0 && (
          <div>
            {keys.map((key) => {
              const pc = platformColor(key.platform);
              const isExpanded = expandedId === key.id;
              const sc = statusColor(key.tested, key.valid);

              return (
                <div key={String(key.id)} style={cardStyle}>
                  {/* Main row — clickable to expand */}
                  <div
                    onClick={() => toggleExpand(String(key.id))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    {/* Platform badge */}
                    <span style={{ ...platformBadgeStyle, background: pc }}>
                      {key.platform}
                    </span>

                    {/* Label + prefix */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: 'var(--tg-theme-text-color, #000)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {key.label}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--tg-theme-hint-color, #999)',
                          fontFamily: 'monospace',
                          marginTop: 2,
                        }}
                      >
                        {key.prefix}•••••
                      </div>
                    </div>

                    {/* Status indicator */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginLeft: 8,
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ ...successDotStyle, background: sc }} />
                      <span style={{ fontSize: 12, color: sc }}>
                        {statusLabel(key.tested, key.valid)}
                      </span>
                    </div>

                    {/* Expand chevron */}
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 14,
                        color: 'var(--tg-theme-hint-color, #999)',
                        transition: 'transform 0.2s',
                      }}
                    >
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>

                  {/* Expanded action buttons */}
                  {isExpanded && (
                    <div style={actionRowStyle}>
                      <button
                        onClick={() => handleTestKey(String(key.id))}
                        disabled={submitting}
                        style={{ ...btnOutlineStyle, fontSize: 13, padding: '6px 12px' }}
                      >
                        🧪 測試
                      </button>
                      <button
                        onClick={() => openEditForm(key)}
                        style={{ ...btnOutlineStyle, fontSize: 13, padding: '6px 12px' }}
                      >
                        ✏️ 修改
                      </button>
                      <button
                        onClick={async () => {
                          const confirm = await openPopup(
                            '⚠️ 刪除金鑰',
                            `確定要刪除 ${key.platform} / ${key.label}？`,
                            [
                              { id: 'cancel', type: 'default' as const, text: '取消' },
                              { id: 'confirm', type: 'destructive' as const, text: '刪除' },
                            ],
                          );
                          if (confirm && confirm.id === 'confirm') {
                            setSubmitting(true);
                            try {
                              const res = await apiFetch(`${API_BASE}/api/keys/delete`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: key.id }),
                              });
                              const data = await res.json();
                              if (data.success) {
                                await openPopup('🗑️ 已刪除', `已刪除 ${key.platform} 金鑰`, [
                                  { id: 'ok', type: 'default' as const, text: '確定' },
                                ]);
                                await fetchKeys();
                              }
                            } catch {
                              await openPopup('❌ 刪除失敗', '無法連線至伺服器', [
                                { id: 'ok', type: 'default' as const, text: '確定' },
                              ]);
                            } finally {
                              setSubmitting(false);
                            }
                          }
                        }}
                        style={{ ...btnDangerOutlineStyle, fontSize: 13, padding: '6px 12px' }}
                      >
                        🗑️ 刪除
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add key button */}
        {!loading && (
          <div style={{ marginTop: 16, marginBottom: 24 }}>
            <button onClick={openAddForm} style={btnPrimaryStyle}>
              ＋ 新增金鑰
            </button>
          </div>
        )}
      </PageContainer>
    </div>
  );
}
