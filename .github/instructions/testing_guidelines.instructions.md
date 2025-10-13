---
applyTo: "supabase/**"
---

Guidance for Supabase TypeScript Test Harness  
Defines conventions for file naming, exports, logging, and CI-run behavior.

- **ref/** → Reference implementation only (no tests).
- **File prefixes (lowercase + underscores):**  
  1 scaffold*, 2 table*, 3 auth*, 4 student*, 5 registrar*, 6 accounting*, 7 admin*, 8 eol*.
- **Placement:** tests → `supabase/src/tests/module_<n>/`  
  ex: `supabase/src/tests/module_2/table_users.test.ts`.
- **Export contract:** each test exports  
  `export default async function (): Promise<{ success:number, errors:number }>`
- **Logging:**  
  Directory → `supabase/src/tests/module_<n>/logs/`  
  Filename → `<module>-<iso-timestamp>-<runId>-<status>.log`  
  (Windows-safe ISO → `new Date().toISOString().replace(/:/g,"-")`)  
  Status: running | success | error | partial  
  Structure:
  1. JSON header `{ module, startedAt, runId, env }`
  2. Event lines (JSON/plain)
  3. Summary `{ success, errors, durationMs }`
- **File metadata header (for manifest indexing):**
  ```ts
  /*
  { "module":2, "prefix":"table", "tags":["schema","crud"],
    "requiresEnv":["SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY"] }
  */
  ```
- **Helpers**
  Use _utils.ts or module_<n>/utils.ts for shared helpers (unique IDs, cleanup, logging).
  Avoid duplication; always import from these.
- **Test Style**
  - Minimal + idempotent
  - Clean up inserted rows
  - Use unique prefixes (timestamp + random)
- **Runner Integration**
  - Module indexes (e.g. module_2/index.ts) aggregate { success, errors }.
  - Keep contract consistent with supabase/src/runTests.ts.
- **CI / Retention**
  - Collect logs as CI artifacts.
  - Keep ≤50 logs per module or ≤30 days old.
- **AI / Generator Rules**
  - Import single supabase client from supabase/src/supabaseClient.ts.
  - Default export must be unnamed async function.
  - Include metadata header.

**Example Minimal Template**

```typescript
import { supabase } from "../../supabaseClient";

export default async function () {
  let success = 0,
    errors = 0;
  const tag = `test-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  try {
    const { error: iErr } = await supabase
      .from("example_table")
      .insert([{ name: "AI Test", tag }]);
    if (iErr) throw iErr;
    success++;
    const { data, error: sErr } = await supabase
      .from("example_table")
      .select("*")
      .eq("tag", tag);
    if (sErr || !data?.length) throw sErr || new Error("Row not found");
    success++;
    const { error: dErr } = await supabase
      .from("example_table")
      .delete()
      .eq("tag", tag);
    if (dErr) throw dErr;
    success++;
  } catch (e) {
    console.error("table_example.test:", e);
    errors++;
  }
  return { success, errors };
}
```
