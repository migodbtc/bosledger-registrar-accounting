/// <reference types="vite/client" />

// Add explicit types for environment variables your app uses.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // more env vars...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
