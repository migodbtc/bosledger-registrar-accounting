import supabaseAdmin from "../../supabaseClient";

export default async function runCoursesTest() {
  console.log("\n=== Module 2: courses test ===");
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

  try {
    const course = {
      name: `test-course-${Date.now()}`,
      title: "Test Course (automated)",
      years: 1,
      description: "Inserted by test harness",
    } as any;
    const { data, error } = await supabaseAdmin
      .from("courses")
      .insert(course)
      .select();
    record("insert courses", error, !error);
    if (!error) ids.courseId = data?.[0]?.id;
  } catch (err) {
    console.error("Unexpected error in courses test:", err);
    errors++;
  } finally {
    try {
      if (ids.courseId) {
        const { error } = await supabaseAdmin
          .from("courses")
          .delete()
          .eq("id", ids.courseId);
        record("delete courses", error, !error);
      }
    } catch (err) {
      console.error("Cleanup error in courses test:", err);
      errors++;
    }
  }

  return { name: "module_2/courses", success, errors };
}
