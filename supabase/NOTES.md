This folder contains a small TypeScript test harness that mirrors the web app's Supabase usage.

Mapping to web client

- Web client: `web/src/utils/supabaseClient.ts` creates a browser client using `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Test harness: `src/supabaseClient.ts` creates an admin client using `process.env.SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_URL`.

Security

- The service role key has elevated privileges. Keep it out of version control and never expose it to browsers or clients.

Usage

- See `README.md` for run instructions.
