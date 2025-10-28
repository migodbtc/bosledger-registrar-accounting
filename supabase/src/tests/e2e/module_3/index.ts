/**
 * Module 3 tests entrypoint (authentication-related tests)
 * - Keeps the same logging and exit behavior as module_2/index.ts
 */
import runAuthCreateDeleteTest from "./auth_create_delete.test";
import runAuthGetUserTest from "./auth_get_user.test";

// Additional module_3 tests
import runAuthInvalidEmailTest from "./auth_invalid_email.test";
import runAuthInvalidPasswordTest from "./auth_invalid_password.test";
import runAuthInjectionTest from "./auth_injection.test";
import runAuthEmojisTest from "./auth_emojis.test";
import runAuthMultipleRequestsTest from "./auth_multiple_requests.test";

async function runModule3() {
  console.log("Starting Module 3 (auth) tests...");
  const tests = [
    // basic create/get/delete
    runAuthCreateDeleteTest,
    runAuthGetUserTest,

    // invalid input cases
    runAuthInvalidEmailTest,
    runAuthInvalidPasswordTest,

    // injection / emoji / concurrency
    runAuthInjectionTest,
    runAuthEmojisTest,
    runAuthMultipleRequestsTest,
  ];

  let totalSuccess = 0;
  let totalErrors = 0;

  for (const t of tests) {
    try {
      const res = await t();
      totalSuccess += res.success ?? 0;
      totalErrors += res.errors ?? 0;
    } catch (err) {
      console.error("Module 3 test caught error:", err);
      totalErrors++;
    }
  }

  console.log(
    `\nModule 3 finished. successes=${totalSuccess}, errors=${totalErrors}`
  );
  if (totalErrors > 0) process.exit(2);
  else process.exit(0);
}

runModule3().catch((err) => {
  console.error("Unexpected error running module 3 tests:", err);
  process.exit(1);
});
