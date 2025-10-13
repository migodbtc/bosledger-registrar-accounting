/*
{ "module":4, "prefix":"payments", "tags":["payments","balances"], "requiresEnv":[] }
*/
import supabaseAdmin from "../../supabaseClient";

export default async function runPaymentsTest() {
  console.log("\n=== Module 4: student payments test ===");
  const ids: {
    userId?: string;
    courseId?: string;
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
    const courseName = `mod4-pay-course-${Date.now()}`;
    const { data: cData } = await supabaseAdmin
      .from("courses")
      .insert({ name: courseName, title: "Pay Course", years: 4 })
      .select();
    ids.courseId = cData?.[0]?.id;

    const email = `mod4-pay-${Date.now()}@example.com`;
    const { data: uData } = await supabaseAdmin
      .from("users")
      .insert({ email, first_name: "Pay", last_name: "User" })
      .select();
    ids.userId = uData?.[0]?.id;

    const { data: sData } = await supabaseAdmin
      .from("student_profile")
      .insert({ user_id: ids.userId, course_id: ids.courseId })
      .select();
    ids.studentProfileId = sData?.[0]?.id;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 10);
    const { data: bData } = await supabaseAdmin
      .from("balances")
      .insert({
        student_profile_id: ids.studentProfileId,
        amount_due: 2000,
        due_date: dueDate.toISOString().slice(0, 10),
      })
      .select();
    ids.balanceId = bData?.[0]?.id;

    // insert payment referencing the balance (test 1)
    const reference = `PAY-${Date.now()}`;
    const { data: pData, error: pErr } = await supabaseAdmin
      .from("payments")
      .insert({
        student_profile_id: ids.studentProfileId,
        balance_id: ids.balanceId,
        payment_method: "cash",
        reference_number: reference,
        amount_paid: 500,
      })
      .select();
    record("insert payments", pErr, !pErr);
    ids.paymentId = pData?.[0]?.id;

    // test 2: select payment and verify amount and reference
    const { data: got, error: getErr } = await supabaseAdmin
      .from("payments")
      .select("id, reference_number, amount_paid")
      .eq("id", ids.paymentId)
      .single();
    const ok =
      !getErr &&
      (got as any)?.reference_number === reference &&
      Number((got as any)?.amount_paid) === 500;
    record("select payment (verify fields)", getErr, ok);
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
        record("delete balances", error, !error);
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
        record("delete users", error, !error);
      }
      if (ids.courseId) {
        const { error } = await supabaseAdmin
          .from("courses")
          .delete()
          .eq("id", ids.courseId);
        record("delete courses", error, !error);
      }
    } catch (err) {
      console.error("Cleanup error in payments test:", err);
      errors++;
    }
  }

  return { name: "module_4/payments", success, errors };
}
