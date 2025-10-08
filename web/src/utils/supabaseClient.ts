import { createClient } from "@supabase/supabase-js";

// In a Vite-powered app the client-side environment variables are exposed
// via `import.meta.env`. Do NOT use `dotenv` in browser code.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Throw early so it's obvious during dev if env vars are missing.
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Make sure your .env*.local file is in the project root and variables are prefixed with VITE_."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
