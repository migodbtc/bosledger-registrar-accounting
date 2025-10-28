import supabaseAdmin from "../../../supabaseClient";

export default async function runEnlistedSubjectsTest() {
  console.log("\n=== Module 2: enlisted_subjects test ===");
  const ids: {
    courseId?: string;
    userId?: string;
    studentProfileId?: string;
    enrollmentId?: string;
    enlistmentId?: string;
    subjectId?: string;
    enlistedSubjectId?: string;
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
      .insert({ name: `es-course-${Date.now()}`, title: "ES Course", years: 1 })
      .select();
    record("insert courses (for enlisted_subjects)", cErr, !cErr);
    if (!cErr) ids.courseId = cData?.[0]?.id;

    const { data: uData, error: uErr } = await supabaseAdmin
      .from("users")
      .insert({
        email: `es-user-${Date.now()}@example.com`,
        first_name: "ES",
        last_name: "User",
      })
      .select();
    record("insert users (for enlisted_subjects)", uErr, !uErr);
    if (!uErr) ids.userId = uData?.[0]?.id;

    const { data: spData, error: spErr } = await supabaseAdmin
      .from("student_profile")
      .insert({
        user_id: ids.userId,
        course_id: ids.courseId,
        enrollment_date: new Date().toISOString().split("T")[0],
      })
      .select();
    record("insert student_profile (for enlisted_subjects)", spErr, !spErr);
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
    record("insert enrollments (for enlisted_subjects)", enErr, !enErr);
    if (!enErr) ids.enrollmentId = enData?.[0]?.id;

    const { data: elData, error: elErr } = await supabaseAdmin
      .from("enlistments")
      .insert({
        enrollment_id: ids.enrollmentId,
        student_id: ids.studentProfileId,
        course_id: ids.courseId,
      })
      .select();
    record("insert enlistments (for enlisted_subjects)", elErr, !elErr);
    if (!elErr) ids.enlistmentId = elData?.[0]?.id;

    const { data: sData, error: sErr } = await supabaseAdmin
      .from("subjects")
      .insert({
        course_id: ids.courseId,
        subject_code: `ES-${Date.now() % 10000}`,
        subject_name: "ES Subject",
        units: 3,
        semester: 1,
      })
      .select();
    record("insert subjects (for enlisted_subjects)", sErr, !sErr);
    if (!sErr) ids.subjectId = sData?.[0]?.id;

    const enlisted = {
      enlistment_id: ids.enlistmentId,
      subject_id: ids.subjectId,
    } as any;
    const { data, error } = await supabaseAdmin
      .from("enlisted_subjects")
      .insert(enlisted)
      .select();
    record("insert enlisted_subjects", error, !error);
    if (!error) ids.enlistedSubjectId = data?.[0]?.id;
  } catch (err) {
    console.error("Unexpected error in enlisted_subjects test:", err);
    errors++;
  } finally {
    try {
      if (ids.enlistedSubjectId) {
        const { error } = await supabaseAdmin
          .from("enlisted_subjects")
          .delete()
          .eq("id", ids.enlistedSubjectId);
        record("delete enlisted_subjects", error, !error);
      }
      if (ids.enlistmentId) {
        const { error } = await supabaseAdmin
          .from("enlistments")
          .delete()
          .eq("id", ids.enlistmentId);
        record("delete enlistments (for enlisted_subjects)", error, !error);
      }
      if (ids.enrollmentId) {
        const { error } = await supabaseAdmin
          .from("enrollments")
          .delete()
          .eq("id", ids.enrollmentId);
        record("delete enrollments (for enlisted_subjects)", error, !error);
      }
      if (ids.subjectId) {
        const { error } = await supabaseAdmin
          .from("subjects")
          .delete()
          .eq("id", ids.subjectId);
        record("delete subjects (for enlisted_subjects)", error, !error);
      }
      if (ids.studentProfileId) {
        const { error } = await supabaseAdmin
          .from("student_profile")
          .delete()
          .eq("id", ids.studentProfileId);
        record("delete student_profile (for enlisted_subjects)", error, !error);
      }
      if (ids.userId) {
        const { error } = await supabaseAdmin
          .from("users")
          .delete()
          .eq("id", ids.userId);
        record("delete users (for enlisted_subjects)", error, !error);
      }
      if (ids.courseId) {
        const { error } = await supabaseAdmin
          .from("courses")
          .delete()
          .eq("id", ids.courseId);
        record("delete courses (for enlisted_subjects)", error, !error);
      }
    } catch (err) {
      console.error("Cleanup error in enlisted_subjects test:", err);
      errors++;
    }
  }

  return { name: "module_2/enlisted_subjects", success, errors };
}
