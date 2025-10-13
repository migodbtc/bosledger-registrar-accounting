# Supabase TypeScript test harness

This small harness lets you run basic TypeScript tests against your Supabase project (cloud). It mirrors the client creation pattern in the web app but uses a service_role key so it can run admin operations for testing.

Setup

1. Copy `.env.example` to `.env` inside the `supabase/` folder.
2. Fill `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` with values from your Supabase project settings.
3. From the `supabase/` folder install dependencies:

```bash
cd supabase
npm install
```

Run tests

```bash
cd supabase
npm run test
```

What it does

- Runs a SELECT on the `courses` table (first 3 rows).
- Inserts a test course row, then deletes it (cleanup).

Notes

- This uses the service role key; keep it secret. Do not commit `.env` with keys.
- If your schema differs, update `src/runTests.ts` to target a table that exists.
