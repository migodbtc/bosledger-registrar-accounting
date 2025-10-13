This project: bosledger-registrar-accounting (web frontend)

Concise, actionable guidance for AI coding agents (20–40 lines):

- Big picture: Vite + React (TypeScript) frontend lives in `web/`. It talks to Supabase via a single client (`web/src/utils/supabaseClient.ts`). App entry is `web/src/main.tsx` -> `web/src/App.tsx` (routing + providers). Pages are under `web/src/pages/`.

- Auth & data flow: `AuthContext` (`web/src/contexts/AuthContext.tsx`) listens to Supabase auth state (`onAuthStateChange`) and calls `fetchUserProfile` (reads `users` + `student_profile`). Do not create additional Supabase clients—use the exported `supabase`.

- Key conventions:

  - Path alias `@/*` -> `src/*` (see `vite.config.ts` and `tsconfig*.json`). Use `@/...` imports.
  - UI primitives: `web/src/components/ui/*` implement Radix + Tailwind patterns (see `button.tsx`, `toaster.tsx`).
  - React Query is wired at top level (`@tanstack/react-query` in `App.tsx`).

- Important scripts & dev: cd into `web/` and run `npm run dev` (Vite on localhost:8080). Build: `npm run build` or `npm run build:dev`. Lint: `npm run lint`.

- Env & gotchas:

  - Required envs: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (checked in `web/src/utils/supabaseClient.ts` — it throws early if missing).
  - Keep env access via `import.meta.env` (do not inject server-side dotenv into client bundle).
  - Dev-only helpers: `sessionStorage.devRoleOverride` is applied when fetching profiles; `import.meta.env.DEV` gates `RoleSwitcherOverlay`.

- Routing & protection: Protected pages are wrapped with `ProtectedRoute` and `SidebarProvider` in `App.tsx`. When adding a page, add a Route there and update the sidebar if navigation is required (`web/src/components/AppSidebar.tsx`).

- Integration & infra:

  - Supabase schema is in `supabase/ref/tables.sql` (and other supabase/ folders). Tests that exercise schema live under `tests/`.
  - Do not instantiate multiple Supabase clients; reuse `web/src/utils/supabaseClient.ts`.

- Troubleshooting tips (practical):

  - Missing env error -> open `web/src/utils/supabaseClient.ts` to confirm the thrown message.
  - Auth oddities -> inspect `AuthContext.tsx` (onAuthStateChange, getSession) and session/profile fetch order.

- Good-first changes (explicit examples):

  1.  Add a page: create `web/src/pages/MyNewPage.tsx`, export default component, add Route in `web/src/App.tsx`, and link in `AppSidebar.tsx`.
  2.  Update profile fields: edit `fetchUserProfile` in `web/src/contexts/AuthContext.tsx` and adjust `userProfile` usages (e.g., `Profile.tsx`).
  3.  Fix env startup failure: add `.env.local` at project root with `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`.

- Files to open first (for most bugs): `web/src/contexts/AuthContext.tsx`, `web/src/utils/supabaseClient.ts`, `web/src/App.tsx`, `web/src/pages/*`, `vite.config.ts`, `tsconfig.json`.

If anything here is unclear or you want a longer variant (examples, sample PR, or tests to add), tell me which area to expand and I will iterate.
