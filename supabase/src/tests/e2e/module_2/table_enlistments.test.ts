import supabaseAdmin from "../../../supabaseClient";

export default async function runEnlistmentsTest() {
  console.log("\n=== Module 2: enlistments test ===");
  const ids: {
    courseId?: string;
    userId?: string;
    studentProfileId?: string;
    enrollmentId?: string;
    enlistmentId?: string;
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
    // reuse flow from enrollments to get enrollment + student_profile
    const { data: cData, error: cErr } = await supabaseAdmin
      .from("courses")
      .insert({
        name: `enl-course-${Date.now()}`,
        title: "ENL Course",
        years: 1,
      })
      .select();
    record("insert courses (for enlistments)", cErr, !cErr);
    if (!cErr) ids.courseId = cData?.[0]?.id;

    const { data: uData, error: uErr } = await supabaseAdmin
      .from("users")
      .insert({
        email: `enl-user-${Date.now()}@example.com`,
        first_name: "ENL",
        last_name: "User",
      })
      .select();
    record("insert users (for enlistments)", uErr, !uErr);
    if (!uErr) ids.userId = uData?.[0]?.id;

    const { data: spData, error: spErr } = await supabaseAdmin
      .from("student_profile")
      .insert({
        user_id: ids.userId,
        course_id: ids.courseId,
        enrollment_date: new Date().toISOString().split("T")[0],
      })
      .select();
    record("insert student_profile (for enlistments)", spErr, !spErr);
    if (!spErr) ids.studentProfileId = spData?.[0]?.id;

    const { data: enData, error: enErr } = await supabaseAdmin
      .from("enrollments")
      .insert({
        student_profile_id: ids.studentProfileId,
        course_id: ids.courseId,
        year_level: "1",
        semester: "1",
        school_year: "2025-2026",
      })
      .select();
    record("insert enrollments (for enlistments)", enErr, !enErr);
    if (!enErr) ids.enrollmentId = enData?.[0]?.id;

    const enlistment = {
      enrollment_id: ids.enrollmentId,
      student_id: ids.studentProfileId,
      course_id: ids.courseId,
    } as any;
    const { data, error } = await supabaseAdmin
      .from("enlistments")
      .insert(enlistment)
      .select();
    record("insert enlistments", error, !error);
    if (!error) ids.enlistmentId = data?.[0]?.id;
  } catch (err) {
    console.error("Unexpected error in enlistments test:", err);
    errors++;
  } finally {
    try {
      if (ids.enlistmentId) {
        const { error } = await supabaseAdmin
          .from("enlistments")
          .delete()
          .eq("id", ids.enlistmentId);
        record("delete enlistments", error, !error);
      }
      if (ids.enrollmentId) {
        const { error } = await supabaseAdmin
          .from("enrollments")
          .delete()
          .eq("id", ids.enrollmentId);
        record("delete enrollments (for enlistments)", error, !error);
      }
      if (ids.studentProfileId) {
        const { error } = await supabaseAdmin
          .from("student_profile")
          .delete()
          .eq("id", ids.studentProfileId);
        record("delete student_profile (for enlistments)", error, !error);
      }
      if (ids.userId) {
        const { error } = await supabaseAdmin
          .from("users")
          .delete()
          .eq("id", ids.userId);
        record("delete users (for enlistments)", error, !error);
      }
      if (ids.courseId) {
        const { error } = await supabaseAdmin
          .from("courses")
          .delete()
          .eq("id", ids.courseId);
        record("delete courses (for enlistments)", error, !error);
      }
    } catch (err) {
      console.error("Cleanup error in enlistments test:", err);
      errors++;
    }
  }

  return { name: "module_2/enlistments", success, errors };
}
