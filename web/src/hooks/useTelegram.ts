import { useState, useEffect, useCallback } from 'react';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export function useTelegram() {
  const [isReady, setIsReady] = useState(false);
  const [isTelegramEnv, setIsTelegramEnv] = useState(false);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string>('');
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.initData) {
      setIsTelegramEnv(true);
      tg.ready();
      tg.expand();
      setInitData(tg.initData);
      setColorScheme(tg.colorScheme || 'light');

      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }

      const handleThemeChange = () => {
        setColorScheme(tg.colorScheme || 'light');
      };
      tg.onEvent('themeChanged', handleThemeChange);

      setIsReady(true);
      return () => {
        tg.offEvent('themeChanged', handleThemeChange);
      };
    } else {
      // Mock environment when running in desktop/mobile browser directly
      setIsTelegramEnv(false);
      setUser({
        id: 10854219,
        first_name: 'Alex',
        last_name: 'Developer',
        username: 'alex_dev'
      });
      setInitData('user=%7B%22id%22%3A10854219%2C%22first_name%22%3A%22Alex%22%2C%22username%22%3A%22alex_dev%22%7D');
      setIsReady(true);
    }
  }, []);

  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection') => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      try {
        if (type === 'selection') {
          tg.HapticFeedback.selectionChanged();
        } else if (type === 'success' || type === 'warning' || type === 'error') {
          tg.HapticFeedback.notificationOccurred(type);
        } else {
          tg.HapticFeedback.impactOccurred(type);
        }
      } catch {
        // Safe ignore
      }
    }
  }, []);

  const closeApp = useCallback(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.close) {
      tg.close();
    } else {
      window.close();
    }
  }, []);

  return {
    isReady,
    isTelegramEnv,
    user,
    initData,
    colorScheme,
    setColorScheme,
    triggerHaptic,
    closeApp
  };
}
