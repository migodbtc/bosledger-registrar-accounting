import payments from "./accounting_payments.test";
import balances from "./accounting_balances.test";
import runAccountingSmoke from "./accounting_smoke.test";

export default async function runModule6() {
  console.log("\n=== Running Module 6 tests ===");
  const results = [] as any[];
  // run health check first
  results.push(await runAccountingSmoke());
  results.push(await payments());
  results.push(await balances());

  const summary = results.reduce(
    (acc, r) => {
      acc.success += r.success || 0;
      acc.errors += r.errors || 0;
      return acc;
    },
    { success: 0, errors: 0 }
  );

  console.log(
    `Module 6 finished. successes=${summary.success}, errors=${summary.errors}`
  );
  if (summary.errors > 0) process.exit(2);
  else process.exit(0);
}

runModule6().catch((err) => {
  console.error("Unexpected error running module 6 tests:", err);
  process.exit(1);
});
