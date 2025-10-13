/**
 * auth_create_delete.test.ts
 * - Creates an auth user via the Supabase Admin API
 * - Inserts a linked row in the `users` table using `auth_user_id`
 * - Verifies insertion and then cleans up both the table row and the auth user
 */
import supabaseAdmin from "../../supabaseClient";
import {
  deletePublicUsersByAuthId,
  deleteAuthUserWithRetry,
  makeTestEmail,
} from "./utils";

export default async function runAuthCreateDeleteTest() {
  console.log("\n=== Module 3: auth_create_delete test ===");
  const ids: { authUserId?: string; usersRowId?: string } = {};
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
    // Create an auth user using the service role key (admin API)
    const email = makeTestEmail("mod3-user");
    const password = `Test1234!`;
    const { data: createData, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      } as any);
    record("auth.admin.createUser", createErr, !createErr);
    if (createErr) throw createErr;
    // createData may contain user or user object depending on SDK; be defensive
    const authUser =
      (createData as any)?.user ?? (createData as any)?.user ?? createData;
    ids.authUserId = authUser?.id;

    // Insert a row in public.users linking to auth_user_id
    const { data: usersData, error: usersErr } = await supabaseAdmin
      .from("users")
      .insert({ email, auth_user_id: ids.authUserId })
      .select();
    record("insert users (linked to auth_user_id)", usersErr, !usersErr);
    if (!usersErr) ids.usersRowId = usersData?.[0]?.id;
  } catch (err) {
    console.error("Unexpected error in auth_create_delete test:", err);
    errors++;
  } finally {
    // Cleanup: delete users row first, then delete the auth user
    try {
      if (ids.usersRowId) {
        const { error } = await supabaseAdmin
          .from("users")
          .delete()
          .eq("id", ids.usersRowId);
        record("delete users (linked row)", error, !error);
      }

      if (ids.authUserId) {
        // try deleting any public.users rows that reference this auth user first
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
        record("auth.admin.deleteUser (with retry)", delErr, !delErr);
      }
    } catch (err) {
      console.error("Cleanup error in auth_create_delete test:", err);
      errors++;
    }
  }

  return { name: "module_3/auth_create_delete", success, errors };
}
