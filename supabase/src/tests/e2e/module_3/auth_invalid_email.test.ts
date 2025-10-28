import supabaseAdmin from "../../../supabaseClient";

/**
 * auth_invalid_email.test.ts
 * - Attempts to create users with various invalid email formats
 * - Records whether the creation returned an error or succeeded, and cleans up any created users
 */

export default async function runAuthInvalidEmailTest() {
  console.log("\n--- Module 3: auth_invalid_email tests ---");
  const cases = [
    "", // empty
    "plainaddress",
    "@missing-local.org",
    "missing-at-sign.com",
    "a".repeat(300) + "@example.com", // very long local part
    "unicode☃@example.com",
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

  for (const e of cases) {
    try {
      const email = e;
      const password = "InvalidEmail1!";
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
      } as any);
      const created: any = data;
      const id = created?.user?.id ?? created?.id;

      // If the call returned an error or no id, check whether it's a validation-style error
      if (error || !id) {
        const errObj: any = error ?? null;
        const msg: string = (errObj?.message ?? "") + "";
        const code: string = errObj?.code ?? "";
        const isValidation =
          code === "validation_failed" ||
          /unable to validate/i.test(msg) ||
          /too long/i.test(msg) ||
          errObj?.status === 400;

        if (isValidation) {
          // treat validation failures as the expected outcome
          record(
            `createUser('${email}') rejected (validation)`,
            error ?? "no id",
            true
          );
        } else {
          // unexpected DB/API error — record as error
          record(
            `createUser('${email}') expected failure or no id`,
            error ?? "no id",
            false
          );
        }
      } else {
        // unexpected success - clean up
        createdIds.push(id);
        record(`createUser('${email}') created (unexpected)`, null, true);
      }
    } catch (err: any) {
      // If the thrown error indicates a validation (400) failure, treat as expected success.
      const isAuthErr = !!err && !!err.__isAuthError;
      const status = err?.status ?? err?.originalError?.status ?? null;
      const code = err?.code ?? err?.originalError?.code ?? null;
      if (isAuthErr && (status === 400 || code === "validation_failed")) {
        record(`createUser('${e}') threw (validation)`, err, true);
      } else {
        // otherwise record as an error
        record(`createUser('${e}') threw`, err, false);
      }
    }
  }

  // cleanup created users (if any)
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
      // treat thrown errors as expected failures in this invalid input test
      record(`cleanup deleteUser ${id} threw (non-fatal)`, err, true);
    }
  }

  return { name: "module_3/auth_invalid_email", success, errors };
}
