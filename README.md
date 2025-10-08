# bosledger-registrar-accounting

Lightweight frontend for the BosLedger registrar & accounting demo app.

This repository contains a Vite + React (TypeScript) web frontend that talks to Supabase, plus SQL and tests used for examples and end-to-end flows.

## Quick start (frontend)

1. Open a terminal and change into the web folder:

```cmd
cd web
```

2. Install dependencies (npm):

```cmd
npm install
```

3. Create a local env file with your Supabase client values (for local development):

Create a file named `.env.local` in the repository root or add the variables to your environment:

```
VITE_SUPABASE_URL=https://your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Start the dev server:

```cmd
cd web && npm run dev
```

The app uses Vite and defaults to localhost (see `web/vite.config.ts`).

## Useful scripts

- `npm run dev` — start Vite dev server (run inside `web/`).
- `npm run build` — production build.
- `npm run build:dev` — development-mode build (if present).
- `npm run lint` — run ESLint across the frontend.

Run these from the `web/` folder unless otherwise noted.

## Important files & where to look

- `web/src/main.tsx` → app entry and providers.
- `web/src/App.tsx` → routing and page wiring.
- `web/src/contexts/AuthContext.tsx` → Supabase auth lifecycle and profile fetching.
- `web/src/utils/supabaseClient.ts` → Supabase client and env-var checks.
- `web/src/pages/` → top-level pages used by the app.
- `web/src/components/ui/` → UI primitives (Radix + Tailwind patterns).

If you add pages, wire them into `web/src/App.tsx` and add sidebar links if navigation is expected.

## Conventions & gotchas

- Path alias: `@/*` maps to `src/*`. Use `@/` imports when possible (see `tsconfig.json` and `vite.config.ts`).
- Supabase env vars are read via `import.meta.env.VITE_*` in the browser. Do not move dotenv usage into runtime bundles.
- `AuthContext` supports a dev-role override via `sessionStorage.devRoleOverride` (useful for testing role-based UI).

## Tests

Unit and component tests live under `tests/`. The repo includes placeholders for E2E flows in `tests/e2e/flows`.

## Troubleshooting

- "Missing env vars" errors: ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set before starting the app.
- If the dev server port conflicts, check `web/vite.config.ts` for the configured host/port.

## Contributing / next steps

- To add a new page: create `web/src/pages/MyNewPage.tsx`, export the component, add a Route in `web/src/App.tsx`, and link it from the sidebar.
- Small, low-risk improvements: add a unit test for changed behavior, or a short README in `web/` describing local dev specifics.
