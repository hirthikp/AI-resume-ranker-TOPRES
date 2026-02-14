/// <reference types="vite/client" />

// Optionally, you can also explicitly type any custom Vite env vars here:
// interface ImportMetaEnv {
//   readonly DEV: boolean;
//   readonly PROD: boolean;
//   readonly VITE_API_URL?: string;
// }
// interface ImportMeta {
//   readonly env: ImportMetaEnv;
// }
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly GEMINI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}