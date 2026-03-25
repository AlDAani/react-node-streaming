import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { COMMON_TRANSLATIONS } from '@/constants/i18next/common-translations';
import { i18next, initI18next } from '@/i18n/instance';
import { AppErrorBoundary } from './index';
import { ERROR_BOUNDARY_TRANSLATIONS } from './translations';

const ThrowAlways = () => {
  throw new Error('profiles crashed');
};

describe('app error boundary', () => {
  beforeAll(async () => {
    await initI18next();
  });

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders service fallback when child throws', () => {
    render(
      <AppErrorBoundary scope="profiles">
        <ThrowAlways />
      </AppErrorBoundary>,
    );

    expect(screen.getByText(i18next.t(ERROR_BOUNDARY_TRANSLATIONS.profilesTitle))).not.toBeNull();
    expect(screen.getByText('profiles crashed')).not.toBeNull();
  });

  it('retries and recovers when child no longer throws', () => {
    let shouldThrow = true;

    const ThrowUntilRetry = () => {
      if (shouldThrow) {
        throw new Error('temporary home failure');
      }

      return <div>home restored</div>;
    };

    render(
      <AppErrorBoundary scope="home">
        <ThrowUntilRetry />
      </AppErrorBoundary>,
    );

    expect(screen.getByText(i18next.t(ERROR_BOUNDARY_TRANSLATIONS.homeTitle))).not.toBeNull();

    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: i18next.t(COMMON_TRANSLATIONS.retry) }));

    expect(screen.getByText('home restored')).not.toBeNull();
  });

  it('shows reload action for global boundary', () => {
    render(
      <AppErrorBoundary scope="global">
        <ThrowAlways />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole('button', { name: /reload app/i })).not.toBeNull();
  });
});
