"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const rememberedEmailKey = "pocketflow:last-email";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const remembered = window.localStorage.getItem(rememberedEmailKey);
    if (remembered) setEmail(remembered);
  }, []);

  async function handleLogin() {
    const supabase = createBrowserSupabaseClient();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return setError(error.message);
    }
    window.localStorage.setItem(rememberedEmailKey, email);
    router.replace("/dashboard");
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-center rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-glow">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-primary">Welcome back</p>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight md:text-6xl">Sign in and get back to <span className="text-gradient">money clarity.</span></h1>
          <p className="mt-5 max-w-xl text-lg text-muted">PocketFlow keeps users signed in on their device, syncs changes faster, and opens the full finance workspace after login.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card className="p-5"><p className="text-xl font-semibold">One dashboard</p><p className="mt-2 text-sm text-muted">See income, expenses, dues, cards, loans, investments, and assets without switching apps.</p></Card>
            <Card className="p-5"><p className="text-xl font-semibold">Fast access</p><p className="mt-2 text-sm text-muted">Log in once on your device and PocketFlow keeps your session ready.</p></Card>
          </div>
          <Link href="/" className="mt-8 inline-flex items-center gap-2 text-sm text-muted transition hover:text-white">Back to home <ArrowRight className="h-4 w-4" /></Link>
        </section>

        <Card className="mx-auto w-full max-w-md p-6 md:p-8">
          <div className="mb-6"><p className="text-2xl font-semibold">Log in</p><p className="mt-2 text-sm text-muted">Use your PocketFlow account to access your private workspace.</p></div>
          {message ? <div className="mb-4 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">{message}</div> : null}
          {error ? <div className="mb-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div> : null}
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void handleLogin(); }}>
            <Input label="Email" icon={<Mail className="h-4 w-4" />} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Password" icon={<LockKeyhole className="h-4 w-4" />} placeholder="••••••••" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} rightElement={<button type="button" onClick={() => setShowPassword((value) => !value)} className="text-muted transition hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />
            <Button type="submit" className="w-full gap-2" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{loading ? "Signing in..." : "Sign in"}</Button>
            {loading ? <p className="text-center text-sm text-primary">Checking your account and loading your workspace...</p> : null}
            <div className="flex items-center justify-between gap-3 text-sm text-muted"><Link href="/forgot-password" className="text-primary">Forgot password?</Link><span>No account yet? <Link href="/signup" className="text-primary">Create one</Link></span></div>
          </form>
        </Card>
      </div>
    </main>
  );
}
