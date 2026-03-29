"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAuthCallbackUrl } from "@/lib/app-url";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const rememberedEmailKey = "pocketflow:last-email";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const callbackUrl = `${getAuthCallbackUrl()}?next=/checkout`;

  useEffect(() => {
    const remembered = window.localStorage.getItem(rememberedEmailKey);
    if (remembered) setEmail(remembered);
  }, []);


  async function handleGoogleSignup() {
    const supabase = createBrowserSupabaseClient();
    setGoogleLoading(true);
    setLoading(false);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callbackUrl } });
    if (error) {
      setGoogleLoading(false);
      setError(error.message);
    }
  }

  async function handleSignup() {
    const supabase = createBrowserSupabaseClient();
    setLoading(true);
    setGoogleLoading(false);
    setError("");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: callbackUrl,
        data: { full_name: fullName }
      }
    });
    if (error) {
      setLoading(false);
      return setError(error.message);
    }
    window.localStorage.setItem(rememberedEmailKey, email);

    if (data.session) {
      router.replace("/checkout");
      return;
    }

    router.replace("/login?message=Check your email and confirm your account before logging in.");
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="order-2 p-6 md:order-1 md:p-8">
          <div className="mb-6">
            <p className="text-2xl font-semibold">Create your PocketFlow account</p>
            <p className="mt-2 text-sm text-muted">Step 1: sign up. Step 2: complete the one-time payment. Step 3: unlock your dashboard forever.</p>
          </div>

          {error ? <div className="mb-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div> : null}

          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void handleSignup(); }}>
            <Input label="Full name" icon={<UserRound className="h-4 w-4" />} placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Input label="Email" icon={<Mail className="h-4 w-4" />} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input
              label="Password"
              icon={<LockKeyhole className="h-4 w-4" />}
              placeholder="Choose a secure password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-muted transition hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            <Button type="submit" className="w-full gap-2" disabled={loading || googleLoading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{loading ? "Creating account..." : "Create account"}</Button>
            {loading ? <p className="text-center text-sm text-primary">Creating your account and preparing checkout...</p> : null}
            <Button type="button" variant="secondary" className="w-full gap-2" onClick={() => void handleGoogleSignup()} disabled={loading || googleLoading}>
              {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {googleLoading ? "Redirecting to Google..." : "Continue with Google"}
            </Button>
            {googleLoading ? <p className="text-center text-sm text-primary">Taking you to Google sign in...</p> : null}
            <Link href="/login" className="block">
              <Button variant="secondary" className="w-full">I already have an account</Button>
            </Link>
            <p className="text-center text-xs text-muted">By continuing, you agree to the PocketFlow terms, privacy policy, and refund policy.</p>
          </form>
        </Card>

        <section className="order-1 flex flex-col justify-center rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-glow md:order-2">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-primary">One-time access</p>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight md:text-6xl">
            Built for <span className="text-gradient">real people</span> with real money.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            PocketFlow is simple enough for students and powerful enough for business owners, freelancers, and investors.
          </p>
          <div className="mt-8 rounded-3xl border border-primary/20 bg-primary/10 p-6">
            <p className="text-3xl font-semibold">₹99</p>
            <p className="mt-2 text-muted">One-time payment. Instant access after Cashfree verification. No monthly subscription.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
