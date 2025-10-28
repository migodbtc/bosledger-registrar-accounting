## Purpose

Short, actionable guide for AI coding agents working on this Vite + React + TypeScript project (shadcn-ui + Tailwind).

## Quick start (developer workflows)

- Run dev server: `npm run dev` — Vite will serve on port 8081 (see `vite.config.ts`).
- Build: `npm run build` (or `npm run build:dev` for a development build).
- Preview production build: `npm run preview`.
- Lint: `npm run lint`.

## Key entry points and files

- `src/main.tsx` — app entry (renders `<App />` into `#root`).
- `src/App.tsx` — routing and top-level providers (React Query `QueryClientProvider`, `TooltipProvider`, `Toaster`, `BrowserRouter`).
- `vite.config.ts` — alias `@` -> `./src` and dev server port (8081). Update aliases here if imports change.
- `src/pages/Index.tsx` — main UI and data flow for test cases; pattern to follow for new pages.
- `src/data/testCases.ts` and `src/types/test.ts` — canonical shape of test data (`TestCase`, `TestResult`, `Module`). Use these types for new features.
- `src/components/ui/*` — shadcn-style primitives and shared UI components (Card, Button, RadioGroup, etc.).
- `src/lib/utils.ts` — `cn(...)` helper wraps `clsx` + `twMerge`. Use it to merge Tailwind classNames.

## Project-specific conventions (follow these exactly)

- Use the `@` import alias for internal imports (e.g. `import { TestCard } from "@/components/TestCard"`). The alias is defined in `vite.config.ts`.
- When adding routes, edit `src/App.tsx` and add routes above the catch-all (`path="*"`) comment — this project relies on the ordering shown in `App.tsx`.
- UI components live under `src/components/ui/`. Reusable primitives follow the shadcn naming pattern (e.g. `Button`, `Card`, `Input`). Add variants and props consistent with existing files.
- Keep component files as single default exports (e.g. `export default Component`) where the pattern already exists.
- When composing class names, prefer `cn(...)` from `src/lib/utils.ts` instead of manually concatenating strings.

## Data & state patterns

- Test cases are static client-side data from `src/data/testCases.ts`. The `Index` page imports `testCasesByModule` and filters by selected module.
- Test results are stored in local React state (`useState`) and passed down to `TestHistory`. There is no server; exporting uses a client-side JSON blob (see `GradingForm.tsx`).

## Build / dev gotchas

- Vite dev runs on port 8081 (configured). If you change the port, update `vite.config.ts` and any local dev docs.
- The `lovable-tagger` plugin (`componentTagger`) is enabled only in development in `vite.config.ts`. Tagging is optional and only runs when `mode === 'development'`.

## Examples (how to make common changes)

- Add a new page: create `src/pages/MyPage.tsx`, then add a `<Route path="/my" element={<MyPage />} />` in `src/App.tsx` above the catch-all route.
- Use the `@` alias: `import { cn } from "@/lib/utils";` or `import { GradingForm } from "@/components/GradingForm";`.
- Create a new UI primitive: add file under `src/components/ui/` and re-export from an index file if you want it importable as `@/components/ui/{name}`.

## Files to inspect when diagnosing UI/behavior regressions

- `src/pages/Index.tsx` — main flow and state management.
- `src/components/GradingForm.tsx` — form validation, JSON export logic, and toast usage.
- `src/components/TestCard.tsx` and `src/components/TestHistory.tsx` — examples of component props and event handlers.
- `src/lib/utils.ts` — central utility for className merging.

## What agents must NOT assume

- There is no backend API in this project (data is local). Do not add server-side code without confirming new architecture.
- Do not change the root element id in `index.html` — `src/main.tsx` expects `document.getElementById('root')`.

## Where to add tests or linters

- Linting is available via `npm run lint` (ESLint). There are no unit tests in the repository by default — add tests under a `tests/` or `__tests__` folder and wire up scripts if needed.

If anything above is unclear or you want the file placed at a different repository root, tell me which path to target and I'll update it.
