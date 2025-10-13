import supabaseAdmin from "../../supabaseClient";

export default async function runStudentProfileTest() {
  console.log("\n=== Module 2: student_profile test ===");
  const ids: { courseId?: string; userId?: string; studentProfileId?: string } =
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
    // create course and user since student_profile depends on them
    const { data: cData, error: cErr } = await supabaseAdmin
      .from("courses")
      .insert({ name: `tp-course-${Date.now()}`, title: "TP Course", years: 1 })
      .select();
    record("insert courses (for student_profile)", cErr, !cErr);
    if (!cErr) ids.courseId = cData?.[0]?.id;

    const { data: uData, error: uErr } = await supabaseAdmin
      .from("users")
      .insert({
        email: `tp-user-${Date.now()}@example.com`,
        first_name: "TP",
        last_name: "User",
      })
      .select();
    record("insert users (for student_profile)", uErr, !uErr);
    if (!uErr) ids.userId = uData?.[0]?.id;

    const sp = {
      user_id: ids.userId,
      course_id: ids.courseId,
      enrollment_date: new Date().toISOString().split("T")[0],
    } as any;
    const { data, error } = await supabaseAdmin
      .from("student_profile")
      .insert(sp)
      .select();
    record("insert student_profile", error, !error);
    if (!error) ids.studentProfileId = data?.[0]?.id;
  } catch (err) {
    console.error("Unexpected error in student_profile test:", err);
    errors++;
  } finally {
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
        record("delete users (for student_profile)", error, !error);
      }
      if (ids.courseId) {
        const { error } = await supabaseAdmin
          .from("courses")
          .delete()
          .eq("id", ids.courseId);
        record("delete courses (for student_profile)", error, !error);
      }
    } catch (err) {
      console.error("Cleanup error in student_profile test:", err);
      errors++;
    }
  }

  return { name: "module_2/student_profile", success, errors };
}
