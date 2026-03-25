import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Heading, Text } from '@radix-ui/themes';
import classnames from 'classnames/bind';
import i18next from 'i18next';
import type { SupportedLanguage } from '@/constants/i18next/i18next-constants';
import { ROUTE_PATHS } from '@/constants/routes/route-names';
import { useLocale } from '@/pages/components/i18next-provider/use-locale';
import { APP_SHELL_TRANSLATIONS } from './translations';

import styles from './app-shell.module.scss';

const cn = classnames.bind(styles);
const BLOCK_NAME = 'App-shell';

type AppShellProps = {
  children: ReactNode;
};

const getLinkClassName = ({ isActive }: { isActive: boolean }) =>
  cn(`${BLOCK_NAME}__nav-link`, {
    [`${BLOCK_NAME}__nav-link--active`]: isActive,
  });

export const AppShell = ({ children }: AppShellProps) => {
  const { locale, setLocale } = useLocale();

  return (
    <div className={cn(BLOCK_NAME)}>
      <header className={cn(`${BLOCK_NAME}__header`)}>
        <div>
          <Heading as="h1" className={cn(`${BLOCK_NAME}__title`)} size="6">
            {i18next.t(APP_SHELL_TRANSLATIONS.title)}
          </Heading>
          <Text as="p" className={cn(`${BLOCK_NAME}__subtitle`)} size="3">
            {i18next.t(APP_SHELL_TRANSLATIONS.description)}
          </Text>
        </div>

        <div className={cn(`${BLOCK_NAME}__controls`)}>
          <label className={cn(`${BLOCK_NAME}__language-switcher`)}>
            <Text as="span" size="2">
              {i18next.t(APP_SHELL_TRANSLATIONS.languageLabel)}
            </Text>
            <select
              className={cn(`${BLOCK_NAME}__language-select`)}
              value={locale}
              onChange={(event) => {
                void setLocale(event.target.value as SupportedLanguage);
              }}
            >
              <option value="en">{i18next.t(APP_SHELL_TRANSLATIONS.languageEnglish)}</option>
              <option value="ar-AE">{i18next.t(APP_SHELL_TRANSLATIONS.languageArabic)}</option>
            </select>
          </label>
        </div>
      </header>

      <div className={cn(`${BLOCK_NAME}__body`)}>
        <nav className={cn(`${BLOCK_NAME}__nav`)} aria-label="Main navigation">
          <NavLink className={getLinkClassName} to="/">
            <Text as="span">{i18next.t(APP_SHELL_TRANSLATIONS.home)}</Text>
          </NavLink>
          <NavLink className={getLinkClassName} to={`/${ROUTE_PATHS.profiles}`}>
            <Text as="span">{i18next.t(APP_SHELL_TRANSLATIONS.profiles)}</Text>
          </NavLink>
          <NavLink className={getLinkClassName} to={`/${ROUTE_PATHS.streamReader}`}>
            <Text as="span">{i18next.t(APP_SHELL_TRANSLATIONS.streamReader)}</Text>
          </NavLink>
          <NavLink className={getLinkClassName} to={`/${ROUTE_PATHS.queueWorker}`}>
            <Text as="span">{i18next.t(APP_SHELL_TRANSLATIONS.queueWorker)}</Text>
          </NavLink>
        </nav>

        <main className={cn(`${BLOCK_NAME}__main`)}>{children}</main>
      </div>
    </div>
  );
};
