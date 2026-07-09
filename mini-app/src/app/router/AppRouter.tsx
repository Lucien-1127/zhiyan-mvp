import { type FC, useState, useCallback, useRef, Suspense, lazy, useEffect } from 'react';
import { ROUTES, DEFAULT_DASHBOARD_TAB } from './routes';
import { TelegramAppShell } from '../../components/layout/TelegramAppShell';
import { useTelegramBackButton, useTelegramPopup } from '../../hooks/telegram';
import { requireAuth } from '../../hooks/useApi';

const DashboardPage = lazy(() => import('../../pages/dashboard/DashboardPage'));
const AlertsPage = lazy(() => import('../../pages/alerts/AlertsPage'));
const EventsPage = lazy(() => import('../../pages/events/EventsPage'));
const ProxyPage = lazy(() => import('../../pages/proxy/ProxyPage'));
const SettingsPage = lazy(() => import('../../pages/settings/SettingsPage'));
const ApiKeysPage = lazy(() => import('../../pages/keys/ApiKeysPage'));
const ApiStatusPage = lazy(() => import('../../pages/api-status/ApiStatusPage'));
const DreamDashboardPage = lazy(() => import('../../pages/dream/DreamDashboardPage'));
const ChatPage = lazy(() => import('../../pages/chat/ChatPage'));
const DocumentsPage = lazy(() => import('../../pages/documents/DocumentsPage'));
const AnalysisPage = lazy(() => import('../../pages/analysis/AnalysisPage'));
const ProfilePage = lazy(() => import('../../pages/profile/ProfilePage'));
const PromptFactoryPage = lazy(() => import('../../pages/prompts/PromptFactoryPage'));
const LogsPage = lazy(() => import('../../pages/logs/LogsPage'));

function LoadingFallback() {
  return <div style={{ padding: 24, textAlign: 'center', color: 'var(--tg-theme-hint-color, #999)' }}>載入中…</div>;
}

export const AppRouter: FC = () => {
  const [route, setRoute] = useState<typeof ROUTES[keyof typeof ROUTES]>(ROUTES.API_STATUS);
  const { openPopup } = useTelegramPopup();

  const isRoot = route === ROUTES.API_STATUS;
  useTelegramBackButton(!isRoot, useCallback(() => {
    setRoute(ROUTES.API_STATUS);
  }, []));

  // ── Token 驗證 ────────────────────────────────────
  useEffect(() => {
    requireAuth();
  }, []);

  const navigate = useCallback((route: string) => {
    setRoute(route as typeof ROUTES[keyof typeof ROUTES]);
  }, []);

  const handleRestartProxy = useCallback(async () => {
    const result = await openPopup(
      '確認重啟',
      '將中斷 Proxy 服務約 30 秒，確定繼續？',
      [
        { id: 'cancel', type: 'cancel', text: '取消' },
        { id: 'confirm', type: 'destructive', text: '重啟' },
      ],
    );
    if (result?.id === 'confirm') {
      await openPopup('已送出', 'Proxy 重啟指令已送出', [
        { id: 'ok', type: 'default', text: '確定' },
      ]);
    }
  }, [openPopup]);

  const backToRoot = useCallback(() => navigate(ROUTES.API_STATUS), [navigate]);

  // ── 滑動手勢：往右滑返回上一頁 ──
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isRoot) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // 從左邊緣 40px 內開始，向右滑 > 80px，垂直偏移 < 50px（避免誤觸上下滑）
    if (touchStartX.current < 40 && dx > 80 && Math.abs(dy) < 50) {
      setRoute(ROUTES.API_STATUS);
    }
  }, [isRoot]);

  const renderPage = () => {
    switch (route) {
      case ROUTES.DASHBOARD:
        return <DashboardPage
          defaultTab={DEFAULT_DASHBOARD_TAB}
          onNavigate={navigate}
          onRestartProxy={handleRestartProxy}
        />;
      case ROUTES.ALERTS:
        return <AlertsPage onBack={() => navigate(ROUTES.DASHBOARD)} />;
      case ROUTES.EVENTS:
        return <EventsPage onBack={() => navigate(ROUTES.DASHBOARD)} />;
      case ROUTES.PROXY:
        return <ProxyPage onBack={() => navigate(ROUTES.DASHBOARD)} />;
      case ROUTES.SETTINGS:
        return <SettingsPage onBack={backToRoot} />;
      case ROUTES.KEYS:
        return <ApiKeysPage onBack={() => navigate(ROUTES.DASHBOARD)} />;
      case ROUTES.API_STATUS:
        return <ApiStatusPage onBack={() => navigate(ROUTES.DASHBOARD)} />;
      case ROUTES.DREAM:
        return <DreamDashboardPage onNavigate={navigate} />;
      case ROUTES.CHAT:
        return <ChatPage onBack={backToRoot} />;
      case ROUTES.DOCUMENTS:
        return <DocumentsPage onBack={backToRoot} />;
      case ROUTES.ANALYSIS:
        return <AnalysisPage onBack={backToRoot} />;
      case ROUTES.PROFILE:
        return <ProfilePage onBack={backToRoot} />;
      case ROUTES.PROMPTS:
        return <PromptFactoryPage onBack={backToRoot} />;
      case ROUTES.LOGS:
        return <LogsPage onBack={backToRoot} />;
      case ROUTES.KNOWLEDGE:
        return <DocumentsPage onBack={backToRoot} />;
      default:
        return null;
    }
  };

  return (
    <TelegramAppShell>
      <div
        style={{ width: '100%', height: '100%', touchAction: 'pan-y' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Suspense fallback={<LoadingFallback />}>
          {renderPage()}
        </Suspense>
      </div>
    </TelegramAppShell>
  );
};
