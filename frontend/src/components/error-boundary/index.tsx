import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Heading, Text } from '@radix-ui/themes';
import classnames from 'classnames/bind';
import i18next from 'i18next';
import { COMMON_TRANSLATIONS } from '@/constants/i18next/common-translations';
import { ERROR_BOUNDARY_TRANSLATIONS } from './translations';

import styles from './index.module.scss';

const cn = classnames.bind(styles);
const BLOCK_NAME = 'Error-boundary';

export type ErrorBoundaryScope = 'global' | 'home' | 'profiles' | 'stream-reader' | 'queue-worker';

type AppErrorBoundaryProps = {
  scope: ErrorBoundaryScope;
  children?: ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

const SCOPE_TITLE_TRANSLATION: Record<ErrorBoundaryScope, string> = {
  global: ERROR_BOUNDARY_TRANSLATIONS.globalTitle,
  home: ERROR_BOUNDARY_TRANSLATIONS.homeTitle,
  profiles: ERROR_BOUNDARY_TRANSLATIONS.profilesTitle,
  'stream-reader': ERROR_BOUNDARY_TRANSLATIONS.streamReaderTitle,
  'queue-worker': ERROR_BOUNDARY_TRANSLATIONS.queueWorkerTitle,
};

const getErrorText = (error: Error | null) => {
  if (!error) {
    return null;
  }

  if (typeof error.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return String(error);
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);

    this.state = {
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AppErrorBoundary]', this.props.scope, error, errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({
      error: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const errorText = getErrorText(this.state.error);

    return (
      <section className={cn(BLOCK_NAME)} role="alert" aria-live="assertive">
        <Heading as="h2" className={cn(`${BLOCK_NAME}__title`)} size="4">
          {i18next.t(SCOPE_TITLE_TRANSLATION[this.props.scope])}
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
          <button className={cn(`${BLOCK_NAME}__button`)} type="button" onClick={this.handleRetry}>
            {i18next.t(COMMON_TRANSLATIONS.retry)}
          </button>

          {this.props.scope === 'global' ? (
            <button
              className={cn(`${BLOCK_NAME}__button`, `${BLOCK_NAME}__button--secondary`)}
              type="button"
              onClick={this.handleReload}
            >
              {i18next.t(ERROR_BOUNDARY_TRANSLATIONS.reloadApp)}
            </button>
          ) : null}
        </div>
      </section>
    );
  }
}
