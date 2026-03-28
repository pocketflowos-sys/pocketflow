"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPasswordUpdateUrl } from "@/lib/app-url";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createBrowserSupabaseClient();
    setLoading(true);
    setError("");
    setSuccess("");

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: getPasswordUpdateUrl()
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    setLoading(false);
    setSuccess("Password reset link sent. Please check your email inbox and spam folder.");
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-xl">
        <Card className="p-6 md:p-8">
          <p className="text-2xl font-semibold">Reset your password</p>
          <p className="mt-2 text-sm text-muted">
            Enter your PocketFlow account email. We will send you a secure password reset link.
          </p>

          {error ? <div className="mt-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div> : null}
          {success ? <div className="mt-4 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">{success}</div> : null}

          <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
            <Input
              label="Email"
              type="email"
              icon={<Mail className="h-4 w-4" />}
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Sending link..." : "Send reset link"}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-muted">
            Remembered it? <Link href="/login" className="text-primary">Back to login</Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
