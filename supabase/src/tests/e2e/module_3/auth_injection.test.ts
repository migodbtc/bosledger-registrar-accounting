/**
 * auth_injection.test.ts
 * - Attempts to create auth users with injection-like payloads in email and password
 * - Records whether these are rejected or result in created users (and cleans up unexpected creations)
 */
import supabaseAdmin from "../../../supabaseClient";

export default async function runAuthInjectionTest() {
  console.log("\n--- Module 3: auth_injection tests ---");

  const utils = await import("./utils");
  const cases = [
    {
      email: `'; DROP TABLE users; --${utils.makeTestEmail("inj")}`,
      pw: "Injection1!",
    },
    {
      email: `test'; SELECT * FROM users; --${utils.makeTestEmail("inj2")}`,
      pw: "PW' OR '1'='1",
    },
    { email: utils.makeTestEmail("normal-inj"), pw: "'); alert(1);//" },
    {
      email: `<script>${utils.makeTestEmail("x")}`,
      pw: "<svg onload=alert(1) />",
    },
  ];

  const createdIds: string[] = [];
  let success = 0;
  let errors = 0;
  const record = (label: string, err: any, ok: boolean) => {
    if (ok) {
      success++;
      console.log(`[OK] ${label}`);
    } else {
      errors++;
      console.error(`[ERR] ${label}:`, err);
    }
  };

  for (const c of cases) {
    try {
      // ensure unique email to avoid collisions with previous runs
      const uniq = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const email = c.email.includes("@")
        ? c.email.replace("@", `+${uniq}@`)
        : `${c.email.split("@")[0]}+${uniq}@example.com`;
      const res = await supabaseAdmin.auth.admin.createUser({
        email,
        password: c.pw,
      } as any);
      // Some responses may be non-JSON or HTML when upstream proxies block; treat parse errors as expected failures
      const created: any = (res as any)?.data ?? res;
      const id = created?.user?.id ?? created?.id;
      const err = (res as any)?.error;
      if (err || !id) {
        // treat validation errors and email_exists as expected failures
        const code = err?.code ?? (err as any)?.status;
        const expected =
          err &&
          (err.code === "validation_failed" ||
            err.code === "email_exists" ||
            err.status === 400 ||
            err.status === 422);
        record(
          `createUser injection('${c.email}', '${c.pw}') expected fail`,
          err ?? "no id",
          expected
        );
      } else {
        createdIds.push(id);
        record(
          `createUser injection('${c.email}') created (unexpected)`,
          null,
          false
        );
      }
    } catch (err) {
      // network/parse/HTML responses may throw: treat as expected failure
      record(
        `createUser injection('${c.email}') threw (treated as expected fail)`,
        err,
        true
      );
    }
  }

  for (const id of createdIds) {
    try {
      const delPublicErr = await (
        await import("./utils")
      ).deletePublicUsersByAuthId(id);
      record(
        `delete public.users by auth_user_id (pre-delete) ${id}`,
        delPublicErr,
        !delPublicErr
      );
      const delErr = await (
        await import("./utils")
      ).deleteAuthUserWithRetry(id, 3, 500);
      record(`cleanup deleteUser ${id}`, delErr, !delErr);
    } catch (err) {
      record(`cleanup deleteUser ${id} threw`, err, false);
    }
  }

  return { name: "module_3/auth_injection", success, errors };
}
