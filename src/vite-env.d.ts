/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  readonly VITE_MELI_APP_ID: string
  readonly VITE_MELI_REDIRECT_URI?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
