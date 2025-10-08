This project: bosledger-registrar-accounting (web frontend)

Be concise and actionable. Focus on files and commands listed below — these are the quickest way to be productive.

1. Big picture (what to change and where)

- The repo contains a Vite + React (TypeScript) frontend in `web/` that talks to Supabase.
- App entry: `web/src/main.tsx` -> `web/src/App.tsx` (routing and providers). Use `@/` alias for imports (see `tsconfig.json`).
- Auth and data: `web/src/contexts/AuthContext.tsx` (supabase auth lifecycle and user profile fetch) and `web/src/utils/supabaseClient.ts` (supabase client + env var checks).
- Pages live under `web/src/pages/` (e.g. `Students.tsx`, `Dashboard.tsx`, `Profile.tsx`). Protected routes wrap pages with `ProtectedRoute` and `SidebarProvider` in `App.tsx`.

2. How the app runs (essential commands)

- Dev server: cd into `web/` and run `npm run dev` (script `vite`). Uses Vite with host localhost:8080 (see `vite.config.ts`).
- Build: `npm run build` or `npm run build:dev` for development-mode build.
- Lint: `npm run lint` runs eslint over the project.
- Important env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — client will throw if missing (`web/src/utils/supabaseClient.ts`).

3. Key conventions and patterns (project-specific)

- Path alias: `@/*` -> `src/*` is used everywhere. Prefer `@/...` imports (e.g. `@/contexts/AuthContext`). See `tsconfig.json` and `vite.config.ts` alias.
- Supabase usage: serverless client created in `supabaseClient.ts` and used directly from contexts/pages. Do not instantiate multiple clients. When modifying auth flows, update `AuthContext`'s `onAuthStateChange` and `getSession` usage.
- Dev role override: Auth profile fetching reads `sessionStorage.devRoleOverride` and will apply an override to the returned profile object — useful for role-based UI testing.
- UI primitives: components under `web/src/components/ui/` follow a primitive composition approach (Radix+Tailwind). Check a small component (e.g. `components/ui/button.tsx`) for styling patterns.

4. Tests and expectations

- Tests tree exists under `tests/`. Unit/component tests are expected for `web/` (Vitest + Testing Library recommended). There are placeholders and READMEs in `tests/`.
- E2E: put flows under `tests/e2e/flows`. End-to-end runs should bring up a test Supabase instance and the frontend (dev server or a built preview).

5. Integration points and gotchas

- Supabase: All client-side code reads env via `import.meta.env.VITE_*`. Never move dotenv usage into the browser bundle.
- Routes: The app uses react-router; protected routes rely on `useAuth`. Adding pages requires wiring them into `App.tsx` and the sidebar if navigation is expected.
- Server-side SQL/schema: Supabase schema and tests live under `supabase/tables.sql` and `tests/supabase/sql/schema.test.sql`.

6. Good-first-change examples (explicit)

- Add a new page: create `web/src/pages/MyNewPage.tsx`, export a default React component, then add a Route in `web/src/App.tsx` and link from sidebar.
- Modify auth profile fields: update `fetchUserProfile` in `web/src/contexts/AuthContext.tsx` and adjust any `userProfile` usages in pages (e.g. `Profile.tsx`).
- Fix missing env errors: if `supabaseClient` throws, add `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the repo root for local dev.

7. Files to open first when investigating a bug

- `web/src/contexts/AuthContext.tsx` — common source of auth/profile bugs.
- `web/src/utils/supabaseClient.ts` — env checks and client creation.
- `web/src/App.tsx` and `web/src/pages/*` — routing and page composition.
- `vite.config.ts` and `tsconfig.json` — path alias / dev server port.

8. Style and PR notes for AI edits

- Keep changes minimal and local to the `web/` folder unless task spans infra (e.g., supabase SQL in `supabase/`).
- Prefer TypeScript types already used in contexts (see `AuthContext.tsx` for User/Session shapes).
- When touching env usage, preserve `import.meta.env` access patterns.

If any of these descriptions are unclear or you'd like more examples (e.g., common SQL shapes, a sample PR that wires a page end-to-end), tell me which topic to expand and I'll iterate.
