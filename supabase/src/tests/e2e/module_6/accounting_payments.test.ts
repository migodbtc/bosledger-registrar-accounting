import supabaseAdmin from "../../../supabaseClient";

export default async function runAccountingPaymentsTests() {
  console.log("\n--- Module 6: accounting_payments tests ---");
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

  // Setup: create course, user, student_profile and balance
  try {
    const course = {
      name: `acct-course-${Date.now()}`,
      title: "Acct Course",
      years: 1,
    } as any;
    const { data: cdata, error: cerr } = await supabaseAdmin
      .from("courses")
      .insert(course)
      .select();
    record("setup course", cerr, !cerr);
    ids.courseId = cdata?.[0]?.id;

    const user = { email: `acct+${Date.now()}@example.com` } as any;
    const { data: udata, error: uerr } = await supabaseAdmin
      .from("users")
      .insert(user)
      .select();
    record("setup user", uerr, !uerr);
    ids.userId = udata?.[0]?.id;

    if (ids.userId && ids.courseId) {
      const sp = { user_id: ids.userId, course_id: ids.courseId } as any;
      const { data: sdata, error: serr } = await supabaseAdmin
        .from("student_profile")
        .insert(sp)
        .select();
      record("setup student_profile", serr, !serr);
      ids.studentProfileId = sdata?.[0]?.id;
    }

    if (ids.studentProfileId) {
      const bal = {
        student_profile_id: ids.studentProfileId,
        amount_due: 100.0,
        due_date: new Date().toISOString().slice(0, 10),
      } as any;
      const { data: bdata, error: berr } = await supabaseAdmin
        .from("balances")
        .insert(bal)
        .select();
      record("setup balance", berr, !berr);
      ids.balanceId = bdata?.[0]?.id;
    }
  } catch (err) {
    console.error("Setup error for payments tests:", err);
    errors++;
  }

  // valid insert payment
  try {
    if (ids.studentProfileId && ids.balanceId) {
      const payment = {
        student_profile_id: ids.studentProfileId,
        balance_id: ids.balanceId,
        payment_method: "cash",
        reference_number: `REF-${Date.now()}`,
        amount_paid: 50.0,
      } as any;
      const { data, error } = await supabaseAdmin
        .from("payments")
        .insert(payment)
        .select();
      record("insert valid payment", error, !error);
      if (!error) ids.paymentId = data?.[0]?.id;
    } else {
      record("insert valid payment (skipped - no refs)", null, true);
    }
  } catch (err) {
    console.error("Unexpected error inserting payment:", err);
    errors++;
  }

  // invalid insert (missing required fields)
  try {
    const { error } = await supabaseAdmin
      .from("payments")
      .insert({ amount_paid: -10 });
    record("insert invalid payment (expect error)", error, !!error);
  } catch (err) {
    record("insert invalid payment (threw)", err, true);
  }

  // valid update
  try {
    if (ids.paymentId) {
      const { error } = await supabaseAdmin
        .from("payments")
        .update({ reason: "Test update" })
        .eq("id", ids.paymentId);
      record("update valid payment", error, !error);
    }
  } catch (err) {
    console.error("Unexpected error updating payment:", err);
    errors++;
  }

  // invalid update
  try {
    if (ids.paymentId) {
      const { error } = await supabaseAdmin
        .from("payments")
        .update({ amount_paid: -999 })
        .eq("id", ids.paymentId);
      record("update invalid payment (expect error)", error, !!error);
    } else {
      record("update invalid payment (skipped - no id)", null, true);
    }
  } catch (err) {
    record("update invalid payment (threw)", err, true);
  }

  // valid delete
  try {
    if (ids.paymentId) {
      const { error } = await supabaseAdmin
        .from("payments")
        .delete()
        .eq("id", ids.paymentId);
      record("delete valid payment", error, !error);
      delete ids.paymentId;
    }
  } catch (err) {
    console.error("Unexpected error deleting payment:", err);
    errors++;
  }

  // invalid delete
  try {
    const { error } = await supabaseAdmin
      .from("payments")
      .delete()
      .eq("id", "00000000-0000-0000-0000-000000000000");
    record("delete invalid payment (non-existent)", error, !error);
  } catch (err) {
    record("delete invalid payment (threw)", err, true);
  }

  // cleanup balance, student_profile, user, course
  try {
    if (ids.balanceId)
      await supabaseAdmin.from("balances").delete().eq("id", ids.balanceId);
    if (ids.studentProfileId)
      await supabaseAdmin
        .from("student_profile")
        .delete()
        .eq("id", ids.studentProfileId);
    if (ids.userId)
      await supabaseAdmin.from("users").delete().eq("id", ids.userId);
    if (ids.courseId)
      await supabaseAdmin.from("courses").delete().eq("id", ids.courseId);
  } catch (err) {
    console.error("Cleanup error for payments tests:", err);
  }

  return { name: "module_6/accounting_payments", success, errors };
}
