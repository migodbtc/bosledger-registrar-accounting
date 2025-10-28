import supabaseAdmin from "../../../supabaseClient";

export default async function runRegistrarEnrollmentsTests() {
  console.log("\n--- Module 5: registrar_enrollments tests ---");
  const ids: {
    enrollmentId?: string;
    studentProfileId?: string;
    courseId?: string;
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

  // Setup: create a course and a user + student_profile
  try {
    const course = {
      name: `reg-course-${Date.now()}`,
      title: "Course for enrollments",
      years: 1,
    } as any;
    const { data: cdata, error: cerr } = await supabaseAdmin
      .from("courses")
      .insert(course)
      .select();
    if (!cerr) ids.courseId = cdata?.[0]?.id;
    record("setup course for enrollments", cerr, !cerr);

    const user = { email: `enr+${Date.now()}@example.com` } as any;
    const { data: udata, error: uerr } = await supabaseAdmin
      .from("users")
      .insert(user)
      .select();
    record("setup user for enrollments", uerr, !uerr);
    const userId = udata?.[0]?.id;

    if (userId && ids.courseId) {
      const sp = { user_id: userId, course_id: ids.courseId } as any;
      const { data: sdata, error: serr } = await supabaseAdmin
        .from("student_profile")
        .insert(sp)
        .select();
      record("setup student_profile for enrollments", serr, !serr);
      if (!serr) ids.studentProfileId = sdata?.[0]?.id;
    }
  } catch (err) {
    console.error("Setup error for enrollments test:", err);
    errors++;
  }

  // valid insert
  try {
    if (ids.studentProfileId && ids.courseId) {
      const enroll = {
        student_profile_id: ids.studentProfileId,
        course_id: ids.courseId,
        year_level: "1",
        semester: "1",
        school_year: "2025-2026",
      } as any;
      const { data, error } = await supabaseAdmin
        .from("enrollments")
        .insert(enroll)
        .select();
      record("insert valid enrollment", error, !error);
      if (!error) ids.enrollmentId = data?.[0]?.id;
    } else {
      record("insert valid enrollment (skipped - no refs)", null, true);
    }
  } catch (err) {
    console.error("Unexpected error inserting enrollment:", err);
    errors++;
  }

  // invalid insert (missing refs)
  try {
    const { error } = await supabaseAdmin
      .from("enrollments")
      .insert({ student_profile_id: null });
    record("insert invalid enrollment (expect error)", error, !!error);
  } catch (err) {
    record("insert invalid enrollment (threw)", err, true);
  }

  // valid update
  try {
    if (ids.enrollmentId) {
      const { error } = await supabaseAdmin
        .from("enrollments")
        .update({ status: "enrolled" })
        .eq("id", ids.enrollmentId);
      record("update valid enrollment", error, !error);
    }
  } catch (err) {
    console.error("Unexpected error updating enrollment:", err);
    errors++;
  }

  // invalid update
  try {
    if (ids.enrollmentId) {
      const { error } = await supabaseAdmin
        .from("enrollments")
        .update({ student_profile_id: "not-a-uuid" })
        .eq("id", ids.enrollmentId);
      record("update invalid enrollment (expect error)", error, !!error);
    } else {
      record("update invalid enrollment (skipped - no id)", null, true);
    }
  } catch (err) {
    record("update invalid enrollment (threw)", err, true);
  }

  // valid delete
  try {
    if (ids.enrollmentId) {
      const { error } = await supabaseAdmin
        .from("enrollments")
        .delete()
        .eq("id", ids.enrollmentId);
      record("delete valid enrollment", error, !error);
      delete ids.enrollmentId;
    }
  } catch (err) {
    console.error("Unexpected error deleting enrollment:", err);
    errors++;
  }

  // invalid delete
  try {
    const { error } = await supabaseAdmin
      .from("enrollments")
      .delete()
      .eq("id", "00000000-0000-0000-0000-000000000000");
    record("delete invalid enrollment (non-existent)", error, !error);
  } catch (err) {
    record("delete invalid enrollment (threw)", err, true);
  }

  // Cleanup student_profile, user, course
  try {
    if (ids.studentProfileId)
      await supabaseAdmin
        .from("student_profile")
        .delete()
        .eq("id", ids.studentProfileId);
    // attempt to remove any created user/course by searching recent rows; in tests we created specific ones
  } catch (err) {
    console.error("Cleanup error for enrollments test:", err);
  }

  return { name: "module_5/registrar_enrollments", success, errors };
}
