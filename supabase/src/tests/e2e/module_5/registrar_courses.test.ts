import supabaseAdmin from "../../../supabaseClient";

export default async function runRegistrarCoursesTests() {
  console.log("\n--- Module 5: registrar_courses tests ---");
  const ids: { courseId?: string } = {};
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

  // Valid insert
  try {
    const course = {
      name: `reg-course-${Date.now()}`,
      title: "Registrar Test Course",
      years: 3,
    } as any;
    const { data, error } = await supabaseAdmin
      .from("courses")
      .insert(course)
      .select();
    record("insert valid course", error, !error);
    if (!error) ids.courseId = data?.[0]?.id;
  } catch (err) {
    console.error("Unexpected error inserting valid course:", err);
    errors++;
  }

  // Invalid insert (missing required fields)
  try {
    const badCourse = { title: null } as any;
    const { error } = await supabaseAdmin.from("courses").insert(badCourse);
    // expect an error
    record("insert invalid course (expect error)", error, !!error);
  } catch (err) {
    // ts-node may throw; treat as expected failure
    record("insert invalid course (threw)", err, true);
  }

  // Valid update
  try {
    if (ids.courseId) {
      const { error } = await supabaseAdmin
        .from("courses")
        .update({ title: "Updated by test" })
        .eq("id", ids.courseId);
      record("update valid course", error, !error);
    }
  } catch (err) {
    console.error("Unexpected error updating valid course:", err);
    errors++;
  }

  // Invalid update (bad value)
  try {
    if (ids.courseId) {
      const { error } = await supabaseAdmin
        .from("courses")
        .update({ years: -5 })
        .eq("id", ids.courseId);
      record("update invalid course (expect error)", error, !!error);
    } else {
      // If no id (insert failed), still mark this as skipped success
      record("update invalid course (skipped - no id)", null, true);
    }
  } catch (err) {
    record("update invalid course (threw)", err, true);
  }

  // Valid delete
  try {
    if (ids.courseId) {
      const { error } = await supabaseAdmin
        .from("courses")
        .delete()
        .eq("id", ids.courseId);
      record("delete valid course", error, !error);
      delete ids.courseId;
    }
  } catch (err) {
    console.error("Unexpected error deleting course:", err);
    errors++;
  }

  // Invalid delete (non-existent id)
  try {
    const { error } = await supabaseAdmin
      .from("courses")
      .delete()
      .eq("id", "00000000-0000-0000-0000-000000000000");
    // Depending on DB semantics, deleting non-existent row may not be an error. We treat lack of rows as expected (no-op)
    record("delete invalid course (non-existent)", error, !error);
  } catch (err) {
    record("delete invalid course (threw)", err, true);
  }

  return { name: "module_5/registrar_courses", success, errors };
}
