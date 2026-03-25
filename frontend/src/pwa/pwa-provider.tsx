import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getInstallHelpVariant } from '@/pwa/installability';
import { type InstallMode, PwaContext, type PwaContextValue } from '@/pwa/pwa-context';
import { registerServiceWorker } from '@/pwa/register-service-worker';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
};

const isInstalledDisplayMode = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  );
};

type PwaProviderProps = {
  children: ReactNode;
};

export const PwaProvider = ({ children }: PwaProviderProps) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(isInstalledDisplayMode);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const updateServiceWorkerRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    updateServiceWorkerRef.current = registerServiceWorker({
      onNeedRefresh: () => {
        setIsUpdateAvailable(true);
      },
    });

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    const syncInstalledState = () => {
      setIsInstalled(isInstalledDisplayMode());
    };

    const displayMode = window.matchMedia('(display-mode: standalone)');

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    displayMode.addEventListener('change', syncInstalledState);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      displayMode.removeEventListener('change', syncInstalledState);
    };
  }, []);

  const installHelpVariant = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return getInstallHelpVariant({
      userAgent: window.navigator.userAgent,
      platform: window.navigator.platform,
      maxTouchPoints: window.navigator.maxTouchPoints,
      isSecureContext: window.isSecureContext,
      hasServiceWorker: 'serviceWorker' in window.navigator,
      isInstalled,
    });
  }, [isInstalled]);

  const installMode: InstallMode = deferredPrompt
    ? 'prompt'
    : installHelpVariant
      ? 'manual'
      : 'none';

  const install = useCallback(async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const applyUpdate = useCallback(() => {
    if (!updateServiceWorkerRef.current) {
      return;
    }

    setIsUpdateAvailable(false);
    void updateServiceWorkerRef.current(true);
  }, []);

  const value = useMemo<PwaContextValue>(
    () => ({
      canInstall: !isInstalled && installMode !== 'none',
      isInstalled,
      isInstallPromptAvailable: Boolean(deferredPrompt),
      isUpdateAvailable,
      installMode,
      installHelpVariant,
      install,
      applyUpdate,
    }),
    [
      applyUpdate,
      deferredPrompt,
      install,
      installHelpVariant,
      installMode,
      isInstalled,
      isUpdateAvailable,
    ],
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
};
