# Tests README — web (Vitest) + supabase (TS harness)

This repository has two separate test areas:

- Web frontend tests: web/src/tests — Vitest + @testing-library/react unit/component tests.
- Supabase harness tests: supabase/src/tests — Node/TypeScript test harness that runs supabase integration checks.

This README explains what you need, where utilities/loggers live, and the exact commands (Windows cmd) to run each module's tests and inspect logs.

## Quick layout

- web/

  - src/tests/
    - setupTests.ts (vitest setup: jest-dom, IntersectionObserver mock)
    - test-utils.tsx (renderWithProviders: QueryClient + BrowserRouter)
    - module_2/log/ (test logs produced by module_2 tests)
    - module_2/unit/index.test.tsx
    - module_2/unit/test-logger.ts
    - module_3/unit/ (auth tests + logger)
      - register.test.tsx
      - login.test.tsx
      - test-logger.ts

- supabase/
  - src/tests/
    - module_2/ (reference supabase SQL tests + logs/)
    - module_3/ (supabase auth tests + logs/)
    - scripts/run_module_and_log.js (runner used by npm scripts)

## What each test stack uses

Web (frontend) tests

- Vitest (v3) — fast test runner integrated with Vite.
- @testing-library/react — DOM testing helpers and queries.
- @testing-library/jest-dom — convenient matchers (setup in `setupTests.ts`).
- jsdom — test DOM environment (required). If missing, Vitest may attempt to auto-install a package manager; install with npm to avoid bun auto-detection.
- framer-motion is used by UI; `setupTests.ts` includes a small IntersectionObserver mock so InView/viewport features won't crash in jsdom.

Files of interest (web):

- `web/src/tests/test-utils.tsx` — renderWithProviders(ui) wraps components with QueryClientProvider and BrowserRouter. Use this in all component/unit tests.
- `web/src/tests/setupTests.ts` — imports `@testing-library/jest-dom` and provides global mocks (IntersectionObserver) so components mount reliably.
- `web/src/tests/module_<n>/unit/test-logger.ts` — per-module logger that writes JSON-lines to `.../log/` and finalizes a result file with naming pattern:
  `module_<n>-<iso-timestamp>-<runId>-<status>.log` where status is `success` or `error`.

Supabase tests (server-side harness)

- Implemented in `supabase/` and run by node/ts-node. They exercise DB schema, auth flows and other integration points. These follow the project's `supabase` test conventions.
- `supabase/package.json` scripts typically include `module2:log`, `module3:log`, etc. These call `node scripts/run_module_and_log.js <module>` which runs tests and writes logs into `supabase/src/tests/module_<n>/logs/`.

## Log format (common convention used)

- Each log file is a JSON-lines file (one JSON object per line):
  1. Header line: { module, startedAt, runId, env }
  2. Event lines: { type: "event", outcome: "success"|"error", test: string, message?, error?, time }
  3. Summary line: { success: number, errors: number, durationMs }
- Final filename pattern (web tests created by our logger):
  `module_<n>-<ISO-timestamp>-<runId>-<status>.log`

## Where logs live

- Web unit logs: `web/src/tests/module_<n>/log/`
- Supabase harness logs: `supabase/src/tests/module_<n>/logs/`

## Commands — run tests (Windows cmd)

1. Web (frontend) — from the `web` folder

Install dependencies (once):

```cmd
cd web
npm install
```

If Vitest complains about missing jsdom, install it explicitly to avoid the auto-installer trying 'bun':

```cmd
npm install -D jsdom
```

Run all Vitest tests:

```cmd
npm run test
```

Run tests for a specific module (we added per-module scripts):

```cmd
npm run test:module2
npm run test:module3
```

Or run a single test file directly with Vitest:

```cmd
npm run test -- src\tests\module_3\unit\login.test.tsx
```

2. Supabase harness — from the `supabase` folder

Install dependencies (once):

```cmd
cd supabase
npm install
```

Run a module harness (script will run tests and write logs):

```cmd
npm run module2:log
npm run module3:log
```

These scripts invoke `node scripts/run_module_and_log.js <module>` which runs tests and writes logs into `supabase/src/tests/module_<n>/logs/`.

## Viewing logs (Windows cmd)

- Use `type` to print the JSON-lines log:

```cmd
type web\src\tests\module_2\log\<filename>.log
```

Or open the file in a code editor to inspect events and summary.

## Best practices & notes

- Tests should import the shared render helper: `import { renderWithProviders } from '@/tests/test-utils'` or use the relative path in tests under `src/tests/...` depending on resolution. We used relative imports in some tests to avoid alias issues in Vitest transforms.
- Mock the single Supabase client exported at `web/src/utils/supabaseClient.ts` in unit tests when you need to simulate backend responses. Example (Vitest):

```ts
vi.mock('@/utils/supabaseClient', () => ({ supabase: { from: () => ({ select: () => ... }) } }))
```

- The web tests include a small IntersectionObserver mock in `setupTests.ts` so framer-motion's viewport/InView code won't crash in jsdom.
- Each module test logger writes a temporary running file and renames it to the final filename on finalize (success/error). Tests call `finalizeRun()` in an `afterAll()` hook.

## Troubleshooting

- If Vitest attempts to auto-install dependencies and reports `bun` not found, install missing packages with npm (see jsdom) or add a `packageManager` field in `web/package.json` to prefer npm:

```json
"packageManager": "npm@9"
```

- If import alias `@/` doesn't resolve in tests, add the same alias to `vitest.config.ts` (already present) or use a relative import like `../../../pages/Index` in test files.

## Adding new module tests

1. Create `web/src/tests/module_X/unit/*.test.tsx` and use `renderWithProviders`.
2. Add a per-module logger `web/src/tests/module_X/unit/test-logger.ts` modeled after existing ones (header, events, finalizeRun).
3. Add a `test:moduleX` npm script in `web/package.json` (optional) that runs `vitest run src/tests/module_X/unit`.

## Wrap-up

This README is intended to live at `tests/README.md` as a single entry point explaining both test systems. If you want, I can also add a `scripts/run_all_tests.cmd` that runs `npm run test:module2` etc and copies all logs into a single `tests/logs/` folder for easier CI artifact publishing.
