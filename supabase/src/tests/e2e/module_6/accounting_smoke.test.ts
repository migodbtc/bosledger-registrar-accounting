import supabaseAdmin from "../../../supabaseClient";

export default async function runAccountingSmoke() {
  console.log("\n--- Module 6: accounting smoke test ---");
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
    // Ensure required tables exist and basic query works.
    const tables = [
      "courses",
      "users",
      "student_profile",
      "balances",
      "payments",
    ];
    for (const t of tables) {
      try {
        const { error } = await supabaseAdmin.from(t).select("id").limit(1);
        record(`select from ${t}`, error, !error);
      } catch (err) {
        record(`select from ${t} (threw)`, err, false);
      }
    }
  } catch (err) {
    console.error("Unexpected error in accounting smoke test:", err);
    errors++;
  }

  return { name: "module_6/accounting_smoke", success, errors };
}
