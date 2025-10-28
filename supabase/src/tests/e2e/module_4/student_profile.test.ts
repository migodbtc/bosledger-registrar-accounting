/*
{ "module":4, "prefix":"student", "tags":["student","crud"], "requiresEnv":[] }
*/
import supabaseAdmin from "../../../supabaseClient";

export default async function runStudentProfileTest() {
  console.log("\n=== Module 4: student_profile test ===");
  const ids: { userId?: string; courseId?: string; studentProfileId?: string } =
    {};
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
    // setup: create course and user (fail fast on errors but don't count as tests)
    const courseName = `mod4-course-${Date.now()}`;
    const { data: cData, error: cErr } = await supabaseAdmin
      .from("courses")
      .insert({ name: courseName, title: "Mod4 Course", years: 4 })
      .select();
    if (cErr) throw cErr;
    ids.courseId = cData?.[0]?.id;

    const email = `mod4-user-${Date.now()}@example.com`;
    const { data: uData, error: uErr } = await supabaseAdmin
      .from("users")
      .insert({ email, first_name: "Mod4", last_name: "User" })
      .select();
    if (uErr) throw uErr;
    ids.userId = uData?.[0]?.id;

    // test 1: insert student_profile linking the user and course
    const { data: sData, error: sErr } = await supabaseAdmin
      .from("student_profile")
      .insert({ user_id: ids.userId, course_id: ids.courseId })
      .select();
    record("insert student_profile", sErr, !sErr);
    if (sErr) throw sErr;
    ids.studentProfileId = sData?.[0]?.id;

    // test 2: verify student_profile can be selected and has expected fields
    const { data: got, error: getErr } = await supabaseAdmin
      .from("student_profile")
      .select("id, user_id, course_id, status")
      .eq("id", ids.studentProfileId)
      .single();
    const ok = !getErr && (got as any)?.user_id === ids.userId;
    record("select student_profile (linked ids verified)", getErr, ok);
  } catch (err) {
    console.error("Unexpected error in student_profile test:", err);
    errors++;
  } finally {
    // cleanup in reverse order
    try {
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
      console.error("Cleanup error in student_profile test:", err);
      errors++;
    }
  }

  return { name: "module_4/student_profile", success, errors };
}
