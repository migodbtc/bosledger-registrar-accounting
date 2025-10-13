import supabaseAdmin from "../../supabaseClient";

export async function deletePublicUsersByAuthId(authUserId: string) {
  try {
    const { error } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("auth_user_id", authUserId);
    return error;
  } catch (err) {
    return err;
  }
}

export async function deleteAuthUserWithRetry(
  id: string,
  attempts = 3,
  delayMs = 300
) {
  for (let i = 0; i < attempts; i++) {
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (!error) return null;
      // if error, wait and retry
      await new Promise((r) => setTimeout(r, delayMs));
    } catch (err) {
      // if last attempt, return err
      if (i === attempts - 1) return err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return new Error("failed deleteAuthUserWithRetry");
}

export function makeTestEmail(base = "test") {
  // include timestamp + short random hex to avoid collisions across runs
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 0xffff).toString(16);
  return `${base}-${ts}-${rand}@example.com`;
}
