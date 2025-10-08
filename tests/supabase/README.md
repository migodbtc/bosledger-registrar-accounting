supabase tests (schema & integration)

Recommendations:

- Use pgTAP for pure-SQL tests (schema, functions, triggers)
- Use a disposable Postgres instance (Docker / supabase CLI) for integration tests
- Place SQL tests under tests/supabase/sql and JS/TS integration tests under tests/supabase/integration

Placeholder files are provided to get started.
