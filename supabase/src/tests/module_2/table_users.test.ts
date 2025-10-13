import supabaseAdmin from "../../supabaseClient";

export default async function runUsersTest() {
  console.log("\n=== Module 2: users test ===");
  const ids: { userId?: string } = {};
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
    const email = `test-user-${Date.now()}@example.com`;
    const user = {
      email,
      first_name: "Test",
      last_name: "User",
    } as any;

    // Insert user with no explicit role; DB should apply default role ('user')
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert(user)
      .select();
    record("insert users (no role)", error, !error);
    if (!error) ids.userId = data?.[0]?.id;

    // Verify default role was applied
    if (ids.userId) {
      const { data: got, error: getErr } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("id", ids.userId)
        .single();
      const ok = !getErr && (got as any)?.role === "user";
      record("default role is 'user'", getErr ?? null, ok);
    }

    // Try to insert a user with an invalid role value to ensure enum/constraint rejects it
    const badEmail = `test-user-badrole-${Date.now()}@example.com`;
    const { error: badErr } = await supabaseAdmin
      .from("users")
      .insert({
        email: badEmail,
        first_name: "Bad",
        last_name: "Role",
        role: "not_a_role",
      } as any)
      .select();
    // We expect an error from the DB; success when there is an error
    record("insert users with invalid role (should fail)", badErr, !!badErr);
  } catch (err) {
    console.error("Unexpected error in users test:", err);
    errors++;
  } finally {
    try {
      if (ids.userId) {
        const { error } = await supabaseAdmin
          .from("users")
          .delete()
          .eq("id", ids.userId);
        record("delete users", error, !error);
      }
      // remove any leftover bad-role row if it somehow inserted
      try {
        const { data: rows } = await supabaseAdmin
          .from("users")
          .select("id")
          .ilike("email", "%test-user-badrole-%");
        if (rows?.length) {
          for (const r of rows) {
            await supabaseAdmin
              .from("users")
              .delete()
              .eq("id", (r as any).id);
          }
        }
      } catch (cleanupErr) {
        // non-fatal
        console.error("Cleanup (bad-role) error:", cleanupErr);
      }
    } catch (err) {
      console.error("Cleanup error in users test:", err);
      errors++;
    }
  }

  return { name: "module_2/users", success, errors };
}
