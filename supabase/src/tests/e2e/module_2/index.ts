import runUsersTest from "./table_users.test";
import runCoursesTest from "./table_courses.test";
import runStudentProfileTest from "./table_student_profile.test";
import runSubjectsTest from "./table_subjects.test";
import runEnrollmentsTest from "./table_enrollments.test";
import runEnlistmentsTest from "./table_enlistments.test";
import runEnlistedSubjectsTest from "./table_enlisted_subjects.test";
import runBalancesTest from "./table_balances.test";
import runPaymentsTest from "./table_payments.test";

async function runAll() {
  console.log("\nStarting Module 2 (schema & role) table tests...");
  const tests = [
    runUsersTest,
    runCoursesTest,
    runStudentProfileTest,
    runSubjectsTest,
    runEnrollmentsTest,
    runEnlistmentsTest,
    runEnlistedSubjectsTest,
    runBalancesTest,
    runPaymentsTest,
  ];

  let totalSuccess = 0;
  let totalErrors = 0;

  for (const t of tests) {
    try {
      const res = await t();
      totalSuccess += res.success ?? 0;
      totalErrors += res.errors ?? 0;
    } catch (err) {
      console.error("Test runner caught error:", err);
      totalErrors++;
    }
  }

  console.log(
    `\nAll tests finished. successes=${totalSuccess}, errors=${totalErrors}`
  );
  if (totalErrors > 0) process.exit(2);
  else process.exit(0);
}

runAll().catch((err) => {
  console.error("Unexpected error running tests:", err);
  process.exit(1);
});
