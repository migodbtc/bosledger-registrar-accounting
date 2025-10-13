/*
{ "module":4, "prefix":"balances", "tags":["balances","payments"], "requiresEnv":[] }
*/
import supabaseAdmin from "../../supabaseClient";

export default async function runBalancesTest() {
  console.log("\n=== Module 4: student balances test ===");
  const ids: {
    userId?: string;
    courseId?: string;
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
    const courseName = `mod4-bal-course-${Date.now()}`;
    const { data: cData } = await supabaseAdmin
      .from("courses")
      .insert({ name: courseName, title: "Bal Course", years: 4 })
      .select();
    ids.courseId = cData?.[0]?.id;

    const email = `mod4-bal-${Date.now()}@example.com`;
    const { data: uData } = await supabaseAdmin
      .from("users")
      .insert({ email, first_name: "Bal", last_name: "User" })
      .select();
    ids.userId = uData?.[0]?.id;

    const { data: sData } = await supabaseAdmin
      .from("student_profile")
      .insert({ user_id: ids.userId, course_id: ids.courseId })
      .select();
    ids.studentProfileId = sData?.[0]?.id;

    // insert a balance for the student (test 1)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    const { data: bData, error: bErr } = await supabaseAdmin
      .from("balances")
      .insert({
        student_profile_id: ids.studentProfileId,
        amount_due: 1500.5,
        due_date: dueDate.toISOString().slice(0, 10),
      })
      .select();
    record("insert balances", bErr, !bErr);
    ids.balanceId = bData?.[0]?.id;

    // test 2: select balance and verify amount
    const { data: got, error: getErr } = await supabaseAdmin
      .from("balances")
      .select("id, student_profile_id, amount_due")
      .eq("id", ids.balanceId)
      .single();
    const ok = !getErr && Number((got as any)?.amount_due) === 1500.5;
    record("select balance (verify amount)", getErr, ok);
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
        record("delete student_profile", error, !error);
      }
      if (ids.userId) {
        const { error } = await supabaseAdmin
          .from("users")
          .delete()
          .eq("id", ids.userId);
        record("delete users", error, !error);
      }
      if (ids.courseId) {
        const { error } = await supabaseAdmin
          .from("courses")
          .delete()
          .eq("id", ids.courseId);
        record("delete courses", error, !error);
      }
    } catch (err) {
      console.error("Cleanup error in balances test:", err);
      errors++;
    }
  }

  return { name: "module_4/balances", success, errors };
}
