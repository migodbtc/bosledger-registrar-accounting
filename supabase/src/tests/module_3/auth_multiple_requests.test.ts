/**
 * auth_multiple_requests.test.ts
 * - Fires many auth.createUser requests in parallel to exercise concurrency and rate-limit behavior
 * - Cleans up created users
 */
import supabaseAdmin from "../../supabaseClient";

export default async function runAuthMultipleRequestsTest() {
  console.log("\n--- Module 3: auth_multiple_requests tests ---");
  const parallel = 10; // keep modest to avoid throttling in CI
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

  const promises = [];
  for (let i = 0; i < parallel; i++) {
    const email = (await import("./utils")).makeTestEmail(`mod3-multi-${i}`);
    const pw = `MultiReq1!${i}-${Math.random().toString(36).slice(2, 4)}`;
    promises.push(
      supabaseAdmin.auth.admin
        .createUser({ email, password: pw } as any)
        .then((res: any) => {
          const created: any = res.data ?? res;
          const id = created?.user?.id ?? created?.id;
          if (res.error || !id) {
            record(`createUser parallel ${i}`, res.error ?? "no id", false);
          } else {
            createdIds.push(id);
            record(`createUser parallel ${i}`, null, true);
          }
        })
        .catch((err: any) =>
          record(`createUser parallel ${i} threw`, err, false)
        )
    );
  }

  await Promise.all(promises);

  // cleanup
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

  return { name: "module_3/auth_multiple_requests", success, errors };
}
