import supabaseAdmin from "../../../supabaseClient";

export default async function runEnrollmentsTest() {
  console.log("\n=== Module 2: enrollments test ===");
  const ids: {
    courseId?: string;
    userId?: string;
    studentProfileId?: string;
    enrollmentId?: string;
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
        name: `enr-course-${Date.now()}`,
        title: "ENR Course",
        years: 1,
      })
      .select();
    record("insert courses (for enrollments)", cErr, !cErr);
    if (!cErr) ids.courseId = cData?.[0]?.id;

    const { data: uData, error: uErr } = await supabaseAdmin
      .from("users")
      .insert({
        email: `enr-user-${Date.now()}@example.com`,
        first_name: "ENR",
        last_name: "User",
      })
      .select();
    record("insert users (for enrollments)", uErr, !uErr);
    if (!uErr) ids.userId = uData?.[0]?.id;

    const { data: spData, error: spErr } = await supabaseAdmin
      .from("student_profile")
      .insert({
        user_id: ids.userId,
        course_id: ids.courseId,
        enrollment_date: new Date().toISOString().split("T")[0],
      })
      .select();
    record("insert student_profile (for enrollments)", spErr, !spErr);
    if (!spErr) ids.studentProfileId = spData?.[0]?.id;

    const enrollment = {
      student_profile_id: ids.studentProfileId,
      course_id: ids.courseId,
      year_level: "1",
      semester: "1",
      school_year: "2025-2026",
    } as any;
    const { data, error } = await supabaseAdmin
      .from("enrollments")
      .insert(enrollment)
      .select();
    record("insert enrollments", error, !error);
    if (!error) ids.enrollmentId = data?.[0]?.id;
  } catch (err) {
    console.error("Unexpected error in enrollments test:", err);
    errors++;
  } finally {
    try {
      if (ids.enrollmentId) {
        const { error } = await supabaseAdmin
          .from("enrollments")
          .delete()
          .eq("id", ids.enrollmentId);
        record("delete enrollments", error, !error);
      }
      if (ids.studentProfileId) {
        const { error } = await supabaseAdmin
          .from("student_profile")
          .delete()
          .eq("id", ids.studentProfileId);
        record("delete student_profile (for enrollments)", error, !error);
      }
      if (ids.userId) {
        const { error } = await supabaseAdmin
          .from("users")
          .delete()
          .eq("id", ids.userId);
        record("delete users (for enrollments)", error, !error);
      }
      if (ids.courseId) {
        const { error } = await supabaseAdmin
          .from("courses")
          .delete()
          .eq("id", ids.courseId);
        record("delete courses (for enrollments)", error, !error);
      }
    } catch (err) {
      console.error("Cleanup error in enrollments test:", err);
      errors++;
    }
  }

  return { name: "module_2/enrollments", success, errors };
}
