"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setError("Use at least 8 characters for better security.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    setLoading(true);
    setError("");
    setSuccess("");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    setLoading(false);
    setSuccess("Password updated successfully. You can now log in with your new password.");
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-xl">
        <Card className="p-6 md:p-8">
          <p className="text-2xl font-semibold">Create a new password</p>
          <p className="mt-2 text-sm text-muted">
            Open this page from the reset email, then set your new PocketFlow password.
          </p>

          {error ? <div className="mt-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div> : null}
          {success ? <div className="mt-4 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">{success}</div> : null}

          <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
            <Input
              label="New password"
              icon={<LockKeyhole className="h-4 w-4" />}
              type={showPassword ? "text" : "password"}
              placeholder="Enter a stronger password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
            <Input
              label="Confirm password"
              icon={<LockKeyhole className="h-4 w-4" />}
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter the same password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Updating password..." : "Update password"}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-muted">
            <Link href="/login" className="text-primary">Back to login</Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
