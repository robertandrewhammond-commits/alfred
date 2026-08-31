import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Supabase redirects here after the user clicks the magic-link email,
// with a one-time `code` in the query string. We exchange it for a real
// session (sets the auth cookies), then send them into the app.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/home`);
}
