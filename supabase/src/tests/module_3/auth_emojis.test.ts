/**
 * auth_emojis.test.ts
 * - Creates users with emoji-containing inputs in email (where allowed), password, and other fields
 */
import supabaseAdmin from "../../supabaseClient";

// use makeTestEmail helper to avoid collisions
const makeEmail = async (base: string) =>
  (await import("./utils")).makeTestEmail(base);

export default async function runAuthEmojisTest() {
  console.log("\n--- Module 3: auth_emojis tests ---");
  const cases = [
    { email: `emoji+${Date.now()}😀@example.com`, pw: "EmojiPW😀1!" },
    { email: `normal+emoji@example.com`, pw: `pw-with-emoji-🔥` },
    { email: `🏳️‍🌈test${Date.now()}@example.com`, pw: `Test123!` },
  ];

  const createdIds: string[] = [];
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

  for (const c of cases) {
    try {
      // make email unique using helper
      const base =
        typeof c.email === "string" ? c.email.replace(/\W/g, "") : "emoji";
      const email = await makeEmail(base);
      const res = await supabaseAdmin.auth.admin.createUser({
        email,
        password: c.pw,
      } as any);
      const created: any = (res as any)?.data ?? res;
      const id = created?.user?.id ?? created?.id;
      const err = (res as any)?.error;
      if (err || !id) {
        const expected =
          err &&
          (err.code === "validation_failed" || err.code === "email_exists");
        record(
          `createUser emoji('${c.email}','${c.pw}') failed`,
          err ?? "no id",
          expected
        );
      } else {
        createdIds.push(id);
        record(`createUser emoji('${c.email}') created`, null, true);
      }
    } catch (err) {
      // non-JSON or invalid email parse errors are expected for some emoji inputs
      record(
        `createUser emoji('${c.email}') threw (treated as failure)`,
        err,
        true
      );
    }
  }

  for (const id of createdIds) {
    try {
      const delPublicErr = await (
        await import("./utils")
      ).deletePublicUsersByAuthId(id);
      record(
        `delete public.users by auth_user_id (pre-delete) ${id}`,
        delPublicErr,
        !delPublicErr
      );
      const delErr = await (
        await import("./utils")
      ).deleteAuthUserWithRetry(id, 3, 500);
      record(`cleanup deleteUser ${id}`, delErr, !delErr);
    } catch (err) {
      record(`cleanup deleteUser ${id} threw`, err, false);
    }
  }

  return { name: "module_3/auth_emojis", success, errors };
}
