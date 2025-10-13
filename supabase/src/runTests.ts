import supabaseAdmin from "./supabaseClient";

type IDs = {
  courseId?: string;
  userId?: string;
  studentProfileId?: string;
  subjectId?: string;
  enrollmentId?: string;
  enlistmentId?: string;
  enlistedSubjectId?: string;
  balanceId?: string;
};

async function cleanup(ids: IDs) {
  console.log("Running cleanup for created test rows...");
  // delete in reverse dependency order when possible
  if (ids.enlistedSubjectId) {
    await supabaseAdmin
      .from("enlisted_subjects")
      .delete()
      .eq("id", ids.enlistedSubjectId);
    console.log("deleted enlisted_subjects", ids.enlistedSubjectId);
  }
  if (ids.enlistmentId) {
    await supabaseAdmin.from("enlistments").delete().eq("id", ids.enlistmentId);
    console.log("deleted enlistment", ids.enlistmentId);
  }
  if (ids.enrollmentId) {
    await supabaseAdmin.from("enrollments").delete().eq("id", ids.enrollmentId);
    console.log("deleted enrollment", ids.enrollmentId);
  }
  if (ids.subjectId) {
    await supabaseAdmin.from("subjects").delete().eq("id", ids.subjectId);
    console.log("deleted subject", ids.subjectId);
  }
  if (ids.balanceId) {
    await supabaseAdmin.from("balances").delete().eq("id", ids.balanceId);
    console.log("deleted balance", ids.balanceId);
  }
  if (ids.studentProfileId) {
    await supabaseAdmin
      .from("student_profile")
      .delete()
      .eq("id", ids.studentProfileId);
    console.log("deleted student_profile", ids.studentProfileId);
  }
  if (ids.userId) {
    await supabaseAdmin.from("users").delete().eq("id", ids.userId);
    console.log("deleted user", ids.userId);
  }
  if (ids.courseId) {
    await supabaseAdmin.from("courses").delete().eq("id", ids.courseId);
    console.log("deleted course", ids.courseId);
  }
}

async function smokeTest() {
  console.log("Starting Supabase extended schema smoke tests...");
  const ids: IDs = {};

  let successCount = 0;
  let errorCount = 0;

  const record = (label: string, err: any, ok: boolean) => {
    if (ok) {
      successCount++;
      console.log(`[OK] ${label}`);
    } else {
      errorCount++;
      console.error(`[ERR] ${label}:`, err);
    }
  };

  // quick select to verify connectivity
  const { data: selectData, error: selectError } = await supabaseAdmin
    .from("courses")
    .select("*")
    .limit(1);
  record("select courses (limit 1)", selectError, !selectError);
  if (!selectError)
    console.log("Select succeeded. Rows:", selectData?.length ?? 0);

  try {
    // 1) create course
    const course = {
      name: `test-course-${Date.now()}`,
      title: "Test Course (automated)",
      years: 1,
      description: "Inserted by test harness",
    } as any;
    const { data: courseData, error: courseErr } = await supabaseAdmin
      .from("courses")
      .insert(course)
      .select();
    record("insert course", courseErr, !courseErr);
    if (!courseErr) {
      ids.courseId = courseData?.[0]?.id;
      console.log("Created course id=", ids.courseId);
    }

    // 2) create user
    const user = {
      email: `test-user-${Date.now()}@example.com`,
      first_name: "Test",
      last_name: "User",
    } as any;
    const { data: userData, error: userErr } = await supabaseAdmin
      .from("users")
      .insert(user)
      .select();
    record("insert user", userErr, !userErr);
    if (!userErr) {
      ids.userId = userData?.[0]?.id;
      console.log("Created user id=", ids.userId);
    }

    // 3) create student_profile
    const studentProfile = {
      user_id: ids.userId,
      course_id: ids.courseId,
      enrollment_date: new Date().toISOString().split("T")[0],
    } as any;
    const { data: spData, error: spErr } = await supabaseAdmin
      .from("student_profile")
      .insert(studentProfile)
      .select();
    record("insert student_profile", spErr, !spErr);
    if (!spErr) {
      ids.studentProfileId = spData?.[0]?.id;
      console.log("Created student_profile id=", ids.studentProfileId);
    }

    // 4) create subject
    const subject = {
      course_id: ids.courseId,
      subject_code: `TS-${Date.now() % 10000}`,
      subject_name: "Test Subject",
      units: 3,
      semester: 1,
    } as any;
    const { data: subjectData, error: subjectErr } = await supabaseAdmin
      .from("subjects")
      .insert(subject)
      .select();
    record("insert subject", subjectErr, !subjectErr);
    if (!subjectErr) {
      ids.subjectId = subjectData?.[0]?.id;
      console.log("Created subject id=", ids.subjectId);
    }

    // 5) create enrollment (links student_profile and course)
    const enrollment = {
      student_profile_id: ids.studentProfileId,
      course_id: ids.courseId,
      year_level: "1",
      semester: "1",
      school_year: "2025-2026",
    } as any;
    const { data: enrollmentData, error: enrollmentErr } = await supabaseAdmin
      .from("enrollments")
      .insert(enrollment)
      .select();
    record("insert enrollment", enrollmentErr, !enrollmentErr);
    if (!enrollmentErr) {
      ids.enrollmentId = enrollmentData?.[0]?.id;
      console.log("Created enrollment id=", ids.enrollmentId);
    }

    // 6) create enlistment referencing the enrollment and student_profile
    const enlistment = {
      enrollment_id: ids.enrollmentId,
      student_id: ids.studentProfileId,
      course_id: ids.courseId,
    } as any;
    const { data: enlistmentData, error: enlistErr } = await supabaseAdmin
      .from("enlistments")
      .insert(enlistment)
      .select();
    record("insert enlistment", enlistErr, !enlistErr);
    if (!enlistErr) {
      ids.enlistmentId = enlistmentData?.[0]?.id;
      console.log("Created enlistment id=", ids.enlistmentId);
    }

    // 7) create enlisted_subjects linking enlistment and subject
    const enlistedSubject = {
      enlistment_id: ids.enlistmentId,
      subject_id: ids.subjectId,
    } as any;
    const { data: esData, error: esErr } = await supabaseAdmin
      .from("enlisted_subjects")
      .insert(enlistedSubject)
      .select();
    record("insert enlisted_subjects", esErr, !esErr);
    if (!esErr) {
      ids.enlistedSubjectId = esData?.[0]?.id;
      console.log("Created enlisted_subjects id=", ids.enlistedSubjectId);
    }

    // 8) create a balance for the student_profile
    const balance = {
      student_profile_id: ids.studentProfileId,
      amount_due: 1000,
      due_date: new Date(Date.now() + 7 * 24 * 3600 * 1000)
        .toISOString()
        .split("T")[0],
    } as any;
    const { data: balData, error: balErr } = await supabaseAdmin
      .from("balances")
      .insert(balance)
      .select();
    record("insert balance", balErr, !balErr);
    if (!balErr) {
      ids.balanceId = balData?.[0]?.id;
      console.log("Created balance id=", ids.balanceId);
    }

    console.log("All inserts attempted. IDs:", ids);
  } catch (err) {
    console.error("Test sequence encountered an unexpected error:", err);
    errorCount++;
  } finally {
    // attempt cleanup of created rows and record delete outcomes
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
        record("delete enlistment", error, !error);
      }
      if (ids.enrollmentId) {
        const { error } = await supabaseAdmin
          .from("enrollments")
          .delete()
          .eq("id", ids.enrollmentId);
        record("delete enrollment", error, !error);
      }
      if (ids.subjectId) {
        const { error } = await supabaseAdmin
          .from("subjects")
          .delete()
          .eq("id", ids.subjectId);
        record("delete subject", error, !error);
      }
      if (ids.balanceId) {
        const { error } = await supabaseAdmin
          .from("balances")
          .delete()
          .eq("id", ids.balanceId);
        record("delete balance", error, !error);
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
        record("delete user", error, !error);
      }
      if (ids.courseId) {
        const { error } = await supabaseAdmin
          .from("courses")
          .delete()
          .eq("id", ids.courseId);
        record("delete course", error, !error);
      }

      console.log(
        `\nTest summary: ${successCount} succeeded, ${errorCount} failed`
      );
      if (errorCount > 0) process.exit(2);
      else process.exit(0);
    } catch (err) {
      console.error("Cleanup failed:", err);
      process.exit(3);
    }
  }
}

smokeTest().catch((err) => {
  console.error("Unexpected error in smokeTest:", err);
  process.exit(1);
});
