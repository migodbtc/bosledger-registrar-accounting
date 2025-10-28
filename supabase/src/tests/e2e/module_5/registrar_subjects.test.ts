import supabaseAdmin from "../../../supabaseClient";

export default async function runRegistrarSubjectsTests() {
  console.log("\n--- Module 5: registrar_subjects tests ---");
  const ids: { subjectId?: string; courseId?: string } = {};
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

  // Ensure a course exists to reference
  try {
    const course = {
      name: `reg-course-${Date.now()}`,
      title: "Course for subjects test",
      years: 1,
    } as any;
    const { data, error } = await supabaseAdmin
      .from("courses")
      .insert(course)
      .select();
    if (!error) ids.courseId = data?.[0]?.id;
    record("setup course", error, !error);
  } catch (err) {
    console.error("Error creating prerequisite course:", err);
    errors++;
  }

  try {
    const subject = {
      course_id: ids.courseId,
      subject_code: `SUB-${Date.now()}`,
      subject_name: "Registrar Test Subject",
      units: 3,
    } as any;
    const { data, error } = await supabaseAdmin
      .from("subjects")
      .insert(subject)
      .select();
    record("insert valid subject", error, !error);
    if (!error) ids.subjectId = data?.[0]?.id;
  } catch (err) {
    console.error("Unexpected error inserting subject:", err);
    errors++;
  }

  // invalid insert
  try {
    const bad = { course_id: null, units: -1 } as any;
    const { error } = await supabaseAdmin.from("subjects").insert(bad);
    record("insert invalid subject (expect error)", error, !!error);
  } catch (err) {
    record("insert invalid subject (threw)", err, true);
  }

  // valid update
  try {
    if (ids.subjectId) {
      const { error } = await supabaseAdmin
        .from("subjects")
        .update({ subject_name: "Updated subject" })
        .eq("id", ids.subjectId);
      record("update valid subject", error, !error);
    }
  } catch (err) {
    console.error("Unexpected error updating subject:", err);
    errors++;
  }

  // invalid update
  try {
    if (ids.subjectId) {
      const { error } = await supabaseAdmin
        .from("subjects")
        .update({ units: 0 })
        .eq("id", ids.subjectId);
      record("update invalid subject (expect error)", error, !!error);
    } else {
      record("update invalid subject (skipped - no id)", null, true);
    }
  } catch (err) {
    record("update invalid subject (threw)", err, true);
  }

  // delete valid
  try {
    if (ids.subjectId) {
      const { error } = await supabaseAdmin
        .from("subjects")
        .delete()
        .eq("id", ids.subjectId);
      record("delete valid subject", error, !error);
      delete ids.subjectId;
    }
  } catch (err) {
    console.error("Unexpected error deleting subject:", err);
    errors++;
  }

  // invalid delete
  try {
    const { error } = await supabaseAdmin
      .from("subjects")
      .delete()
      .eq("id", "00000000-0000-0000-0000-000000000000");
    record("delete invalid subject (non-existent)", error, !error);
  } catch (err) {
    record("delete invalid subject (threw)", err, true);
  }

  // cleanup course
  try {
    if (ids.courseId)
      await supabaseAdmin.from("courses").delete().eq("id", ids.courseId);
  } catch (err) {
    console.error("Cleanup error for course:", err);
  }

  return { name: "module_5/registrar_subjects", success, errors };
}
