import supabaseAdmin from "../../../supabaseClient";

export default async function runRegistrarStudentsTests() {
  console.log("\n--- Module 5: registrar_students tests ---");
  const ids: { userId?: string; studentProfileId?: string; courseId?: string } =
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

  // create prerequisite course
  try {
    const course = {
      name: `reg-course-${Date.now()}`,
      title: "Course for students test",
      years: 1,
    } as any;
    const { data, error } = await supabaseAdmin
      .from("courses")
      .insert(course)
      .select();
    if (!error) ids.courseId = data?.[0]?.id;
    record("setup course", error, !error);
  } catch (err) {
    console.error("Error creating course for students test:", err);
    errors++;
  }

  // valid insert: create a user then student_profile
  try {
    const user = {
      email: `test+${Date.now()}@example.com`,
      first_name: "Registrar",
      last_name: "Student",
    } as any;
    const { data: udata, error: uerr } = await supabaseAdmin
      .from("users")
      .insert(user)
      .select();
    record("insert user for student", uerr, !uerr);
    if (!uerr) ids.userId = udata?.[0]?.id;

    if (ids.userId && ids.courseId) {
      const sp = { user_id: ids.userId, course_id: ids.courseId } as any;
      const { data: sdata, error: serr } = await supabaseAdmin
        .from("student_profile")
        .insert(sp)
        .select();
      record("insert valid student_profile", serr, !serr);
      if (!serr) ids.studentProfileId = sdata?.[0]?.id;
    }
  } catch (err) {
    console.error("Unexpected error inserting student:", err);
    errors++;
  }

  // invalid insert (missing user_id)
  try {
    const bad = { course_id: ids.courseId } as any; // missing user_id
    const { error } = await supabaseAdmin.from("student_profile").insert(bad);
    record("insert invalid student_profile (expect error)", error, !!error);
  } catch (err) {
    record("insert invalid student_profile (threw)", err, true);
  }

  // valid update
  try {
    if (ids.studentProfileId) {
      const { error } = await supabaseAdmin
        .from("student_profile")
        .update({ status: "enrolled" })
        .eq("id", ids.studentProfileId);
      record("update valid student_profile", error, !error);
    }
  } catch (err) {
    console.error("Unexpected error updating student_profile:", err);
    errors++;
  }

  // invalid update
  try {
    if (ids.studentProfileId) {
      const { error } = await supabaseAdmin
        .from("student_profile")
        .update({ course_id: null })
        .eq("id", ids.studentProfileId);
      record("update invalid student_profile (expect error)", error, !!error);
    } else {
      record("update invalid student_profile (skipped - no id)", null, true);
    }
  } catch (err) {
    record("update invalid student_profile (threw)", err, true);
  }

  // valid delete
  try {
    if (ids.studentProfileId) {
      const { error } = await supabaseAdmin
        .from("student_profile")
        .delete()
        .eq("id", ids.studentProfileId);
      record("delete valid student_profile", error, !error);
      delete ids.studentProfileId;
    }
  } catch (err) {
    console.error("Unexpected error deleting student_profile:", err);
    errors++;
  }

  // invalid delete (non-existent)
  try {
    const { error } = await supabaseAdmin
      .from("student_profile")
      .delete()
      .eq("id", "00000000-0000-0000-0000-000000000000");
    record("delete invalid student_profile (non-existent)", error, !error);
  } catch (err) {
    record("delete invalid student_profile (threw)", err, true);
  }

  // cleanup user and course
  try {
    if (ids.userId)
      await supabaseAdmin.from("users").delete().eq("id", ids.userId);
    if (ids.courseId)
      await supabaseAdmin.from("courses").delete().eq("id", ids.courseId);
  } catch (err) {
    console.error("Cleanup error for students test:", err);
  }

  return { name: "module_5/registrar_students", success, errors };
}
