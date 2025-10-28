(function () {
  // placeholder to be replaced by runModule5 when executed; we export default below
})();

import courses from "./registrar_courses.test";
import subjects from "./registrar_subjects.test";
import enrollments from "./registrar_enrollments.test";
import students from "./registrar_students.test";

export default async function runModule5() {
  console.log("\n=== Running Module 5 (registrar) tests ===");
  const results = [] as any[];
  results.push(await courses());
  results.push(await subjects());
  results.push(await enrollments());
  results.push(await students());

  const summary = results.reduce(
    (acc, r) => {
      acc.success += r.success || 0;
      acc.errors += r.errors || 0;
      return acc;
    },
    { success: 0, errors: 0 }
  );

  console.log(
    `\nModule 5 finished. successes=${summary.success}, errors=${summary.errors}`
  );
  if (summary.errors > 0) process.exit(2);
  else process.exit(0);
}

// Run when executed directly
runModule5().catch((err) => {
  console.error("Unexpected error running module 5 tests:", err);
  process.exit(1);
});
