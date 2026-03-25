import { useEffect, useState } from 'react';
import { Text } from '@radix-ui/themes';
import classnames from 'classnames/bind';
import i18next from 'i18next';
import { COMMON_TRANSLATIONS } from '@/constants/i18next/common-translations';

import styles from './index.module.scss';

const cn = classnames.bind(styles);
const BLOCK_NAME = 'Root-components';

const NetworkBanner = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className={cn(`${BLOCK_NAME}__network-banner`)}>
      <Text as="span">{i18next.t(COMMON_TRANSLATIONS.offline)}</Text>
    </div>
  );
};

export const RootComponents = () => {
  return (
    <>
      <NetworkBanner />
      <div className={cn(`${BLOCK_NAME}__portal-host`)} id="global-toast-root" />
      <div className={cn(`${BLOCK_NAME}__portal-host`)} id="global-modal-root" />
    </>
  );
};
