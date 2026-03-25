import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { Heading, Text } from '@radix-ui/themes';
import classnames from 'classnames/bind';
import i18next from 'i18next';
import type { ErrorBoundaryScope } from './index';
import { ERROR_BOUNDARY_TRANSLATIONS } from './translations';

import styles from './index.module.scss';

const cn = classnames.bind(styles);
const BLOCK_NAME = 'Error-boundary';

type RouteErrorFallbackProps = {
  scope: ErrorBoundaryScope;
};

const SCOPE_TITLE_TRANSLATION: Record<ErrorBoundaryScope, string> = {
  global: ERROR_BOUNDARY_TRANSLATIONS.globalTitle,
  home: ERROR_BOUNDARY_TRANSLATIONS.homeTitle,
  profiles: ERROR_BOUNDARY_TRANSLATIONS.profilesTitle,
  'stream-reader': ERROR_BOUNDARY_TRANSLATIONS.streamReaderTitle,
  'queue-worker': ERROR_BOUNDARY_TRANSLATIONS.queueWorkerTitle,
};

const getRouteErrorMessage = (error: unknown): string | null => {
  if (isRouteErrorResponse(error)) {
    if (typeof error.data === 'string' && error.data.trim()) {
      return error.data;
    }

    if (typeof error.statusText === 'string' && error.statusText.trim()) {
      return error.statusText;
    }

    return `${error.status}`;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return null;
};

export const RouteErrorFallback = ({ scope }: RouteErrorFallbackProps) => {
  const error = useRouteError();
  const errorText = getRouteErrorMessage(error);

  return (
    <section className={cn(BLOCK_NAME)} role="alert" aria-live="assertive">
      <Heading as="h2" className={cn(`${BLOCK_NAME}__title`)} size="4">
        {i18next.t(SCOPE_TITLE_TRANSLATION[scope])}
      </Heading>

      <Text as="p" className={cn(`${BLOCK_NAME}__description`)} size="2">
        {i18next.t(ERROR_BOUNDARY_TRANSLATIONS.description)}
      </Text>

      {errorText ? (
        <Text as="p" className={cn(`${BLOCK_NAME}__details`)} size="2">
          {errorText}
        </Text>
      ) : null}

      <div className={cn(`${BLOCK_NAME}__actions`)}>
        <button
          className={cn(`${BLOCK_NAME}__button`, `${BLOCK_NAME}__button--secondary`)}
          type="button"
          onClick={() => {
            window.location.reload();
          }}
        >
          {i18next.t(ERROR_BOUNDARY_TRANSLATIONS.reloadApp)}
        </button>
      </div>
    </section>
  );
};
