import studentProfile from "./student_profile.test";
import enrollments from "./student_enrollments.test";
import balances from "./student_balances.test";
import payments from "./student_payments.test";

export default async function runModule4() {
  console.log("\n=== Running Module 4 tests ===");
  const results = [] as any[];
  results.push(await studentProfile());
  results.push(await enrollments());
  results.push(await balances());
  results.push(await payments());
  // simple aggregate summary to match other modules' shape
  const summary = results.reduce(
    (acc, r) => {
      acc.success += r.success || 0;
      acc.errors += r.errors || 0;
      return acc;
    },
    { success: 0, errors: 0 }
  );
  return {
    name: "module_4",
    success: summary.success,
    errors: summary.errors,
    details: results,
  };
}

// If this file is executed directly with ts-node (as our runner does), invoke the
// exported function so the module produces console logs and an appropriate exit
// code, mirroring the behavior in module_2 and module_3.
runModule4()
  .then((res) => {
    console.log(
      `\nModule 4 finished. successes=${res.success}, errors=${res.errors}`
    );
    if (res.errors > 0) process.exit(2);
    else process.exit(0);
  })
  .catch((err) => {
    console.error("Unexpected error running module 4 tests:", err);
    process.exit(1);
  });
