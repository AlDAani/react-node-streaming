type RegisterServiceWorkerOptions = {
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
};

type UpdateServiceWorkerFn = (reloadPage?: boolean) => Promise<void>;

const noopUpdateServiceWorker: UpdateServiceWorkerFn = async () => {};

const clearStaleDevServiceWorkers = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ('caches' in window) {
    const cacheKeys = await window.caches.keys();
    await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
  }
};

export const registerServiceWorker = (
  options: RegisterServiceWorkerOptions = {},
): UpdateServiceWorkerFn => {
  if (typeof window === 'undefined') {
    return noopUpdateServiceWorker;
  }

  if (import.meta.env.DEV) {
    void clearStaleDevServiceWorkers();
    return noopUpdateServiceWorker;
  }

  let updateServiceWorker = noopUpdateServiceWorker;

  void import('virtual:pwa-register')
    .then(({ registerSW }) => {
      updateServiceWorker = registerSW({
        immediate: true,
        onNeedRefresh: options.onNeedRefresh,
        onOfflineReady: options.onOfflineReady,
      });
    })
    .catch(() => {
      updateServiceWorker = noopUpdateServiceWorker;
    });

  return (reloadPage?: boolean) => updateServiceWorker(reloadPage);
};
