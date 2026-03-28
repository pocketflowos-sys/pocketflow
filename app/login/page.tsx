"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback`;

  async function handleLogin() {
    const supabase = createBrowserSupabaseClient();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleLogin() {
    const supabase = createBrowserSupabaseClient();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl }
    });
    setLoading(false);
    if (error) setError(error.message);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-center rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-glow">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-primary">Welcome Back</p>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight md:text-6xl">
            Sign in and get back to <span className="text-gradient">money clarity.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            PocketFlow now uses real Supabase authentication, paid-access protection, and synced financial data.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card className="p-5">
              <p className="text-xl font-semibold">One dashboard</p>
              <p className="mt-2 text-sm text-muted">See the full picture without switching between apps, notes, and guesswork.</p>
            </Card>
            <Card className="p-5">
              <p className="text-xl font-semibold">Protected access</p>
              <p className="mt-2 text-sm text-muted">Log in, complete payment once, and your account unlocks automatically after verification.</p>
            </Card>
          </div>
          <Link href="/" className="mt-8 inline-flex items-center gap-2 text-sm text-muted transition hover:text-white">
            Back to home <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <Card className="mx-auto w-full max-w-md p-6 md:p-8">
          <div className="mb-6">
            <p className="text-2xl font-semibold">Log in</p>
            <p className="mt-2 text-sm text-muted">Use your PocketFlow account to access your private workspace.</p>
          </div>

          {message ? <div className="mb-4 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">{message}</div> : null}
          {error ? <div className="mb-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div> : null}

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleLogin();
            }}
          >
            <Input label="Email" icon={<Mail className="h-4 w-4" />} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Password" icon={<LockKeyhole className="h-4 w-4" />} placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Sign in
            </Button>
            <Button type="button" variant="secondary" className="w-full" onClick={() => void handleGoogleLogin()} disabled={loading}>
              Continue with Google
            </Button>
            <div className="text-center text-sm text-muted">
              No account yet? <Link href="/signup" className="text-primary">Create one</Link>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
