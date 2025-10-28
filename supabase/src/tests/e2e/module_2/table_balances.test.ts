import supabaseAdmin from "../../../supabaseClient";

export default async function runBalancesTest() {
  console.log("\n=== Module 2: balances test ===");
  const ids: {
    courseId?: string;
    userId?: string;
    studentProfileId?: string;
    balanceId?: string;
  } = {};
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
    const { data: cData, error: cErr } = await supabaseAdmin
      .from("courses")
      .insert({
        name: `bal-course-${Date.now()}`,
        title: "BAL Course",
        years: 1,
      })
      .select();
    record("insert courses (for balances)", cErr, !cErr);
    if (!cErr) ids.courseId = cData?.[0]?.id;

    const { data: uData, error: uErr } = await supabaseAdmin
      .from("users")
      .insert({
        email: `bal-user-${Date.now()}@example.com`,
        first_name: "BAL",
        last_name: "User",
      })
      .select();
    record("insert users (for balances)", uErr, !uErr);
    if (!uErr) ids.userId = uData?.[0]?.id;

    const { data: spData, error: spErr } = await supabaseAdmin
      .from("student_profile")
      .insert({
        user_id: ids.userId,
        course_id: ids.courseId,
        enrollment_date: new Date().toISOString().split("T")[0],
      })
      .select();
    record("insert student_profile (for balances)", spErr, !spErr);
    if (!spErr) ids.studentProfileId = spData?.[0]?.id;

    const balance = {
      student_profile_id: ids.studentProfileId,
      amount_due: 1000,
      due_date: new Date(Date.now() + 7 * 24 * 3600 * 1000)
        .toISOString()
        .split("T")[0],
    } as any;
    const { data, error } = await supabaseAdmin
      .from("balances")
      .insert(balance)
      .select();
    record("insert balances", error, !error);
    if (!error) ids.balanceId = data?.[0]?.id;
  } catch (err) {
    console.error("Unexpected error in balances test:", err);
    errors++;
  } finally {
    try {
      if (ids.balanceId) {
        const { error } = await supabaseAdmin
          .from("balances")
          .delete()
          .eq("id", ids.balanceId);
        record("delete balances", error, !error);
      }
      if (ids.studentProfileId) {
        const { error } = await supabaseAdmin
          .from("student_profile")
          .delete()
          .eq("id", ids.studentProfileId);
        record("delete student_profile (for balances)", error, !error);
      }
      if (ids.userId) {
        const { error } = await supabaseAdmin
          .from("users")
          .delete()
          .eq("id", ids.userId);
        record("delete users (for balances)", error, !error);
      }
      if (ids.courseId) {
        const { error } = await supabaseAdmin
          .from("courses")
          .delete()
          .eq("id", ids.courseId);
        record("delete courses (for balances)", error, !error);
      }
    } catch (err) {
      console.error("Cleanup error in balances test:", err);
      errors++;
    }
  }

  return { name: "module_2/balances", success, errors };
}
