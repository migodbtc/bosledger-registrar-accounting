import supabaseAdmin from "../../../supabaseClient";

export default async function runSubjectsTest() {
  console.log("\n=== Module 2: subjects test ===");
  const ids: { courseId?: string; subjectId?: string } = {};
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
        name: `sub-course-${Date.now()}`,
        title: "Sub Course",
        years: 1,
      })
      .select();
    record("insert courses (for subjects)", cErr, !cErr);
    if (!cErr) ids.courseId = cData?.[0]?.id;

    const subject = {
      course_id: ids.courseId,
      subject_code: `TS-${Date.now() % 10000}`,
      subject_name: "Test Subject",
      units: 3,
      semester: 1,
    } as any;
    const { data, error } = await supabaseAdmin
      .from("subjects")
      .insert(subject)
      .select();
    record("insert subjects", error, !error);
    if (!error) ids.subjectId = data?.[0]?.id;
  } catch (err) {
    console.error("Unexpected error in subjects test:", err);
    errors++;
  } finally {
    try {
      if (ids.subjectId) {
        const { error } = await supabaseAdmin
          .from("subjects")
          .delete()
          .eq("id", ids.subjectId);
        record("delete subjects", error, !error);
      }
      if (ids.courseId) {
        const { error } = await supabaseAdmin
          .from("courses")
          .delete()
          .eq("id", ids.courseId);
        record("delete courses (for subjects)", error, !error);
      }
    } catch (err) {
      console.error("Cleanup error in subjects test:", err);
      errors++;
    }
  }

  return { name: "module_2/subjects", success, errors };
}
