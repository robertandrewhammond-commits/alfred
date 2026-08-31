"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client, used inside Client Components
// (e.g. the login form, which needs to call auth methods interactively).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
