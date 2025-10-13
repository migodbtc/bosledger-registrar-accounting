import supabaseAdmin from "../../supabaseClient";

export default async function runPaymentsTest() {
  console.log("\n=== Module 2: payments test ===");
  const ids: {
    courseId?: string;
    userId?: string;
    studentProfileId?: string;
    balanceId?: string;
    paymentId?: string;
  } = {};
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
        name: `pay-course-${Date.now()}`,
        title: "PAY Course",
        years: 1,
      })
      .select();
    record("insert courses (for payments)", cErr, !cErr);
    if (!cErr) ids.courseId = cData?.[0]?.id;

    const { data: uData, error: uErr } = await supabaseAdmin
      .from("users")
      .insert({
        email: `pay-user-${Date.now()}@example.com`,
        first_name: "PAY",
        last_name: "User",
      })
      .select();
    record("insert users (for payments)", uErr, !uErr);
    if (!uErr) ids.userId = uData?.[0]?.id;

    const { data: spData, error: spErr } = await supabaseAdmin
      .from("student_profile")
      .insert({
        user_id: ids.userId,
        course_id: ids.courseId,
        enrollment_date: new Date().toISOString().split("T")[0],
      })
      .select();
    record("insert student_profile (for payments)", spErr, !spErr);
    if (!spErr) ids.studentProfileId = spData?.[0]?.id;

    const { data: balData, error: balErr } = await supabaseAdmin
      .from("balances")
      .insert({
        student_profile_id: ids.studentProfileId,
        amount_due: 500,
        due_date: new Date().toISOString().split("T")[0],
      })
      .select();
    record("insert balances (for payments)", balErr, !balErr);
    if (!balErr) ids.balanceId = balData?.[0]?.id;

    const payment = {
      student_profile_id: ids.studentProfileId,
      balance_id: ids.balanceId,
      payment_method: "cash",
      reference_number: `REF-${Date.now()}`,
      payment_date: new Date().toISOString().split("T")[0],
      amount_paid: 500,
    } as any;
    const { data, error } = await supabaseAdmin
      .from("payments")
      .insert(payment)
      .select();
    record("insert payments", error, !error);
    if (!error) ids.paymentId = data?.[0]?.id;
  } catch (err) {
    console.error("Unexpected error in payments test:", err);
    errors++;
  } finally {
    try {
      if (ids.paymentId) {
        const { error } = await supabaseAdmin
          .from("payments")
          .delete()
          .eq("id", ids.paymentId);
        record("delete payments", error, !error);
      }
      if (ids.balanceId) {
        const { error } = await supabaseAdmin
          .from("balances")
          .delete()
          .eq("id", ids.balanceId);
        record("delete balances (for payments)", error, !error);
      }
      if (ids.studentProfileId) {
        const { error } = await supabaseAdmin
          .from("student_profile")
          .delete()
          .eq("id", ids.studentProfileId);
        record("delete student_profile (for payments)", error, !error);
      }
      if (ids.userId) {
        const { error } = await supabaseAdmin
          .from("users")
          .delete()
          .eq("id", ids.userId);
        record("delete users (for payments)", error, !error);
      }
      if (ids.courseId) {
        const { error } = await supabaseAdmin
          .from("courses")
          .delete()
          .eq("id", ids.courseId);
        record("delete courses (for payments)", error, !error);
      }
    } catch (err) {
      console.error("Cleanup error in payments test:", err);
      errors++;
    }
  }

  return { name: "module_2/payments", success, errors };
}
