/*
{ "module":4, "prefix":"enrollment", "tags":["enrollment","crud"], "requiresEnv":[] }
*/
import supabaseAdmin from "../../supabaseClient";

export default async function runEnrollmentsTest() {
  console.log("\n=== Module 4: student enrollments test ===");
  const ids: {
    userId?: string;
    courseId?: string;
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
    // setup course, user, and student_profile (fail fast)
    const courseName = `mod4-enr-course-${Date.now()}`;
    const { data: cData } = await supabaseAdmin
      .from("courses")
      .insert({ name: courseName, title: "Enr Course", years: 4 })
      .select();
    ids.courseId = cData?.[0]?.id;

    const email = `mod4-enr-${Date.now()}@example.com`;
    const { data: uData } = await supabaseAdmin
      .from("users")
      .insert({ email, first_name: "Enr", last_name: "User" })
      .select();
    ids.userId = uData?.[0]?.id;

    const { data: sData } = await supabaseAdmin
      .from("student_profile")
      .insert({ user_id: ids.userId, course_id: ids.courseId })
      .select();
    ids.studentProfileId = sData?.[0]?.id;

    // test 1: create an enrollment for the student_profile
    const { data: eData, error: eErr } = await supabaseAdmin
      .from("enrollments")
      .insert({
        student_profile_id: ids.studentProfileId,
        course_id: ids.courseId,
        year_level: "1",
        semester: "1",
        school_year: "2025-2026",
      })
      .select();
    record("insert enrollments", eErr, !eErr);
    ids.enrollmentId = eData?.[0]?.id;

    // test 2: verify enrollment has a status field
    const { data: got, error: getErr } = await supabaseAdmin
      .from("enrollments")
      .select("id, student_profile_id, course_id, status")
      .eq("id", ids.enrollmentId)
      .single();
    record(
      "select enrollment (has status)",
      getErr,
      !getErr && !!(got as any)?.status
    );
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
      console.error("Cleanup error in enrollments test:", err);
      errors++;
    }
  }

  return { name: "module_4/enrollments", success, errors };
}
