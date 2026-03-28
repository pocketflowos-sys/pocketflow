"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback`;

  async function handleSignup() {
    const supabase = createBrowserSupabaseClient();
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: callbackUrl,
        data: { full_name: fullName }
      }
    });
    setLoading(false);
    if (error) return setError(error.message);

    if (data.session) {
      router.push("/checkout");
      router.refresh();
      return;
    }

    router.push("/login?message=Check your email and confirm your account before logging in.");
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
            <Input label="Password" icon={<LockKeyhole className="h-4 w-4" />} placeholder="Choose a secure password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Create account</Button>
            <Link href="/login" className="block">
              <Button variant="secondary" className="w-full">I already have an account</Button>
            </Link>
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
            <p className="mt-2 text-muted">One-time payment. Instant access after Razorpay verification. No monthly subscription.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
