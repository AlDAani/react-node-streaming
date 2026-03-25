# Presight Frontend

React + Vite frontend. It includes:

- Route-based pages (`home`, `profiles`, `stream-reader`, `queue-worker`)
- RTK Query API layer
- i18next localization
- Radix UI Theme components
- PWA support (service worker + install/update handling)

## Tech Stack

- React 19
- TypeScript (strict)
- Vite 6
- `@reduxjs/toolkit` + RTK Query
- `react-router-dom`
- `@radix-ui/themes`
- `sass` (SCSS modules)
- `vitest` + Testing Library
- `vite-plugin-pwa`

## Requirements

- Node.js 20+ (recommended)
- pnpm 9+

## Local Development

Install dependencies:

```bash
pnpm install
```

Start dev server:

```bash
pnpm dev
```

Default frontend URL: `http://127.0.0.1:5173`

Dev proxy is configured to backend at `http://127.0.0.1:4000` for:

- `/health`
- `/api`
- `/socket.io` (WebSocket)

## Environment Variables

Create `.env.local` (optional):

```bash
VITE_API_BASE_URL=
```

Notes:

- In development, empty `VITE_API_BASE_URL` works with Vite proxy.
- In non-proxy environments, set `VITE_API_BASE_URL` to backend origin (for example `https://api.example.com`).

## Scripts

- `pnpm dev` / `pnpm start`: run Vite dev server
- `pnpm build`: production build
- `pnpm preview`: preview built app
- `pnpm typecheck`: TypeScript checks
- `pnpm lint`: ESLint checks
- `pnpm lint:fix`: ESLint autofix
- `pnpm format:check`: Prettier check
- `pnpm test`: run Vitest once
- `pnpm test:watch`: run Vitest in watch mode
- `pnpm check:forbidden-i18n`: guard against forbidden i18n API usage

## Project Structure

```text
src/
  api/            # RTK Query base + feature APIs (profiles, queue, stream)
  assets/         # static assets and i18n dictionary files
  components/     # shared UI/shell/error boundary
  constants/      # routes and i18n constants
  i18n/           # i18next setup + locale helpers
  pages/          # page modules and route definitions
  pwa/            # service worker registration + install/update context
  routing/        # router creation
  store/          # Redux store configuration
  styles/         # global styles
```

## Routing

Routes are registered in `src/pages/routes.ts` and assembled in `src/routing/create-app-router.ts`.

Current pages:

- `/` (home)
- `/profiles`
- `/stream-reader`
- `/queue-worker`

Each page exposes a `route.ts` module with lazy loading + i18n metadata.

## Data Flow

- `src/api/base/base-api.ts`: RTK Query root API.
- `src/api/base/base-query.ts`: shared fetch base query + normalized error mapping.
- Feature APIs (`profiles`, `queue`, `stream`) inject endpoints into `baseApi`.
- Redux store (`src/store/index.ts`) includes RTK Query reducer and middleware.

## i18n Conventions

- i18next is initialized before render in `src/index.tsx`.
- Locale context/provider is in `src/pages/components/i18next-provider`.
- Project uses translation key constants (for example `PROFILES_TRANSLATIONS`) instead of inline key strings.
- `pnpm check:forbidden-i18n` enforces the i18n usage policy.

## Styling

- Global styles: `src/styles/global.scss`
- Page/component styles: `*.module.scss`
- UI primitives: `@radix-ui/themes`
- Prefer Radix theme tokens/CSS variables in module styles.

## PWA

PWA is configured in `vite.config.ts` using `vite-plugin-pwa` with `generateSW`.

Implemented features:

- Manifest and icons
- Runtime caching strategy
- Install prompt support
- Service worker update detection and apply flow

Provider: `src/pwa/pwa-provider.tsx`

## Testing

Run all tests:

```bash
pnpm test
```

Run one test file:

```bash
pnpm test -- src/pages/profiles/infinite-scroll.test.tsx
```

## Build

```bash
pnpm build
pnpm preview
```

Output is generated to `dist/`.
