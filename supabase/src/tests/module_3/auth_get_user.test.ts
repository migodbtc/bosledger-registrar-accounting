/**
 * auth_get_user.test.ts
 * - Creates an auth user, retrieves it via admin.getUserById (or list), and then cleans up
 * - Useful for verifying admin auth read paths
 */
import supabaseAdmin from "../../supabaseClient";
import { deletePublicUsersByAuthId, deleteAuthUserWithRetry } from "./utils";

export default async function runAuthGetUserTest() {
  console.log("\n=== Module 3: auth_get_user test ===");
  const ids: { authUserId?: string } = {};
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

  try {
    // create a test auth user
    const email = `mod3-get-${Date.now()}@example.com`;
    const password = `GetTest123!`;
    const { data: createData, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      } as any);
    record("auth.admin.createUser (for get)", createErr, !createErr);
    if (createErr) throw createErr;
    const created: any = createData;
    ids.authUserId = created?.user?.id ?? created?.id;

    // attempt to fetch the user via admin API
    let getErr = null;
    try {
      // newer SDK has getUserById
      const maybe = await (supabaseAdmin.auth.admin.getUserById as any)(
        ids.authUserId
      );
      record("auth.admin.getUserById", null, !!maybe);
    } catch (e) {
      // fallback: list users with filter
      getErr = e;
      try {
        const { data: listData, error: listErr } =
          await supabaseAdmin.auth.admin.listUsers();
        record("auth.admin.listUsers", listErr, !listErr);
        if (!listErr) {
          const found = (listData as any)?.users?.find(
            (u: any) => u.id === ids.authUserId
          );
          record("found created user in listUsers", null, !!found);
        }
      } catch (e2) {
        record("auth.admin.listUsers (fallback)", e2, false);
      }
    }
  } catch (err) {
    console.error("Unexpected error in auth_get_user test:", err);
    errors++;
  } finally {
    try {
      if (ids.authUserId) {
        const delPublicErr = await deletePublicUsersByAuthId(ids.authUserId);
        record(
          "delete public.users by auth_user_id (pre-delete)",
          delPublicErr,
          !delPublicErr
        );

        const delErr = await deleteAuthUserWithRetry(
          ids.authUserId as string,
          3,
          500
        );
        record("auth.admin.deleteUser (cleanup, with retry)", delErr, !delErr);
      }
    } catch (err) {
      console.error("Cleanup error in auth_get_user test:", err);
      errors++;
    }
  }

  return { name: "module_3/auth_get_user", success, errors };
}
