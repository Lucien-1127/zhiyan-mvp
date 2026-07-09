import { useEffect, useCallback, useState } from 'react';
import type { TelegramThemeState, TelegramViewportState } from '../../types/telegram';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData?: string;
        initDataUnsafe?: {
          user?: { id: number; first_name: string; last_name?: string; username?: string };
          start_param?: string;
          auth_date?: string;
          hash?: string;
        };
        version?: string;
        platform?: string;
        colorScheme?: 'light' | 'dark';
        themeParams?: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
          [key: string]: string | undefined;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: () => void;
          hideProgress: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
          setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        SettingsButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        showPopup: (params: { title?: string; message: string; buttons: { id: string; type?: 'default' | 'destructive' | 'cancel'; text: string }[] }, cb: (buttonId: string) => void) => void;
        showAlert: (message: string, cb?: () => void) => void;
        showConfirm: (message: string, cb: (confirmed: boolean) => void) => void;
        expand: () => void;
        close: () => void;
        ready: () => void;
        sendData: (data: string) => void;
        CloudStorage?: {
          setItem: (key: string, value: string, cb?: () => void) => void;
          getItem: (key: string, cb: (err: Error | null, value?: string) => void) => void;
          removeItem: (key: string, cb?: () => void) => void;
          getKeys: (cb: (err: Error | null, keys?: string[]) => void) => void;
        };
        onEvent: (eventType: string, cb: (...args: unknown[]) => void) => void;
        offEvent: (eventType: string, cb: (...args: unknown[]) => void) => void;
        disableVerticalSwipes: () => void;
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;
      };
    };
  }
}

function getTG(): any {
  return (window as any).Telegram?.WebApp ?? null;
}

export function isInTelegram(): boolean {
  return !!getTG();
}

/* ───────── Init ───────── */

export function useTelegramInit() {
  useEffect(() => {
    const tg = getTG();
    if (tg) {
      tg.ready();
      tg.expand();
      if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
    }
  }, []);
}

/* ───────── BackButton ───────── */

export function useTelegramBackButton(
  visible: boolean,
  onClick?: () => void,
) {
  useEffect(() => {
    const tg = getTG();
    if (!tg?.BackButton) return;
    if (visible) {
      tg.BackButton.show();
      if (onClick) tg.BackButton.onClick(onClick);
    } else {
      tg.BackButton.hide();
    }
    return () => {
      tg.BackButton.hide();
      if (onClick) tg.BackButton.offClick(onClick);
    };
  }, [visible, onClick]);
}

/* ───────── MainButton ───────── */

export interface MainButtonConfig {
  text: string;
  visible: boolean;
  enabled?: boolean;
  loading?: boolean;
}

export function useTelegramMainButton(
  config: MainButtonConfig,
  onClick?: () => void,
) {
  useEffect(() => {
    const tg = getTG();
    if (!tg?.MainButton) return;
    const mb = tg.MainButton;

    mb.setParams({
      text: config.text,
      is_visible: config.visible,
      is_active: config.enabled ?? true,
    });

    if (config.loading) mb.showProgress();
    else mb.hideProgress();

    if (onClick) mb.onClick(onClick);
    return () => {
      mb.hide();
      mb.hideProgress();
      if (onClick) mb.offClick(onClick);
    };
  }, [config.text, config.visible, config.enabled, config.loading, onClick]);
}

/* ───────── Popup ───────── */

export function useTelegramPopup() {
  const openPopup = useCallback(
    (title: string, message: string, buttons: { id: string; type: 'default' | 'destructive' | 'cancel'; text: string }[]):
      Promise<{ id: string } | null> => {
      return new Promise((resolve) => {
        const tg = getTG();
        if (!tg?.showPopup) {
          resolve(null);
          return;
        }
        tg.showPopup({ title, message, buttons }, (buttonId: string) => {
          resolve({ id: buttonId });
        });
      });
    },
    [],
  );
  return { openPopup };
}

/* ───────── Theme ───────── */

export function useTelegramTheme(): TelegramThemeState {
  const [theme, setTheme] = useState<TelegramThemeState>(() => {
    const tg = getTG();
    if (!tg) return { colorScheme: 'light' };
    return {
      colorScheme: tg.colorScheme ?? 'light',
      bgColor: tg.themeParams?.bg_color,
      textColor: tg.themeParams?.text_color,
      hintColor: tg.themeParams?.hint_color,
      linkColor: tg.themeParams?.link_color,
      buttonColor: tg.themeParams?.button_color,
      buttonTextColor: tg.themeParams?.button_text_color,
      secondaryBgColor: tg.themeParams?.secondary_bg_color,
    };
  });

  useEffect(() => {
    const tg = getTG();
    if (!tg?.onEvent) return;
    const handler = () => {
      setTheme({
        colorScheme: tg.colorScheme ?? 'light',
        bgColor: tg.themeParams?.bg_color,
        textColor: tg.themeParams?.text_color,
        hintColor: tg.themeParams?.hint_color,
        linkColor: tg.themeParams?.link_color,
        buttonColor: tg.themeParams?.button_color,
        buttonTextColor: tg.themeParams?.button_text_color,
        secondaryBgColor: tg.themeParams?.secondary_bg_color,
      });
    };
    tg.onEvent('themeChanged', handler);
    return () => tg.offEvent('themeChanged', handler);
  }, []);

  return theme;
}

/* ───────── Viewport ───────── */

export function useTelegramViewport(): TelegramViewportState {
  const [vp, setVp] = useState<TelegramViewportState>(() => {
    const tg = getTG();
    if (!tg) return { width: window.innerWidth, height: window.innerHeight, isExpanded: true, isStable: false };
    return {
      width: window.innerWidth,
      height: tg.viewportHeight || window.innerHeight,
      isExpanded: tg.isExpanded,
      isStable: false,
    };
  });

  useEffect(() => {
    const tg = getTG();
    if (!tg?.onEvent) return;
    const handler = () => {
      setVp({
        width: window.innerWidth,
        height: tg.viewportHeight || window.innerHeight,
        isExpanded: tg.isExpanded,
        isStable: true,
      });
    };
    tg.onEvent('viewportChanged', handler);
    return () => tg.offEvent('viewportChanged', handler);
  }, []);

  return vp;
}
