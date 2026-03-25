# Frontend App

## Frontend Architecture

This frontend app mirrors the `supp-plan` layering style while staying lightweight for MVP delivery.

### Layers

- `src/index.tsx`: bootstrap and provider composition.
- `src/components/app`: app root composition (`AppShell` + `RootComponents` + route outlet).
- `src/components/root-components`: global UI host placeholders and network banner.
- `src/pages/routes.ts` + `src/pages/*/route.ts`: route registry and per-page route modules.
- `src/pages/*/index.tsx`: page entry modules.
- `src/i18n` + `src/constants/i18next`: centralized i18next config/constants.
- `src/assets/i18next`: locale dictionaries (`en`, `ar-AE`).
- `src/api`: RTK Query modules (`baseApi` + feature endpoint slices).
- `src/store`: Redux store setup and RTK Query middleware.

### i18n Rules

- Do not use `react-i18next` hooks/components (`useTranslation`, `Trans`, `withTranslation`).
- Components must use constants-based keys: `i18next.t(SOME_TRANSLATIONS.key)`.
- API/backend error messages are translated through `requestTranslateFunction(key, options?)`.
- Locale switcher updates both language and document `dir` for RTL/LTR.

### MVP Pages

- `home`: navigation hub.
- `profiles`: list/search/filter/load-more state.
- `stream-reader`: text stream rendering one character at a time.
- `queue-worker`: 20-request queue flow with websocket updates.

### Thin API Boundary

- `src/api/base`: shared `baseApi` + request error normalization.
- `src/api/profiles`, `src/api/stream`, `src/api/queue`: feature-level RTK Query modules.
- `src/api/queue/socket.ts`: websocket bridge for queue result events.

The current implementation is intentionally simple and ready for incremental backend alignment.

## PWA Installability

- PWA setup is handled by `vite-plugin-pwa`, not a hand-written service worker.
- Installability works best on `localhost` or over HTTPS.
- Chromium-based browsers may show the native browser install affordance when the installability criteria are met.
- Safari/iOS does not reliably fire `beforeinstallprompt`, so installation is expected through the browser/share menu.
- To verify PWA behavior:
  - run `pnpm --filter presight-frontend build`
  - serve the app and open Chrome DevTools > Application
  - confirm `manifest`, service worker, and installability checks are present
  - test update prompting by refreshing after a new build
