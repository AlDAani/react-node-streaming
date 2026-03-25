export type InstallHelpVariant = 'ios' | 'browser-menu' | null;

type InstallabilityEnvironment = {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
  isSecureContext: boolean;
  hasServiceWorker: boolean;
  isInstalled: boolean;
};

export const isIosDevice = ({
  userAgent,
  platform,
  maxTouchPoints,
}: Pick<InstallabilityEnvironment, 'userAgent' | 'platform' | 'maxTouchPoints'>) => {
  const normalizedUserAgent = userAgent.toLowerCase();

  return (
    /iphone|ipad|ipod/.test(normalizedUserAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
  );
};

export const getInstallHelpVariant = (
  environment: InstallabilityEnvironment,
): InstallHelpVariant => {
  if (environment.isInstalled || !environment.isSecureContext || !environment.hasServiceWorker) {
    return null;
  }

  if (isIosDevice(environment) && !/crios|fxios|edgios|opr\//i.test(environment.userAgent)) {
    return 'ios';
  }

  return 'browser-menu';
};
