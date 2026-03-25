import { memo } from 'react';
import { Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { RootComponents } from '@/components/root-components';

export const App = memo(() => {
  return (
    <AppShell>
      <RootComponents />
      <Outlet />
    </AppShell>
  );
});

App.displayName = 'App';
