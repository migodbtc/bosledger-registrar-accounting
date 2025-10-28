import supabaseAdmin from "../../../supabaseClient";

export default async function runAccountingBalancesTests() {
  console.log("\n--- Module 6: accounting_balances tests ---");
  const ids: {
    courseId?: string;
    userId?: string;
    studentProfileId?: string;
    balanceId?: string;
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

  // Setup: create course, user, student_profile
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

    const user = { email: `acctbal+${Date.now()}@example.com` } as any;
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
  } catch (err) {
    console.error("Setup error for balances tests:", err);
    errors++;
  }

  // valid insert balance
  try {
    if (ids.studentProfileId) {
      const bal = {
        student_profile_id: ids.studentProfileId,
        amount_due: 200.5,
        due_date: new Date().toISOString().slice(0, 10),
      } as any;
      const { data, error } = await supabaseAdmin
        .from("balances")
        .insert(bal)
        .select();
      record("insert valid balance", error, !error);
      if (!error) ids.balanceId = data?.[0]?.id;
    } else {
      record("insert valid balance (skipped - no refs)", null, true);
    }
  } catch (err) {
    console.error("Unexpected error inserting balance:", err);
    errors++;
  }

  // invalid insert (negative amount)
  try {
    const { error } = await supabaseAdmin
      .from("balances")
      .insert({
        student_profile_id: ids.studentProfileId,
        amount_due: -5,
        due_date: new Date().toISOString().slice(0, 10),
      });
    record("insert invalid balance (expect error)", error, !!error);
  } catch (err) {
    record("insert invalid balance (threw)", err, true);
  }

  // valid update
  try {
    if (ids.balanceId) {
      const { error } = await supabaseAdmin
        .from("balances")
        .update({ amount_due: 150 })
        .eq("id", ids.balanceId);
      record("update valid balance", error, !error);
    }
  } catch (err) {
    console.error("Unexpected error updating balance:", err);
    errors++;
  }

  // invalid update
  try {
    if (ids.balanceId) {
      const { error } = await supabaseAdmin
        .from("balances")
        .update({ amount_due: -100 })
        .eq("id", ids.balanceId);
      record("update invalid balance (expect error)", error, !!error);
    } else {
      record("update invalid balance (skipped - no id)", null, true);
    }
  } catch (err) {
    record("update invalid balance (threw)", err, true);
  }

  // valid delete
  try {
    if (ids.balanceId) {
      const { error } = await supabaseAdmin
        .from("balances")
        .delete()
        .eq("id", ids.balanceId);
      record("delete valid balance", error, !error);
      delete ids.balanceId;
    }
  } catch (err) {
    console.error("Unexpected error deleting balance:", err);
    errors++;
  }

  // invalid delete
  try {
    const { error } = await supabaseAdmin
      .from("balances")
      .delete()
      .eq("id", "00000000-0000-0000-0000-000000000000");
    record("delete invalid balance (non-existent)", error, !error);
  } catch (err) {
    record("delete invalid balance (threw)", err, true);
  }

  // cleanup student_profile, user, course
  try {
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
    console.error("Cleanup error for balances tests:", err);
  }

  return { name: "module_6/accounting_balances", success, errors };
}
