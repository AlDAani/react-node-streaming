import { createContext } from 'react';
import type { InstallHelpVariant } from '@/pwa/installability';

type InstallMode = 'prompt' | 'manual' | 'none';

export type PwaContextValue = {
  canInstall: boolean;
  isInstalled: boolean;
  isInstallPromptAvailable: boolean;
  isUpdateAvailable: boolean;
  installMode: InstallMode;
  installHelpVariant: InstallHelpVariant;
  install: () => Promise<void>;
  applyUpdate: () => void;
};

export const defaultContextValue: PwaContextValue = {
  canInstall: false,
  isInstalled: false,
  isInstallPromptAvailable: false,
  isUpdateAvailable: false,
  installMode: 'none',
  installHelpVariant: null,
  install: async () => {},
  applyUpdate: () => {},
};

export const PwaContext = createContext<PwaContextValue>(defaultContextValue);

export type { InstallMode };
