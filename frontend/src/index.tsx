import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { Theme } from '@radix-ui/themes';
import { AppErrorBoundary } from '@/components/error-boundary';
import { initI18next } from '@/i18n/instance';
import { I18nextProvider } from '@/pages/components/i18next-provider';
import { PwaProvider } from '@/pwa/pwa-provider';
import { createAppRouter } from '@/routing/create-app-router';
import { store } from '@/store';

import '@radix-ui/themes/styles.css';
import '@/styles/global.scss';

const ROOT_ELEMENT = document.getElementById('root');

const bootstrap = async () => {
  if (!ROOT_ELEMENT) {
    throw new Error('Root element not found.');
  }

  await initI18next();

  const router = createAppRouter();

  createRoot(ROOT_ELEMENT).render(
    <StrictMode>
      <AppErrorBoundary scope="global">
        <Provider store={store}>
          <PwaProvider>
            <I18nextProvider>
              <Theme accentColor="blue" appearance="light" grayColor="slate">
                <RouterProvider router={router} />
              </Theme>
            </I18nextProvider>
          </PwaProvider>
        </Provider>
      </AppErrorBoundary>
    </StrictMode>,
  );
};

void bootstrap();
