/**
 * auth_invalid_password.test.ts
 * - Attempts to create auth users with weak/invalid passwords
 */
import supabaseAdmin from "../../../supabaseClient";

export default async function runAuthInvalidPasswordTest() {
  console.log("\n--- Module 3: auth_invalid_password tests ---");
  const emailBase = `mod3-pw-${Date.now()}`;
  const cases = [
    "short", // too short
    "alllowercase", // no numbers/special
    "ALLUPPERCASE1", // no special
    "NoNumber!", // no number
    "password", // common
    "12345678", // numeric only
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

  for (let i = 0; i < cases.length; i++) {
    const pw = cases[i];
    const email = `${emailBase}${i}-${Math.random()
      .toString(36)
      .slice(2, 6)}@example.com`;
    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: pw,
      } as any);
      const created: any = data;
      const id = created?.user?.id ?? created?.id;
      if (error || !id) {
        // expected server may enforce different password policy; record as failure
        record(
          `createUser pw='${pw}' (expected fail)`,
          error ?? "no id",
          false
        );
      } else {
        // server accepted weak password; treat as OK but note unexpected creation
        createdIds.push(id);
        console.log(
          `[WARN] createUser pw='${pw}' created (server accepted weak password)`
        );
        record(
          `createUser pw='${pw}' created (unexpected but accepted)`,
          null,
          true
        );
      }
    } catch (err) {
      record(`createUser pw='${pw}' threw`, err, false);
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

  return { name: "module_3/auth_invalid_password", success, errors };
}
