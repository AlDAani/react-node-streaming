import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { Theme } from '@radix-ui/themes';
import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { App } from '@/components/app';
import { APP_SHELL_TRANSLATIONS } from '@/components/layout/translations';
import { initI18next } from '@/i18n/instance';
import { i18next } from '@/i18n/instance';
import { I18nextProvider } from '@/pages/components/i18next-provider';
import { HomePage } from '@/pages/home';
import { HOME_TRANSLATIONS } from '@/pages/home/constants/translations';
import { store } from '@/store';

describe('router smoke', () => {
  beforeAll(async () => {
    await initI18next();
  });

  it('renders app shell and routed home page', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          Component: App,
          children: [
            {
              index: true,
              Component: HomePage,
            },
          ],
        },
      ],
      {
        initialEntries: ['/'],
      },
    );

    render(
      <Provider store={store}>
        <I18nextProvider>
          <Theme accentColor="blue" appearance="light" grayColor="slate">
            <RouterProvider router={router} />
          </Theme>
        </I18nextProvider>
      </Provider>,
    );

    expect(screen.getByText(i18next.t(APP_SHELL_TRANSLATIONS.title))).not.toBeNull();
    expect(screen.getByText(i18next.t(HOME_TRANSLATIONS.title))).not.toBeNull();
  });
});
