"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="login-wrap">
      <div className="login-box">
        <h1>Alfred</h1>
        <p className="muted" style={{ marginBottom: 20 }}>
          Sign in with your email — no password needed.
        </p>
        {sent ? (
          <p>Check your email for a sign-in link.</p>
        ) : (
          <form onSubmit={sendLink}>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ marginBottom: 12 }}
            />
            <button type="submit" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Sending…" : "Send sign-in link"}
            </button>
          </form>
        )}
        {error && (
          <p style={{ color: "var(--danger)", marginTop: 12 }}>{error}</p>
        )}
      </div>
    </div>
  );
}
